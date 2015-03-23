# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import models, migrations


class Migration(migrations.Migration):

    dependencies = [
        ('spud', '0009_auto_20141229_0455'),
    ]

    operations = [
        migrations.AlterField(
            model_name='photo',
            name='action',
            field=models.CharField(null=True, db_index=True, max_length=4, choices=[('D', 'delete'), ('R', 'regenerate thumbnails & video'), ('M', 'move photo'), ('auto', 'rotate automatic'), ('90', 'rotate 90 degrees clockwise'), ('180', 'rotate 180 degrees clockwise'), ('270', 'rotate 270 degrees clockwise')], blank=True),
            preserve_default=True,
        ),
    ]
