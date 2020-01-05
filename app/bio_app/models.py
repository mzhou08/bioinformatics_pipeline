from django.db import models
from django.db.models import Q

from django.conf import settings
from django.core.exceptions import ObjectDoesNotExist
from django.urls import reverse

from collections import namedtuple
from datetime import datetime, timedelta
import pytz

import logging
logger = logging.getLogger(__name__)

class protein_sequence(models.Model):
    id = models.AutoField(primary_key=True, verbose_name="Table Id")
    protein_id = models.IntegerField(unique=True, blank=True, null=True, verbose_name="Id")
    protein_name = models.CharField(max_length=255, blank=True, null=True, verbose_name="Name")
    protein_class = models.CharField(max_length=255, blank=True, null=True, verbose_name="Class")
    protein_taxo = models.CharField(max_length=255, blank=True, null=True, verbose_name="Taxo")
    protein_fasta= models.TextField(blank=True, null=True, verbose_name="Fasta")
    protein_uniprot_id = models.CharField(max_length=255, blank=True, null=True, verbose_name="Protein UniProt Id")
    protein_SWISSMODEL_id = models.CharField(max_length=255, blank=True, null=True, verbose_name="Protein SWISS-MODEL Id")
    protein_MODBASE_id = models.CharField(max_length=255, blank=True, null=True, verbose_name="Protein MODBASE Id")
    
    
    def __str__(self):
        return self.id

    class Meta:
        db_table = 'protein_sequence'
        verbose_name = "Protein Sequence"
        verbose_name_plural = "Protein Sequences"

class request_queue(models.Model):
    id = models.AutoField(primary_key=True, verbose_name="Table Id")
    request_type = models.CharField(max_length=255, blank=True, null=True, verbose_name="Request Type")
    request_detail = models.TextField(blank=True, null=True, verbose_name="Request Detail")
    requester_email = models.CharField(max_length=255, blank=True, null=True, verbose_name="Request Email")
    request_status= models.TextField(blank=True, null=True, verbose_name="Request Status")
    
    
    def __str__(self):
        return self.id

    class Meta:
        db_table = 'request_queue'
        verbose_name = "Request"
        verbose_name_plural = "Requests"
