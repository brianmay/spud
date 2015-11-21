# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('spud', '0011_auto_20151121_1735'),
    ]

    operations = [
        migrations.RenameField(
            model_name='feedback',
            old_name='photo',
            new_name='cover_photo',
        ),
    ]
