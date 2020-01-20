from django.forms.models import model_to_dict

import math, json, logging
from datetime import timedelta
from django.utils import timezone
from django.views.generic import FormView  

from lxml import html
import requests

import os
import pandas as pd
from pandas import ExcelWriter
from pandas import ExcelFile

import numpy as pd
import pandas as pd
from django.conf import settings
from django.contrib import auth
from django.contrib.flatpages.models import FlatPage
from django.contrib import messages
from django.db import connection as conn
from django.http import HttpResponse, HttpResponseForbidden, HttpResponseRedirect
from django.shortcuts import redirect, render
#from pinax.eventlog.models import log as eventlog

from django.core.exceptions import ObjectDoesNotExist
from collections import namedtuple
from django.urls import reverse, reverse_lazy

from django.shortcuts import redirect
from bio_app.models import protein_sequence, request_queue, gene_sequence, miRNA_sequence, gene_miRNA_mapping, Cluster_miRNA, Cluster_Gene
from bio_app.forms import MEMERequestForm, BLASTPRequestForm, clustermiRNAForm

from Bio.Blast.Applications import NcbiblastpCommandline
from io import StringIO
from Bio.Blast import NCBIXML
from Bio.Seq import Seq
from Bio.SeqRecord import SeqRecord
from Bio import SeqIO
from Bio import Entrez

import subprocess

import os
import shutil
import unittest
from moca.helpers import get_cpu_count
from moca.pipeline import Pipeline
from moca.bedoperations import fimo_to_sites
from moca.helpers import read_memefile

from urllib.error import HTTPError
import mygene

logger = logging.getLogger(__name__)

# upload protein csv
def get_upload_csv_template(request): 
    return render(request, 'upload_csv.html', context={})

# process uploaded protein csv file
def upload_csv(request):

    excel_data = list()
    
    data = {}
    if "GET" == request.method:
        return render(request, "upload_csv.html", data)
    # if not GET, then proceed
    try:
        csv_file = request.FILES["csv_file"]
        #if not csv_file.name.endswith('.csv'):
		#	messages.error(request,'File is not CSV type')
		#	return HttpResponseRedirect(reverse("upload_csv"))
        
        #if file is too large, return
		#if csv_file.multiple_chunks():
		#	messages.error(request,"Uploaded file is too big (%.2f MB)." % (csv_file.size/(1000*1000),))
	    #		return HttpResponseRedirect(reverse("upload_csv"))
        
        #file_data = csv_file.read().decode("utf-8")
        df = pd.read_excel(csv_file, sheet_name='Sheet1')
        print(df.head())
        # add new column
        df["Fasta"] = ""

        # prepare to output new csv file with fasta info
        #os.remove("fasta.csv")
        for index, row in df.iterrows():
            id = row["Id"]
            df.at[index, "Name"]=row["Name"].strip()
            df.at[index, "Name_Class"]=df.at[index, "Name"] + "_" + row["Class"]
            url_string = "http://peroxibase.toulouse.inra.fr/tools/get_fasta/" + str(id) + "/PEP"

            print(url_string)
            page = requests.get(url_string)
            tree = html.fromstring(page.content)

            #This will get fasta
            fasta = tree.xpath('//textarea[@name="task_data_input"]/text()')
            print(fasta[0])
            df.at[index, "Fasta"] = fasta[0]
        
        for index, row in df.iterrows():
            row_data = list()
            row_data.append(row["Id"])
            row_data.append(row["Name"].strip())
            row_data.append(row["Class"])
            row_data.append(row["Fasta"])
            excel_data.append(row_data)

            # save protein sequence info into database
            record = protein_sequence(protein_id=row["Id"], 
                                    protein_name = row["Name"].strip(),
                                    protein_class = row["Class"],
                                    protein_taxo = row["Taxo"],
                                    protein_fasta = row["Fasta"],
                                    protein_uniprot_id = "",
                                    protein_SWISSMODEL_id = "")
            record.save()
        
        print(excel_data)

    except Exception as e:
        logging.getLogger("error_logger").error("Unable to upload file. "+repr(e))
        messages.error(request,"Unable to upload file. "+repr(e))
    
    return render(request, 'upload_result.html', context={"excel_data":excel_data})

# upload gene miRNA cluster file
def get_upload_gene_miRNA_cluster_template(request): 
    return render(request, 'upload_gene_miRNA_cluster.html', context={})

