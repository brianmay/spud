# Generated by Django 2.1.2 on 2019-03-21 17:22
import logging

from django.db import migrations

from spud.populate_photo_file import populate

logger = logging.getLogger(__name__)


def populate_photo_files(apps, schema_editor):
    photo_file = apps.get_model('spud', 'photo_file')

    photo = apps.get_model('spud', 'photo')

    for p in photo.objects.filter(datetime__year__gte=2010, datetime__year__lt=2015):
        populate(photo_file, p)


class Migration(migrations.Migration):

    dependencies = [
        ('spud', '0006_auto_20190321_1722'),
    ]

    operations = [
        migrations.RunPython(populate_photo_files)
    ]
