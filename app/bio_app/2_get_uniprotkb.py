from lxml import html
import requests

import os
import pandas as pd
from pandas import ExcelWriter
from pandas import ExcelFile

df = pd.read_csv("./result_1_fasta.csv")
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
for index, row in df.iterrows():
    # init
    sequence_name = row["Name"]
    print(sequence_name)

    uniprot_id = ""
    protein_id = ""

    # use the sequence name to query UniProtKB
    page_string = ""
    page = requests.get(f"""https://www.uniprot.org/uniprot/?query={sequence_name}&sort=score""")
    page_string = page.content
    if "Sorry, no results found for your search term" in str(page_string):
        not_found_count = not_found_count + 1
        print(f"""Cannot find {sequence_name} in UniProtKB. """)
    else:
        found_count = found_count + 1
        tree = html.fromstring(page_string)
        #print(page_string)

        #This will get uniprot_id
        uniprot_id_list = tree.xpath("//a[starts-with(@href, '/uniprot/') and not (starts-with(@href, '/uniprot/?'))]/text()")
        uniprot_id=uniprot_id_list[0]
        df.at[index, "uniprot_id"] = uniprot_id

        # get the uniprot id page
        uniprot_page = requests.get(f"""https://www.uniprot.org/uniprot/{uniprot_id}""")
        uniprot_page_string = uniprot_page.content
        uniprot_page_tree = html.fromstring(uniprot_page_string)
        #This will get SWISS-MODEL REPOSITORY (SMR)
        swiss_model_id_list = uniprot_page_tree.xpath("//a[starts-with(@href, 'https://swissmodel.expasy.org/repository/uniprot/')]/text()")
        print(len(swiss_model_id_list))
        if len(swiss_model_id_list) != 0:
            swiss_model_id = swiss_model_id_list[0]
            df.at[index, "swiss_model_id"] = swiss_model_id
            print(swiss_model_id)




        #print(uniprot_id)
        #print(f"""https://modbase.compbio.ucsf.edu/modbase-cgi/model_search.cgi?searchkw=name&kword={uniprot_id}""")

        # use the uniprot_id to query uniprot
        modbase_page = requests.get(f"""https://modbase.compbio.ucsf.edu/modbase-cgi/model_search.cgi?searchmode=default&displaymode=moddetail&searchproperties=database_id&searchvalue={uniprot_id}&organism=ALL&organismtext=""")
        
        if modbase_page.history:
            ##print("Request was redirected")
            ##for resp in modbase_page.history:
                ##print(f"""{resp.status_code}    {resp.url}""")
            ##print("Final destination:")
            #print(modbase_page.status_code, modbase_page.url)
            final_modbase_page = requests.get(f"""{modbase_page.url}""")
        else:
            ##print("Request was not redirected")
            final_modbase_page = modbase_page

        modbase_page_tree=html.fromstring(final_modbase_page.content)

        protein_id_list=modbase_page_tree.xpath("//a[starts-with(@href, 'http://www.rcsb.org/pdb/explore/explore.do?structureId=')]/text()")
        if len(protein_id_list) > 0:
            protein_id = protein_id_list[0]
            df.at[index, "modbase_id"] = protein_id
            #print(f"""found protein_id {protein_id}""")
        #else:
            #print("no protein found")
        
df.to_csv(r'./result_2_uniprot_protein.csv',index=False)