def upload_gene_miRNA_cluster_csv(request):
    excel_data = list()
    
    data = {}
    if "GET" == request.method:
        return render(request, "upload_gene_miRNA_cluster.html", data)
    # if not GET, then proceed
    try:
        csv_file = request.FILES["csv_file"]
        
        df = pd.read_excel(csv_file, sheet_name='Sheet1')
        print(df.head())
        # prepare to output new csv file with fasta info
        for index, row in df.iterrows():
            cluster_id = int(row["cluster_id"])
            print(cluster_id)

            # split and get gene and miRNA ids
            content = row["content"]
            gene_miRNA_list = content.split(" ")
            print(gene_miRNA_list)

            # hsa-mir-
            for gene_miRNA_id in gene_miRNA_list:
                print(gene_miRNA_id)
                gene_miRNA_type = "gene"
                if (gene_miRNA_id.startswith("hsa-mir-")):
                    # update the type to be miRNA
                    gene_miRNA_type = "miRNA"

                    # insert into miRNA_sequence table
                    miRNA_sequence_record = miRNA_sequence(miRNA_id = gene_miRNA_id,
                                                    miRNA_fasta = "")
                    miRNA_sequence_record.save()
                else:
                    # insert into gene_sequence table
                    gene_sequence_record = gene_sequence(gene_id = gene_miRNA_id,
                                                    gene_fasta = "")
                    gene_sequence_record.save()
                
                print(gene_miRNA_type)
                # save entry into gene_miRNA_cluster table
                if (gene_miRNA_type=='gene'):
                    cluster_gene_record = Cluster_Gene(cluster_id = cluster_id,
                                                        gene_id = gene_miRNA_id)
                    cluster_gene_record.save()
                else:
                    cluster_miRNA_record = Cluster_miRNA(cluster_id = cluster_id,
                                                        miRNA_id = gene_miRNA_id)
                    cluster_miRNA_record.save()

    except Exception as e:
        logging.getLogger("error_logger").error("Unable to upload file. "+repr(e))
        messages.error(request,"Unable to upload file. "+repr(e))
    
    return render(request, 'index.html', context={})

# upload gene miRNA mapping file
def get_upload_gene_miRNA_mapping_template(request): 
    return render(request, 'upload_gene_miRNA_mapping.html', context={})

def upload_gene_miRNA_mapping_csv(request):
    excel_data = list()
    
    data = {}
    if "GET" == request.method:
        return render(request, "upload_gene_miRNA_mapping.html", data)
    # if not GET, then proceed
    try:
        csv_file = request.FILES["csv_file"]
        
        df = pd.read_excel(csv_file, sheet_name='Sheet1')
        print(df.head())
        # prepare to output new csv file with fasta info
        for index, row in df.iterrows():
            gene_id = row["gene_id"]
            print(gene_id)

            miRNA_id = row["miRNA_id"]
            print(miRNA_id)
            
            # save entry into gene_miRNA_mapping table
            gene_miRNA_mapping_record = gene_miRNA_mapping(gene_id = gene_id,
                                                            miRNA_id = miRNA_id)
            gene_miRNA_mapping_record.save()

    except Exception as e:
        logging.getLogger("error_logger").error("Unable to upload file. "+repr(e))
        messages.error(request,"Unable to upload file. "+repr(e))
    
    return render(request, 'index.html', context={})

