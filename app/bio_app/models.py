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

class gene_sequence(models.Model):
    id = models.AutoField(primary_key=True, verbose_name="Table Id")
    gene_id = models.CharField(unique=True, max_length=255, blank=False, null=False, verbose_name="ID")
    ncbi_gene_id = models.CharField(max_length=255, blank=True, null=True, verbose_name="NCBI_gene_ID")
    gene_fasta= models.TextField(blank=True, null=True, verbose_name="Fasta")
    
    def __str__(self):
        return self.id

    class Meta:
        db_table = 'gene_sequence'
        verbose_name = "Gene Sequence"
        verbose_name_plural = "Gene Sequences"

class miRNA_sequence(models.Model):
    id = models.AutoField(primary_key=True, verbose_name="Table Id")
    miRNA_id = models.CharField(unique=True, max_length=255, blank=False, null=False, verbose_name="ID")
    miRNA_fasta= models.TextField(blank=True, null=True, verbose_name="Fasta")
    
    def __str__(self):
        return self.id

    class Meta:
        db_table = 'miRNA_sequence'
        verbose_name = "miRNA_sequence"
        verbose_name_plural = "miRNA_sequences"

class gene_miRNA_mapping(models.Model):
    id = models.AutoField(primary_key=True, verbose_name="Table Id")
    gene_id = models.CharField(max_length=255, blank=False, null=False, verbose_name="gene_ID")
    miRNA_id = models.CharField(max_length=255, blank=False, null=False, verbose_name="miRNA_ID")
    
    def __str__(self):
        return self.id

    class Meta:
        db_table = 'gene_miRNA_mapping'
        unique_together = ('gene_id', 'miRNA_id')
        verbose_name = "Gene miRNA Mapping"
        verbose_name_plural = "Gene miRNA Mappings"

class Cluster(models.Model):
    name = models.CharField(max_length=255, blank=True, null=True)
    def __str__(self):
        return str(self.id)

    class Meta:
        ordering = ('name',)
        db_table = 'clusters'
        verbose_name = "Cluster"
        verbose_name_plural = "Clusters"

class Cluster_miRNA(models.Model):
    cluster = models.ForeignKey('Cluster', on_delete = models.CASCADE)
    miRNA_id = models.CharField(max_length=255, blank=False, null=False, verbose_name="miRNA_ID") #  ID for miRNA
    
    def __str__(self):
        return self.miRNA_id

    class Meta:
        ordering = ('miRNA_id',)
        db_table = 'cluster_miRNA'
        unique_together = (('cluster', 'miRNA_id'),)
        verbose_name = "clusters_miRNA"
        verbose_name_plural = "clusters_miRNAs"

class Cluster_Gene(models.Model):
    cluster = models.ForeignKey('Cluster', on_delete = models.CASCADE)
    gene_id = models.CharField(max_length=255, blank=False, null=False, verbose_name="gene_ID") #  ID for gene
    
    def __str__(self):
        return self.gene_id

    class Meta:
        ordering = ('gene_id',)
        db_table = 'cluster_gene'
        unique_together = (('cluster', 'gene_id'),)
        verbose_name = "clusters_gene"
        
        verbose_name_plural = "clusters_genes"


class gene_miRNA_cluster(models.Model):
    id = models.AutoField(primary_key=True, verbose_name="Table Id")
    cluster_id = models.IntegerField(blank=False, null=False, verbose_name="cluster Id")
    gene_miRNA_id = models.CharField(max_length=255, blank=False, null=False, verbose_name="gene_miRNA_ID") #  ID for either gene or miRNA
    gene_miRNA_type = models.CharField(max_length=255, blank=False, null=False, verbose_name="gene_miRNA_type") # type could be either "gene" or "miRNA"
    
    def __str__(self):
        return self.id

    class Meta:
        db_table = 'gene_miRNA_cluster'
        unique_together = ('cluster_id', 'gene_miRNA_id')
        verbose_name = "Gene miRNA Cluster"
        verbose_name_plural = "Gene miRNA Clusters"

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
