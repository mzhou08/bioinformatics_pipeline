FROM python:3.5
ENV PYTHONUNBUFFERED 1
RUN mkdir /code
WORKDIR /code

COPY requirements.txt /code/
RUN apt-get update && \
    apt-get install -y --no-install-recommends netcat vim-tiny jq python3-dev xmlsec1 cron && \
    apt-get upgrade -y && \
    apt-get clean -y && \
    pip install -r requirements.txt
RUN pip install -r requirements.txt

COPY . /code/


