# Generated by Django 2.2.9 on 2020-01-05 04:50

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('bio_app', '0008_auto_20200105_0323'),
    ]

    operations = [
        migrations.AlterField(
            model_name='gene_sequence',
            name='gene_id',
            field=models.CharField(max_length=255, unique=True, verbose_name='ID'),
        ),
        migrations.AlterField(
            model_name='mirna_sequence',
            name='miRNA_id',
            field=models.CharField(max_length=255, unique=True, verbose_name='ID'),
        ),
        migrations.AlterUniqueTogether(
            name='gene_mirna_cluster',
            unique_together={('cluster_id', 'gene_miRNA_id')},
        ),
        migrations.AlterUniqueTogether(
            name='gene_mirna_mapping',
            unique_together={('gene_id', 'miRNA_id')},
        ),
    ]
