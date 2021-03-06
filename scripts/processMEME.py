import os
import shutil
import unittest
from datetime import datetime, date
from moca.helpers import get_cpu_count
from moca.pipeline import Pipeline
from moca.bedoperations import fimo_to_sites
from moca.helpers import read_memefile
import zipfile
import psycopg2
import yagmail
import json
import utils
import sys

def runMeme(fastafile, type):
    # clean the output folder
    output_dir = os.getcwd() + "/bioinformatics_pipeline/scripts/output/"
    # clean all the file contents inside the output directory first
    filelist = [ f for f in os.listdir(output_dir)]
    for f in filelist:
        os.remove(os.path.join(output_dir, f))

    # get current time
    timeString = utils.getTimeString()

    # create log file for current execution
    file = open (f"""{os.getcwd()}/bioinformatics_pipeline/scripts/logs/MEME_{timeString}_output.txt""", "w+")
    file.write("started cron job \n")


    """Test meme runner"""
    ## default meme parameters
    if (type == 'gene'):
        meme_args = '-dna -mod zoops -nmotifs 3 -minw 6 -maxw 30 -nostatus -maxsize 1000000'
    else:
        meme_args = '-protein -mod zoops -nmotifs 3 -minw 6 -maxw 30 -nostatus -maxsize 1000000'
    catalase_fasta_value = fastafile
    pipeline = Pipeline(f"""{os.getcwd()}/bioinformatics_pipeline/scripts/application.cfg""")
    output = pipeline.run_meme(fasta_in=catalase_fasta_value,
        out_dir=f"""{os.getcwd()}/bioinformatics_pipeline/scripts/output""",
        strargs=meme_args.replace(' -p {}'.format(get_cpu_count()), ''))
    print(output)
    file.write("finished job")
    file.write("\n")

    #TODO Check if meme.txt is same and created
    #TODO This check is too stringent, specially if logos are being produced.
    #MEME installation leads to hard coded paths
    if output['exitcode'] != 0:
    ## HTML is not required so allow failing here
        if output['stdout'].find(b'Warning: meme_xml_to_html'):
            pass
        else:
            print(output)
            file.write(output)
            file.write("\n")
            raise RuntimeError('Error running meme')

# count the arguments
arguments = len(sys.argv) - 1
if (arguments == 0):
    print("Please include argument with value : protein or gene ")
elif (arguments > 1) :
    print("Please include only one argument with value: protein or gene ")
else:
    # output argument-wise
    position = 1
    type = ''
    while (arguments >= position):
        print ("parameter %i: %s" % (position, sys.argv[position]))
        type = sys.argv[position]
        position = position + 1
        
    # connect to database, get MEME request and construct into fasta file
    fastaFileName = utils.getFastaFileFromDb()

    if (len(fastaFileName) == 0):
        print("no pending request found")
        # if there is no MEME request, do nothing
        exit(0)

    # run meme procedure for the fasta file
    runMeme(fastaFileName, type)

    # update request status
    utils.updateRequestStatus(fastaFileName)

    # now create a zip file for MEME artifacts
    # fastaFileName format: <ID>_<requester_email>_fasta.txt
    # zipFileName format: <ID>_<requester_email>.zip
    zipFileName = fastaFileName.replace("_fasta.txt", ".zip")
    zipSourceFolderPath = "./output"
    zipFile = utils.createZipFile(zipFileName, zipSourceFolderPath)

    # send user email with the meme zip attachment
    #sendNotificationEmail


