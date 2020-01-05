#-*- coding: utf-8 -*-
from django import forms
from crispy_forms.helper import FormHelper
from crispy_forms.layout import Submit

from .models import protein_sequence, request_queue

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