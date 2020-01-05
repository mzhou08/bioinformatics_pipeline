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
from bio_app.models import protein_sequence, request_queue
from bio_app.forms import MEMERequestForm, BLASTPRequestForm

from Bio.Blast.Applications import NcbiblastpCommandline
from io import StringIO
from Bio.Blast import NCBIXML
from Bio.Seq import Seq
from Bio.SeqRecord import SeqRecord
from Bio import SeqIO

import subprocess

import os
import shutil
import unittest
from moca.helpers import get_cpu_count
from moca.pipeline import Pipeline
from moca.bedoperations import fimo_to_sites
from moca.helpers import read_memefile

logger = logging.getLogger(__name__)

def get_upload_csv_template(request): 
    return render(request, 'upload_csv.html', context={})

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

        page = requests.get(sequence_string)
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
            uniprot_page = requests.get(uniprot_url)
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