def query_uniprot(request):
    print("in query_uniprot")
    df = pd.DataFrame(list(protein_sequence.objects.all().values("protein_name", "protein_class")))
    # add new column
    df["uniprot_id"] = ""
    df["modbase_id"] = ""
    df["swiss_model_id"] = ""

    ## fasta format 
    ## >ID|NAME|...
    ## SEQUENCE VALUE
    ## empty line
    line_count = 1
    not_found_count = 0
    found_count = 0
    excel_data = list()

    for index, row in df.iterrows():
        # init
        modbase_id =""
        swiss_model_id=""

        sequence_name = row["protein_name"]
        print(sequence_name)

        uniprot_id = ""
        protein_id = ""

        # use the sequence name to query UniProtKB
        page_string = ""
        sequence_string = "https://www.uniprot.org/uniprot/?query=" + sequence_name + "&sort=score"

        page = requests.get(sequence_string, verify=False)
        page_string = page.content
        if "Sorry, no results found for your search term" in str(page_string):
            not_found_count = not_found_count + 1
            print("Cannot find " + sequence_name + "in UniProtKB. ")
        else:
            found_count = found_count + 1
            tree = html.fromstring(page_string)
            #print(page_string)

            #This will get uniprot_id
            uniprot_id_list = tree.xpath("//a[starts-with(@href, '/uniprot/') and not (starts-with(@href, '/uniprot/?'))]/text()")
            uniprot_id=uniprot_id_list[0]
            df.at[index, "uniprot_id"] = uniprot_id

            # get the uniprot id page
            uniprot_url = "https://www.uniprot.org/uniprot/" + uniprot_id
            uniprot_page = requests.get(uniprot_url, verify=False)
            uniprot_page_string = uniprot_page.content
            uniprot_page_tree = html.fromstring(uniprot_page_string)
            #This will get SWISS-MODEL REPOSITORY (SMR)
            swiss_model_id_list = uniprot_page_tree.xpath("//a[starts-with(@href, 'https://swissmodel.expasy.org/repository/uniprot/')]/text()")
            if len(swiss_model_id_list) != 0:
                swiss_model_id = swiss_model_id_list[0]
                df.at[index, "swiss_model_id"] = swiss_model_id
                print(swiss_model_id)




            #print(uniprot_id)
            #print(f"""https://modbase.compbio.ucsf.edu/modbase-cgi/model_search.cgi?searchkw=name&kword={uniprot_id}""")

            # use the uniprot_id to query uniprot
            modbase_url = "https://modbase.compbio.ucsf.edu/modbase-cgi/model_search.cgi?searchmode=default&displaymode=moddetail&searchproperties=database_id&searchvalue=" + uniprot_id + "&organism=ALL&organismtext="
            modbase_page = requests.get(modbase_url)
            
            if modbase_page.history:
                ##print("Request was redirected")
                ##for resp in modbase_page.history:
                    ##print(f"""{resp.status_code}    {resp.url}""")
                ##print("Final destination:")
                #print(modbase_page.status_code, modbase_page.url)
                final_modbase_page = requests.get(modbase_page.url)
            else:
                ##print("Request was not redirected")
                final_modbase_page = modbase_page

            modbase_page_tree=html.fromstring(final_modbase_page.content)

            protein_id_list=modbase_page_tree.xpath("//a[starts-with(@href, 'http://www.rcsb.org/pdb/explore/explore.do?structureId=')]/text()")
            if len(protein_id_list) > 0:
                modbase_id = protein_id_list[0]
                df.at[index, "modbase_id"] = modbase_id
                #print(f"""found protein_id {protein_id}""")
            #else:
                #print("no protein found")
        
        if (len(swiss_model_id) != 0 or len(modbase_id) != 0):
            print( "insert")
            print(swiss_model_id)
            print(modbase_id)
            protein = protein_sequence.objects.get(protein_name=sequence_name)
            protein.protein_SWISSMODEL_id = swiss_model_id
            protein.protein_MODBASE_id = modbase_id
            protein.save()

        # for output
        row_data = list()
        row_data.append(row["protein_name"])
        row_data.append(row["protein_class"])
        row_data.append(row["modbase_id"])
        row_data.append(row["swiss_model_id"])
        excel_data.append(row_data)

    print(excel_data)

        
    return render(request, 'uniprot_result.html', context={"excel_data":excel_data})

def get_fasta_data(protein_class_name):
    proteins_df = pd.DataFrame(list(protein_sequence.objects.filter(protein_class=protein_class_name).values("protein_name", "protein_fasta")))
    # filter out catalase fasta values
    fasta_value=""
    for index, row in proteins_df.iterrows():
        # init
        print(row["protein_name"])
        print(row["protein_fasta"])
        fasta_value = fasta_value + row["protein_fasta"]
    return fasta_value

# insert Blastp request into queue
def blastp_view(request):

    if request.method == 'POST':
        print(request.POST.get("protein_class_category"))
        try:
            request_record = request_queue(request_type = "protein_blastp", 
                                    request_detail = request.POST.get("protein_class_category"),
                                    requester_email = "mzhou08@gmail.com",
                                    request_status= "")
            request_record.save()
        except error:
            print(error)
        return render( request, "index.html")
    
    context = {} 
    context['form'] = BLASTPRequestForm()
    return render( request, "blastp.html", context)

def meme_view(request):

    if request.method == 'POST':
        print(request.POST.get("protein_class_category"))
        try:
            request_record = request_queue(request_type = "protein_meme", 
                                    request_detail = request.POST.get("protein_class_category"),
                                    requester_email = "mzhou08@gmail.com",
                                    request_status= "")
            request_record.save()
        except error:
            print(error)
        return render( request, "index.html")
    
    context = {} 
    context['form'] = MEMERequestForm()
    return render( request, "meme.html", context)

