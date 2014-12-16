# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import models, migrations


class Migration(migrations.Migration):

    dependencies = [
        ('spud', '0003_auto_20141217_0908'),
    ]

    operations = [
        migrations.AlterModelOptions(
            name='photo',
            options={'ordering': ['datetime', 'id']},
        ),
        migrations.RenameField(
            model_name='album',
            old_name='album_id',
            new_name='id',
        ),
        migrations.RenameField(
            model_name='category',
            old_name='category_id',
            new_name='id',
        ),
        migrations.RenameField(
            model_name='person',
            old_name='person_id',
            new_name='id',
        ),
        migrations.RenameField(
            model_name='photo',
            old_name='photo_id',
            new_name='id',
        ),
        migrations.RenameField(
            model_name='place',
            old_name='place_id',
            new_name='id',
        ),
    ]
