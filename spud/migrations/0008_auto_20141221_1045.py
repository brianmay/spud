# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import models, migrations


class Migration(migrations.Migration):

    dependencies = [
        ('spud', '0007_auto_20141220_1653'),
    ]

    operations = [
        migrations.AlterField(
            model_name='album',
            name='description',
            field=models.TextField(null=True, blank=True),
            preserve_default=True,
        ),
        migrations.AlterField(
            model_name='album',
            name='revised',
            field=models.DateTimeField(null=True, blank=True),
            preserve_default=True,
        ),
        migrations.AlterField(
            model_name='album',
            name='revised_utc_offset',
            field=models.IntegerField(null=True, blank=True),
            preserve_default=True,
        ),
        migrations.AlterField(
            model_name='album',
            name='sort_name',
            field=models.CharField(max_length=96, null=True, blank=True),
            preserve_default=True,
        ),
        migrations.AlterField(
            model_name='album',
            name='sort_order',
            field=models.CharField(max_length=96, null=True, blank=True),
            preserve_default=True,
        ),
        migrations.AlterField(
            model_name='category',
            name='description',
            field=models.TextField(null=True, blank=True),
            preserve_default=True,
        ),
        migrations.AlterField(
            model_name='category',
            name='sort_name',
            field=models.CharField(max_length=96, null=True, blank=True),
            preserve_default=True,
        ),
        migrations.AlterField(
            model_name='category',
            name='sort_order',
            field=models.CharField(max_length=96, null=True, blank=True),
            preserve_default=True,
        ),
        migrations.AlterField(
            model_name='feedback',
            name='comment',
            field=models.TextField(null=True, blank=True),
            preserve_default=True,
        ),
        migrations.AlterField(
            model_name='feedback',
            name='user_email',
            field=models.EmailField(max_length=75, null=True, blank=True),
            preserve_default=True,
        ),
        migrations.AlterField(
            model_name='feedback',
            name='user_name',
            field=models.CharField(max_length=50, null=True, blank=True),
            preserve_default=True,
        ),
        migrations.AlterField(
            model_name='feedback',
            name='user_url',
            field=models.URLField(null=True, blank=True),
            preserve_default=True,
        ),
        migrations.AlterField(
            model_name='person',
            name='called',
            field=models.CharField(max_length=48, null=True, blank=True),
            preserve_default=True,
        ),
        migrations.AlterField(
            model_name='person',
            name='email',
            field=models.CharField(max_length=192, null=True, blank=True),
            preserve_default=True,
        ),
        migrations.AlterField(
            model_name='person',
            name='first_name',
            field=models.CharField(max_length=96, db_index=True),
            preserve_default=True,
        ),
        migrations.AlterField(
            model_name='person',
            name='last_name',
            field=models.CharField(db_index=True, max_length=96, null=True, blank=True),
            preserve_default=True,
        ),
        migrations.AlterField(
            model_name='person',
            name='middle_name',
            field=models.CharField(max_length=96, null=True, blank=True),
            preserve_default=True,
        ),
        migrations.AlterField(
            model_name='person',
            name='notes',
            field=models.TextField(null=True, blank=True),
            preserve_default=True,
        ),
        migrations.AlterField(
            model_name='person',
            name='sex',
            field=models.CharField(blank=True, max_length=1, null=True, choices=[('1', 'male'), ('2', 'female')]),
            preserve_default=True,
        ),
        migrations.AlterField(
            model_name='photo',
            name='aperture',
            field=models.CharField(max_length=16, null=True, blank=True),
            preserve_default=True,
        ),
        migrations.AlterField(
            model_name='photo',
            name='camera_make',
            field=models.CharField(max_length=32, null=True, blank=True),
            preserve_default=True,
        ),
        migrations.AlterField(
            model_name='photo',
            name='camera_model',
            field=models.CharField(max_length=32, null=True, blank=True),
            preserve_default=True,
        ),
        migrations.AlterField(
            model_name='photo',
            name='ccd_width',
            field=models.CharField(max_length=16, null=True, blank=True),
            preserve_default=True,
        ),
        migrations.AlterField(
            model_name='photo',
            name='comment',
            field=models.TextField(null=True, blank=True),
            preserve_default=True,
        ),
        migrations.AlterField(
            model_name='photo',
            name='compression',
            field=models.CharField(max_length=64, null=True, blank=True),
            preserve_default=True,
        ),
        migrations.AlterField(
            model_name='photo',
            name='description',
            field=models.TextField(null=True, blank=True),
            preserve_default=True,
        ),
        migrations.AlterField(
            model_name='photo',
            name='exposure',
            field=models.CharField(max_length=64, null=True, blank=True),
            preserve_default=True,
        ),
        migrations.AlterField(
            model_name='photo',
            name='flash_used',
            field=models.CharField(max_length=1, null=True, blank=True),
            preserve_default=True,
        ),
        migrations.AlterField(
            model_name='photo',
            name='focal_length',
            field=models.CharField(max_length=64, null=True, blank=True),
            preserve_default=True,
        ),
        migrations.AlterField(
            model_name='photo',
            name='focus_dist',
            field=models.CharField(max_length=16, null=True, blank=True),
            preserve_default=True,
        ),
        migrations.AlterField(
            model_name='photo',
            name='iso_equiv',
            field=models.CharField(max_length=8, null=True, blank=True),
            preserve_default=True,
        ),
        migrations.AlterField(
            model_name='photo',
            name='metering_mode',
            field=models.CharField(max_length=32, null=True, blank=True),
            preserve_default=True,
        ),
        migrations.AlterField(
            model_name='photo',
            name='name',
            field=models.CharField(max_length=128, db_index=True),
            preserve_default=True,
        ),
        migrations.AlterField(
            model_name='photo',
            name='path',
            field=models.CharField(max_length=255, db_index=True),
            preserve_default=True,
        ),
        migrations.AlterField(
            model_name='photo',
            name='view',
            field=models.CharField(max_length=64, null=True, blank=True),
            preserve_default=True,
        ),
        migrations.AlterField(
            model_name='place',
            name='address',
            field=models.CharField(max_length=192, null=True, blank=True),
            preserve_default=True,
        ),
        migrations.AlterField(
            model_name='place',
            name='address2',
            field=models.CharField(max_length=192, null=True, blank=True),
            preserve_default=True,
        ),
        migrations.AlterField(
            model_name='place',
            name='city',
            field=models.CharField(max_length=96, null=True, blank=True),
            preserve_default=True,
        ),
        migrations.AlterField(
            model_name='place',
            name='country',
            field=models.CharField(max_length=96, null=True, blank=True),
            preserve_default=True,
        ),
        migrations.AlterField(
            model_name='place',
            name='notes',
            field=models.TextField(null=True, blank=True),
            preserve_default=True,
        ),
        migrations.AlterField(
            model_name='place',
            name='postcode',
            field=models.CharField(max_length=30, null=True, blank=True),
            preserve_default=True,
        ),
        migrations.AlterField(
            model_name='place',
            name='state',
            field=models.CharField(max_length=96, null=True, blank=True),
            preserve_default=True,
        ),
        migrations.AlterField(
            model_name='place',
            name='url',
            field=models.CharField(max_length=3072, null=True, blank=True),
            preserve_default=True,
        ),
        migrations.AlterField(
            model_name='place',
            name='urldesc',
            field=models.CharField(max_length=96, null=True, blank=True),
            preserve_default=True,
        ),
    ]
