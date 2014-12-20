# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import models, migrations


class Migration(migrations.Migration):

    dependencies = [
        ('spud', '0006_auto_20141219_0926'),
    ]

    operations = [
        migrations.AlterUniqueTogether(
            name='photo_relation',
            unique_together=set([('photo_1', 'photo_2')]),
        ),
    ]
