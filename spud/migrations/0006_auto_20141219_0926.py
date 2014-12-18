# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import models, migrations


class Migration(migrations.Migration):

    dependencies = [
        ('spud', '0005_auto_20141217_0947'),
    ]

    operations = [
        migrations.RenameField(
            model_name='person',
            old_name='gender',
            new_name='sex',
        ),
    ]
