# Generated by Django 2.2.9 on 2020-01-11 20:34

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('bio_app', '0011_cluster'),
    ]

    operations = [
        migrations.RenameModel(
            old_name='cluster',
            new_name='clusters',
        ),
        migrations.AlterModelTable(
            name='clusters',
            table='clusters',
        ),
    ]