def get_home_template(request):
    return render(request, 'index.html', context={})

################ miRNA ###############
def get_request_miRNA_sequence_template(request):
    return render(request, 'request_miRNA_sequence.html')

def query_miRNA_sequence(request):
    # get all miRNA records with empty sequence
    miRNA_list = list(miRNA_sequence.objects.filter(miRNA_fasta = ""))
    for miRNA in miRNA_list:
        miRNA_id = miRNA.miRNA_id
        # use the sequence name to query miRBase
        lookup_string = "http://www.mirbase.org/cgi-bin/textsearch_json.pl?q={}".format(miRNA_id)
        print(lookup_string)
        page = requests.get(lookup_string)
        page_string = page.content
        if "did not return any results" in str(page_string):
            not_found_count = not_found_count + 1
            print("Cannot find " + miRNA_id + "in miRBase. ")
        else:
            json_data = json.loads(page_string.decode("utf-8"))
            # get the MI ID number
            MI_ID = (json_data["data"][0]["accession"])

            # based on the MI ID number to get miRNA sequence
            MI_lookup_string = "http://www.mirbase.org/cgi-bin/get_seq.pl?acc={}".format(MI_ID)
            print(MI_lookup_string)
            MI_page = requests.get(MI_lookup_string)
            
            MI_page_tree=html.fromstring(MI_page.content)
            print(MI_page_tree)
            miRNA_sequence_list=MI_page_tree.xpath('//pre/text()')
            print(miRNA_sequence_list[0])

            # save the fasta info into miRNA_fasta field
            miRNA.miRNA_fasta = miRNA_sequence_list[0]
            miRNA.save()

    return render(request, 'index.html', context={})

################ gene ###############
def get_request_gene_sequence_template(request):
    return render(request, 'request_gene_sequence.html')

class EnsemblRestClient(object):
    def __init__(self, server='http://rest.ensembl.org', reqs_per_sec=15):
        self.server = server
        self.reqs_per_sec = reqs_per_sec
        self.req_count = 0
        self.last_req = 0

    def perform_rest_action(self, endpoint, hdrs=None, params=None):
        if hdrs is None:
            hdrs = {}

        if 'Content-Type' not in hdrs:
            hdrs['Content-Type'] = 'application/json'

        if params:
            endpoint += '?' + urlencode(params)

        data = None

        # check if we need to rate limit ourselves
        if self.req_count >= self.reqs_per_sec:
            delta = time.time() - self.last_req
            if delta < 1:
                time.sleep(1 - delta)
            self.last_req = time.time()
            self.req_count = 0
        
        try:
            request = Request(self.server + endpoint, headers=hdrs)
            response = urlopen(request)
            content = response.read()
            if content:
                print(str(content, 'utf-8'))
                data = json.loads(str(content, 'utf-8'))
            self.req_count += 1

        except HTTPError as e:
            # check if we are being rate limited by the server
            if e.code == 429:
                if 'Retry-After' in e.headers:
                    retry = e.headers['Retry-After']
                    time.sleep(float(retry))
                    self.perform_rest_action(endpoint, hdrs, params)
            else:
                sys.stderr.write('Request failed for {0}: Status code: {1.code} Reason: {1.reason}\n'.format(endpoint, e))
           
        return data

    def get_variants(self, species, symbol):
        genes = self.perform_rest_action(
            endpoint='/xrefs/symbol/{0}/{1}'.format(species, symbol), 
            params={'object_type': 'gene'}
        )
        if genes:
            stable_id = genes[0]['id']
            variants = self.perform_rest_action(
                '/overlap/id/{0}'.format(stable_id),
                params={'feature': 'variation'}
            )
            return variants
        return None

