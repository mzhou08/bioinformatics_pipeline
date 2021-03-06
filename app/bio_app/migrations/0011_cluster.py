# Generated by Django 2.2.9 on 2020-01-11 20:30

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('bio_app', '0010_auto_20200106_0237'),
    ]

    operations = [
        migrations.CreateModel(
            name='cluster',
            fields=[
                ('id', models.AutoField(primary_key=True, serialize=False, verbose_name='Table Id')),
                ('cluster_id', models.IntegerField(verbose_name='cluster Id')),
            ],
            options={
                'verbose_name_plural': 'Clusters',
                'db_table': 'cluster',
                'verbose_name': 'Cluster',
            },
        ),
    ]
