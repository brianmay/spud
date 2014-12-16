# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('spud', '0002_auto_20141217_0853'),
    ]

    operations = [
        migrations.RenameField(
            model_name='photo',
            old_name='location',
            new_name='place',
        ),
    ]
