# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import models, migrations


class Migration(migrations.Migration):

    dependencies = [
        ('spud', '0008_auto_20141221_1045'),
    ]

    operations = [
        migrations.AlterField(
            model_name='album',
            name='title',
            field=models.CharField(db_index=True, max_length=96, null=True, blank=True),
            preserve_default=True,
        ),
    ]
