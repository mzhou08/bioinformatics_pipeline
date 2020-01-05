from lxml import html
import requests

import os
import pandas as pd
from pandas import ExcelWriter
from pandas import ExcelFile

df = pd.read_excel('./RedOxiBase_Bacteroidetes_Chlorobi.xlsx', sheet_name='Sheet1')
# add new column
df["Fasta"] = ""

# prepare to output new csv file with fasta info
#os.remove("fasta.csv")
for index, row in df.iterrows():
    id = row["Id"]
    df.at[index, "Name"]=row["Name"].strip()
    df.at[index, "Name_Class"]=df.at[index, "Name"] + "_" + row["Class"]
    page = requests.get(f"""http://peroxibase.toulouse.inra.fr/tools/get_fasta/{id}/PEP""")
    tree = html.fromstring(page.content)

    #This will get fasta
    fasta = tree.xpath('//textarea[@name="task_data_input"]/text()')
    print(fasta[0])
    df.at[index, "Fasta"] = fasta[0]

df.to_csv(r'result_1_fasta.csv',index=False)