def query_gene_sequence(request):
    # get all gene records with empty sequence
    gene_list = list(gene_sequence.objects.order_by("gene_id").filter(gene_fasta = ""))

    # defining the api-endpoint 
    API_ENDPOINT = "http://utrdb.ba.itb.cnr.it/search"

    for gene in gene_list:
        gene_id = gene.gene_id

        #get 3utr fasta from http://utrdb.ba.itb.cnr.it/
        Entrez.email = "mzhou08@gmail.com"  # Always tell NCBI who you are
        animal = 'Homo sapien' 
        search_string = gene_id+"[Gene] AND "+animal+"[Organism]"
        print(search_string)
        # AND mRNA[Filter] AND RefSeq[Filter]"
        #Now we have a search string to seach for ids

        #!/usr/bin/env python
        mg = mygene.MyGeneInfo()

        result = mg.query(gene_id, scopes="symbol", fields=["ensembl"], species="human", verbose=False)
        for hit in result["hits"]:
            if "ensembl" in hit and "gene" in hit["ensembl"]:
                print(gene_id + " " + hit["ensembl"]["gene"])

        # data to be sent to api 
        #data = {'utr_db':0, 
        #        'utr_type':3, 
        #        'organism':9606, 
        #        'accession_type':0,
        #        'ids': gene_id,
        #        'output': "html"} 

        # sending post request and saving response as response object 
        #page = requests.post(url = API_ENDPOINT, data = data) 
        #print(page.text)
        #tree = html.fromstring(page.text)
        
        # extracting response text
        #utrlink_list = tree.xpath("//a[starts-with(@href, '/getutr/')]/text()")
        #print(tree)
        
        #try:
        #    handle = Entrez.esearch(db="gene", term=search_string)
        #    record = Entrez.read(handle)
        #    ids = record['IdList']
        #    print(ids)
        #    #this returns ids as a list if and if no id found it's []. Now lets assume it return 1 item in the list.
        #    if len(ids) > 0:
        #        ncbi_gene_id = ids[0] #you must implement an if to deal with <0 or >1 cases
        #        print(ncbi_gene_id)
        #        # save the ncbi_gene_id info into ncbi_gene_id field
        #        gene.ncbi_gene_id = ncbi_gene_id
        #        gene.save()

        #        handle = Entrez.efetch(db="nucleotide", id=ncbi_gene_id, rettype="fasta", retmode="text")
        #        record = handle.read()
         #       print(record.rstrip('\n'))
                # save the fasta info into gene_fasta field
        #        gene.gene_fasta = record.rstrip('\n')
         #       gene.save()
        #except HTTPError:
        #    print("HTTP error")
        #this will give you a fasta string which you can save to a file
        #out_handle = open('myfasta.fasta', 'w')
        #out_handle.write(record.rstrip('\n'))
        
        
        # use the sequence name to query uniProt
        
        #uniprot_lookup_string = "https://www.uniprot.org/uniprot/?query={}&fil=organism%3A%22Homo+sapiens+%28Human%29+%5B9606%5D%22&sort=score".format(gene_id)
        #niprot_page = requests.get(uniprot_lookup_string)
        #uniprot_page_string = uniprot_page.content
        #if "Sorry, no results found for your search term." in str(uniprot_page_string):
        #    not_found_count = not_found_count + 1
        #    print("Cannot find " + gene_id + "in miRBase. ")
        #else:
        #    uniprot_page_tree=html.fromstring(uniprot_page.content)
        #    gene_sequence_list=uniprot_page_tree.get("td[@class='entryID']/a[starts-with(@href, '/uniprot/')]/text()")
        #    print(gene_sequence_list[0])

            # save the fasta info into miRNA_sequence field
            #miRNA.miRNA_fasta = miRNA_sequence_list[0]
            #miRNA.save()

    return render(request, 'index.html', context={})

## show the select cluster->miRNA form
def list_cluster_miRNA_view(request):
    cluster_id = ''
    miRNA_id = ''
    if request.method == 'POST':
        try:
            # the selected cluster id
            cluster_id = request.POST.get("cluster")
            print(cluster_id)
            miRNA_id = request.POST.get("miRNA")
            miRNA_list = list(Cluster_miRNA.objects.filter(id=miRNA_id).values_list('miRNA_id', flat=True))
            # the selected miDNA name
            miRNA_id = miRNA_list[0]
            print(miRNA_id)

            # save the request type into database request_queue table
            data = {}
            data['miRNA_id'] = miRNA_id
            data['cluster_id'] = cluster_id
            json_data = json.dumps(data)
            try:
                request_record = request_queue(request_type = "get_gene_for_miRNA", 
                                        request_detail = json_data,
                                        requester_email = "mzhou08@gmail.com",
                                        request_status= "")
                request_record.save()
            except error:
                print(error)
            return render( request, "index.html")
            
            
        except error:
            print(error)
        return render( request, "index.html")

    context = {} 
    context['form'] = clustermiRNAForm()
    return render(request, 'clustermiRNA.html', context)
    
def load_cluster_miRNAs(request):
    cluster_id = request.GET.get('cluster_id')
    miRNAs = gene_miRNA_cluster.objects.filter(cluster_id=cluster_id, gene_miRNA_type='miRNA').order_by('gene_miRNA_id')
    return render(request, 'miRNA_dropdown_list_options.html', {'miRNAs': miRNAs})


    