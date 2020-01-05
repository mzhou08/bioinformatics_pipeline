Used the directions from "Quickstart: Compose and Django" (https://docs.docker.com/compose/django/) to setup Django with Docker container.

Used the github for form rendering: https://github.com/sibtc/form-rendering-examples

# create database tables:

docker-compose run web python /code/manage.py makemigrations bio_app
docker-compose run web python /code/manage.py migrate

# query data inside postgressql: 
docker exec -it bio_app_db psql -U postgres

#list all databases;
\l

#connect to a database
\c postgres

# list all tables inside the database
\dt

#quit
\q


# get blast
RUN apt-get update && apt-get install -y \
   parallel \
    wget
RUN wget ftp://ftp.ncbi.nlm.nih.gov/blast/executables/blast+/2.6.0/ncbi-blast-2.6.0+-x64-linux.tar.gz && \
    tar xzf ncbi-blast-2.6.0+-x64-linux.tar.gz
ENV PATH="./ncbi-blast-2.6.0+/bin:${PATH}"
RUN chmod -R a+x ncbi-blast-2.6.0+
RUN mkdir /query && mkdir /db && mkdir /out
RUN adduser --disabled-password --gecos '' dockeruser
RUN chown -R dockeruser /out