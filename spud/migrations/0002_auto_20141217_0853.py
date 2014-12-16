# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import models, migrations
import django.db.models.deletion
from django.conf import settings


class Migration(migrations.Migration):

    dependencies = [
        ('spud', '0001_initial'),
    ]

    operations = [
        migrations.AlterField(
            model_name='album',
            name='cover_photo',
            field=models.ForeignKey(related_name='album_cover_of', on_delete=django.db.models.deletion.SET_NULL, blank=True, to='spud.photo', null=True),
            preserve_default=True,
        ),
        migrations.AlterField(
            model_name='album',
            name='parent',
            field=models.ForeignKey(related_name='children', on_delete=django.db.models.deletion.PROTECT, blank=True, to='spud.album', null=True),
            preserve_default=True,
        ),
        migrations.AlterField(
            model_name='category',
            name='cover_photo',
            field=models.ForeignKey(related_name='category_cover_of', on_delete=django.db.models.deletion.SET_NULL, blank=True, to='spud.photo', null=True),
            preserve_default=True,
        ),
        migrations.AlterField(
            model_name='category',
            name='parent',
            field=models.ForeignKey(related_name='children', on_delete=django.db.models.deletion.PROTECT, blank=True, to='spud.category', null=True),
            preserve_default=True,
        ),
        migrations.AlterField(
            model_name='feedback',
            name='user',
            field=models.ForeignKey(related_name='photos_feedbacks', on_delete=django.db.models.deletion.SET_NULL, blank=True, to=settings.AUTH_USER_MODEL, null=True),
            preserve_default=True,
        ),
        migrations.AlterField(
            model_name='person',
            name='cover_photo',
            field=models.ForeignKey(related_name='person_cover_of', on_delete=django.db.models.deletion.SET_NULL, blank=True, to='spud.photo', null=True),
            preserve_default=True,
        ),
        migrations.AlterField(
            model_name='person',
            name='father',
            field=models.ForeignKey(related_name='father_of', on_delete=django.db.models.deletion.SET_NULL, blank=True, to='spud.person', null=True),
            preserve_default=True,
        ),
        migrations.AlterField(
            model_name='person',
            name='home',
            field=models.ForeignKey(related_name='home_of', on_delete=django.db.models.deletion.SET_NULL, blank=True, to='spud.place', null=True),
            preserve_default=True,
        ),
        migrations.AlterField(
            model_name='person',
            name='mother',
            field=models.ForeignKey(related_name='mother_of', on_delete=django.db.models.deletion.SET_NULL, blank=True, to='spud.person', null=True),
            preserve_default=True,
        ),
        migrations.AlterField(
            model_name='person',
            name='spouse',
            field=models.ForeignKey(related_name='reverse_spouses', on_delete=django.db.models.deletion.SET_NULL, blank=True, to='spud.person', null=True),
            preserve_default=True,
        ),
        migrations.AlterField(
            model_name='person',
            name='work',
            field=models.ForeignKey(related_name='work_of', on_delete=django.db.models.deletion.SET_NULL, blank=True, to='spud.place', null=True),
            preserve_default=True,
        ),
        migrations.AlterField(
            model_name='photo',
            name='location',
            field=models.ForeignKey(related_name='photos', on_delete=django.db.models.deletion.SET_NULL, blank=True, to='spud.place', null=True),
            preserve_default=True,
        ),
        migrations.AlterField(
            model_name='photo',
            name='photographer',
            field=models.ForeignKey(related_name='photographed', on_delete=django.db.models.deletion.SET_NULL, blank=True, to='spud.person', null=True),
            preserve_default=True,
        ),
        migrations.AlterField(
            model_name='photo',
            name='timestamp',
            field=models.DateTimeField(auto_now_add=True),
            preserve_default=True,
        ),
        migrations.AlterField(
            model_name='place',
            name='cover_photo',
            field=models.ForeignKey(related_name='place_cover_of', on_delete=django.db.models.deletion.SET_NULL, blank=True, to='spud.photo', null=True),
            preserve_default=True,
        ),
        migrations.AlterField(
            model_name='place',
            name='parent',
            field=models.ForeignKey(related_name='children', on_delete=django.db.models.deletion.PROTECT, blank=True, to='spud.place', null=True),
            preserve_default=True,
        ),
    ]
