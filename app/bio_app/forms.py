#-*- coding: utf-8 -*-
from django import forms
from crispy_forms.helper import FormHelper
from crispy_forms.layout import Submit

from .models import protein_sequence, request_queue, gene_miRNA_cluster, gene_miRNA_mapping, Cluster, Cluster_miRNA, Cluster_Gene
from django_select2.forms import (
    HeavySelect2MultipleWidget, HeavySelect2Widget, ModelSelect2MultipleWidget,
    ModelSelect2TagWidget, ModelSelect2Widget, Select2MultipleWidget,
    Select2Widget
)

class BLASTPRequestForm(forms.Form):  
    error_css_class = 'error'
    protein_choices = protein_sequence.objects.order_by('protein_class').values_list('protein_class', flat=True).distinct('protein_class')
    print(type(protein_choices))
    protein_class_category=forms.ModelChoiceField(queryset=protein_choices)

    class Meta:
        model = request_queue

        exclude = ()

class MEMERequestForm(forms.Form):  
    error_css_class = 'error'
    protein_choices = protein_sequence.objects.order_by('protein_class').values_list('protein_class', flat=True).distinct('protein_class')
    print(type(protein_choices))
    protein_class_category=forms.ModelChoiceField(queryset=protein_choices)

    class Meta:
        model = request_queue
        exclude = ()

class clustermiRNAForm(forms.Form):
    cluster = forms.ModelChoiceField(
        queryset=Cluster.objects.all(),
        label='Cluster',
        widget=ModelSelect2Widget(
            search_fields=['name__icontains'],
            max_results=500,
            dependent_fields={'miRNA': 'miRNAs'},
            attrs={'data-minimum-input-length': 0},
        )
    )

    miRNA = forms.ModelChoiceField(
        queryset=Cluster_miRNA.objects.all(),
        label='miRNA',
        widget=ModelSelect2Widget(
            search_fields=['name__icontains'],
            dependent_fields={'cluster': 'cluster'},
            max_results=500,
            attrs={'data-minimum-input-length': 0},
        )
    )