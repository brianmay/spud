# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('spud', '0010_auto_20150324_0920'),
    ]

    operations = [
        migrations.AlterField(
            model_name='feedback',
            name='user_email',
            field=models.EmailField(max_length=254, null=True, blank=True),
        ),
    ]
