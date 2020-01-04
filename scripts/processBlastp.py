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


def runBlastp(fastaFileName):
    # clean the output folder
    output_dir = "./output/"
    filelist = [ f for f in os.listdir(output_dir) if f.endswith(".bak") ]
    for f in filelist:
        os.remove(os.path.join(output_dir, f))

    # get current time
    timeString = utils.getTimeString()

    # log file
    file = open (f"""./logs/Blastp_{timeString}_output.txt""", "w+")
    file.write("started cron job \n")

    # Run BLAST and parse the output as XML
    # now create a zip file for MEME artifacts
    # fastaFileName format: <ID>_<requester_email>_fasta.txt
    # blastpFileName format: <ID>_<requester_email>.zip
    blastpFileName = fastaFileName.replace("_fasta.txt", "_blastp.csv")
    cline = NcbiblastpCommandline(query=fastaFileName, subject="GCF_000146045.2_R64_protein.faa", 
                    #outfmt='6 qseqid sseqid qstart qend evalue', 
                    outfmt='6 qseqid sseqid pident length mismatch gapopen qstart qend sstart send evalue bitscore', 
                    out=blastpFileName, evalue=1e-5)
    print(cline)
    output = cline()[0]
    blast_result_record = NCBIXML.read(StringIO(output))
    print(StringIO(output))
    # Print some information on the result
    for alignment in blast_result_record.alignments:
        for hsp in alignment.hsps:
            print(f"""\n\n****{row['Name']} Alignment with yeast ****""")
            print('sequence:', alignment.title)
            print('length:', alignment.length)
            print('e value:', hsp.expect)
            print(hsp.query)
            print(hsp.match)
            print(hsp.sbjct)

# connect to database, get blastp request, and construct fasta file
fastaFileName = utils.getFastaFileFromDb('protein_blastp')

if (len(fastaFileName) == 0):
    print("no pending request found")
    # if there is no MEME request, do nothing
    exit(0)

# run meme procedure for the fasta file
runBlastp(fastaFileName)

# update request status
utils.updateRequestStatus(fastaFileName)

