#!/usr/bin/python3 
import os
import utils

from Bio.Blast.Applications import NcbiblastpCommandline
import pandas as pd
from io import StringIO
from Bio.Blast import NCBIXML
from Bio.Seq import Seq
from Bio.SeqRecord import SeqRecord
from Bio import SeqIO

import utils


def runBlastp(script_path, fastaFileName):
    # clean the output folder
    output_dir = f"""{script_path}output/"""
    filelist = [ f for f in os.listdir(output_dir) if f.endswith(".bak") ]
    for f in filelist:
        os.remove(os.path.join(output_dir, f))

    # get current time
    timeString = utils.getTimeString()

    # log file
    file = open (f"""{script_path}logs/Blastp_{timeString}_output.txt""", "w+")
    file.write("started cron job \n")

    # Run BLAST and parse the output as XML
    # now create a zip file for MEME artifacts
    # fastaFileName format: <ID>_<requester_email>_fasta.txt
    # blastpFileName format: <ID>_<requester_email>.zip
    print(fastaFileName)
    blastpFileName = fastaFileName.replace("_fasta.txt", "_blastp.csv")
    cline = NcbiblastpCommandline(query=fastaFileName, subject=f"""{script_path}GCF_000146045.2_R64_protein.faa""", 
                    #outfmt='6 qseqid sseqid qstart qend evalue', 
                    outfmt='6 qseqid sseqid pident length mismatch gapopen qstart qend sstart send evalue bitscore', 
                    out=blastpFileName, 
                    evalue=1e-5)
    print(cline)
    # run the command
    cline()

    # add top line of column headers
    with open(blastpFileName, 'r+') as file:
        originalContent = file.read()
        file.seek(0, 0)              # Move the cursor to top line
        file.write('qseqid\tsseqid\tpident\tlength\tmismatch\tgapopen\tqstart\tqend\tsstart\tsend\tevalue\tbitscore\n')
        file.write(originalContent)

    return blastpFileName

def refineBlastpResult(blastFileName):
    # df is a pandas.DataFrame and blast-out.b6 won't have a header
    print(blastFileName)
    outputFileName = blastFileName.replace(".csv", "_sorted.csv")
    print(outputFileName)

    df = pd.read_csv(blastFileName, sep='\t')
    if (df.empty):
        return
    
    print(df.head(5))

    # the default outfmt 6 columns
    #default_outfmt6_cols = 'qseqid sseqid pident length mismatch gapopen qstart qend sstart send evalue bitscore'.strip().split(' ')
    #df.columns = default_outfmt6_cols
    new= df.groupby(['qseqid']).apply(lambda x: x.nlargest(1,['bitscore'])).reset_index(drop=True)

    new_sorted_df= new.sort_values(by=['qseqid', 'sseqid'], ascending=False)
    new_sorted_df.to_csv(outputFileName,index=False)


script_path ="/home/michaelzhou/bioinformatics_pipeline/scripts/"

# connect to database, get blastp request, and construct fasta file
fastaFileName = utils.getFastaFileFromDb(script_path)

if (len(fastaFileName) == 0):
    print("no pending request found")
    # if there is no MEME request, do nothing
    exit(0)

# run meme procedure for the fasta file
blastFileName = runBlastp(script_path, fastaFileName)

# update request status
utils.updateRequestStatus(fastaFileName)

print(f"""script_path={script_path}""")
print(f"""blastFileName={blastFileName}""")
# process and sort blastp result file
refineBlastpResult(blastFileName)

