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

urlpatterns = [
    url(r'^$',
        views.get_home_template, name = 'home'),
    path('admin/', admin.site.urls),
    url(r'^upload/csv/$', views.upload_csv, name='upload_csv'),
    url(r'^upload/$', views.get_upload_csv_template, name='upload'),
    url(r'^uniprot/$', views.query_uniprot, name='uniprot'),
    url(r'^blastp/$', views.blastp_view, name='blastp'),
    url(r'^meme/$', views.meme_view, name="meme"),
]
