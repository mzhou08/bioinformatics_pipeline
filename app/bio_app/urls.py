"""bio_app URL Configuration

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/2.2/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path, include
from . import views
from django.conf.urls import url
from django.views.generic import TemplateView
from django.conf import settings

from django.urls import path

from django.conf.urls.static import static


path('select2/', include('django_select2.urls')),

urlpatterns = [
    url(r'^$',
        views.get_home_template, name = 'home'),
    path('admin/', admin.site.urls),
    url(r'^upload/csv/$', views.upload_csv, name='upload_csv'),
    url(r'^upload/$', views.get_upload_csv_template, name='upload'),
    url(r'^uniprot/$', views.query_uniprot, name='uniprot'),
    url(r'^blastp/$', views.blastp_view, name='blastp'),
    url(r'^meme/$', views.meme_view, name="meme"),
    url(r'^listClustermiRNA/$', views.list_cluster_miRNA_view, name="listClustermiRNA"),
    url(r'ajax_load_miRNAs/', views.load_cluster_miRNAs, name='ajax_load_miRNAs'),

    # related to gene-micronRNA cluster
    url(r'^uploadGenemiRNACluster/$', views.get_upload_gene_miRNA_cluster_template, name="upload_gene_miRNA_cluster"),
    url(r'^upload_gene_miRNA_cluster_csv/$', views.upload_gene_miRNA_cluster_csv, name='upload_gene_miRNA_cluster_csv'),
    
    # related to gene-micronRNA mapping
    url(r'^uploadGenemiRNAMapping/$', views.get_upload_gene_miRNA_mapping_template, name="upload_gene_miRNA_mapping"),
    url(r'^upload_gene_miRNA_mapping_csv/$', views.upload_gene_miRNA_mapping_csv, name='upload_gene_miRNA_mapping_csv'),
    
    # load miRNA sequences into miRNA database table
    url(r'^requestmiRNASequence/$', views.get_request_miRNA_sequence_template, name="request_miRNA_sequence"),
    url(r'^querymiRNASequence/$', views.query_miRNA_sequence, name='querymiRNASequence'),

    # load gene sequences into UniProt database table
    url(r'^requestGeneSequence/$', views.get_request_gene_sequence_template, name="request_gene_sequence"),
    url(r'^queryGeneSequence/$', views.query_gene_sequence, name='queryGeneSequence'),
    
    url(r'^memeRNA/$', views.meme_view, name="meme"),
    url(r'^select2/', include('django_select2.urls')),
    url(r'^info/$', views.get_info_template, name="info"),
    url(r'^tutorial/$', views.get_tutorial_template, name="tutorial"),
    url(r'^protein_analysis/$', views.get_protein_analysis_template, name="protein_analysis"),
    url(r'^gene_analysis/$', views.get_gene_analysis_template, name="gene_analysis"),

] + static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)

if settings.DEBUG:
    import debug_toolbar
    urlpatterns += (
        url(r'^__debug__/', include(debug_toolbar.urls)),
        # For django versions after 2.0:
        #path('__debug__/', include(debug_toolbar.urls)),
    )