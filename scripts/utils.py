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

def getTimeString():
    # get current time
    today = date.today()
    now = datetime.now()
    currentTime = now.strftime("%H-%M-%S")
    timeString = f"""{today} {currentTime}"""
    return timeString


def getDatabaseConnection():
    conn = None
    with open(os.getenv("ENV_FILE", "../config/env.json")) as f:
        ENV = json.load(f)
        conn = psycopg2.connect(database=ENV.get('PostgreSQL_DATABASE'),
                                user=ENV.get('PostgreSQL_USER'), 
                                password=ENV.get('PostgreSQL_PASSWORD'), 
                                host=ENV.get('PostgreSQL_HOST'), 
                                port=ENV.get('PostgreSQL_PORT'))
    return conn

# function to create zip file
def createZipFile(zipname, path):
    #function to create a zip file
    #Parameters: zipname - name of the zip file; path - name of folder/file to be put in zip file

    zipf = zipfile.ZipFile(zipname, 'w', zipfile.ZIP_DEFLATED)
    zipf.setpassword(b"password") #if you want to set password to zipfile

    #checks if the path is file or directory
    if os.path.isdir(path):
        for files in os.listdir(path):
            zipf.write(os.path.join(path, files), files)

    elif os.path.isfile(path):
        zipf.write(os.path.join(path), path)
    zipf.close()


def getFastaFileFromDb(type):
    conn = getDatabaseConnection()
    cur = conn.cursor()
    # get the first protein_MEME request
    query_string = f"""SELECT ID, REQUEST_TYPE, REQUEST_DETAIL, REQUESTER_EMAIL FROM REQUEST_QUEUE WHERE REQUEST_TYPE='{type}' AND REQUEST_STATUS = '' ORDER BY ID LIMIT 1"""
    print(query_string)
    cur.execute(query_string)
    rows = cur.fetchall()

    # requester's email address
    requester_email = ""
    
    # return fasta file name
    fasta_file_name = ""

    for row in rows:
        # only process one request at a time
        print("ID =", row[0])
        print("REUQUEST_TYPE =", row[1])
        print("REQUEST_DETAIL =", row[2])
        print("REQUESTER_EMAIL =", row[3], "\n")
        request_id = row[0]
        protein_class = row[2]
        requester_email = row[3]

        # concatenate all fasta info into one fasta file
        # file format: <request_id>_<requester_email>_fasta.txt
        fasta_file_name = f"""{request_id}_{requester_email}_fasta.txt"""
        fasta_file = open (fasta_file_name, "w+")
        protein_cur = conn.cursor()
        protein_cur.execute(f"""SELECT PROTEIN_FASTA FROM PROTEIN_SEQUENCE WHERE PROTEIN_CLASS='{protein_class}'""")
        protein_rows = protein_cur.fetchall()
        for protein_row in protein_rows:
            # only process one request at a time
            protein_fasta = protein_row[0]
            print("protein fasta =", protein_row[0], "\n")
            fasta_file.write(f"""{protein_fasta}\n""")
    conn.close()

    #return fasta file name
    return fasta_file_name

def runMeme(fastafile):
    # clean the output folder
    output_dir = "./output/"
    filelist = [ f for f in os.listdir(output_dir) if f.endswith(".bak") ]
    for f in filelist:
        os.remove(os.path.join(output_dir, f))

    # get current time
    now = datetime.now()
    current_time = now. strftime("%H:%M:%S")
    print("Current Time =", current_time)

    file = open (f"""/Users/zqian/Documents/bio_code_django/meme_script/logs/{current_time}_output.txt""", "w+")
    file.write("started cron job \n")


    """Test meme runner"""
    ## default meme parameters
    meme_args = '-protein -mod zoops -nmotifs 5 -minw 6 -maxw 30 -nostatus -maxsize 1000000'
    catalase_fasta_value = fastafile
    pipeline = Pipeline("./application.cfg")
    output = pipeline.run_meme(fasta_in=catalase_fasta_value,
        out_dir='./output',
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

def sendNotificationEmail():
    # send email with the zip file
    yag = yagmail.SMTP()
    contents = ['This is the body, and here is just text http://somedomain/image.png',
                'You can find an audio file attached.', '/local/path/song.mp3']
    yag.send('mzhou08@gmail.com', 'subject', contents)

def updateRequestStatus(fastaFileName):
    # get request id from file name: <request_id>_<requester_email>_fasta.txt
    parts = fastaFileName.split('_')
    print(parts)
    request_id = parts[0]
    print(request_id)


    conn = getDatabaseConnection()
    cur = conn.cursor()
    timeString = getTimeString()
    update_sql = f"""UPDATE REQUEST_QUEUE SET REQUEST_STATUS = 'FINSHED on {timeString} ' WHERE ID={request_id}"""
    print(update_sql)
    cur.execute(update_sql)
    conn.commit()
    conn.close()