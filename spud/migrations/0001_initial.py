# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import models, migrations
from django.conf import settings


class Migration(migrations.Migration):

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name='album',
            fields=[
                ('album_id', models.AutoField(serialize=False, primary_key=True)),
                ('title', models.CharField(max_length=96, db_index=True)),
                ('description', models.TextField(blank=True)),
                ('sort_name', models.CharField(max_length=96, blank=True)),
                ('sort_order', models.CharField(max_length=96, blank=True)),
                ('revised', models.DateTimeField(null=True)),
                ('revised_utc_offset', models.IntegerField(null=True)),
            ],
            options={
                'ordering': ['sort_name', 'sort_order', 'title'],
            },
            bases=(models.Model,),
        ),
        migrations.CreateModel(
            name='album_ascendant',
            fields=[
                ('id', models.AutoField(verbose_name='ID', serialize=False, auto_created=True, primary_key=True)),
                ('position', models.IntegerField()),
                ('ascendant', models.ForeignKey(related_name='descendant_set', to='spud.album')),
                ('descendant', models.ForeignKey(related_name='ascendant_set', to='spud.album')),
            ],
            options={
                'ordering': ['position'],
            },
            bases=(models.Model,),
        ),
        migrations.CreateModel(
            name='category',
            fields=[
                ('category_id', models.AutoField(serialize=False, primary_key=True)),
                ('title', models.CharField(max_length=96, db_index=True)),
                ('description', models.TextField(blank=True)),
                ('sort_name', models.CharField(max_length=96, blank=True)),
                ('sort_order', models.CharField(max_length=96, blank=True)),
            ],
            options={
                'ordering': ['sort_name', 'sort_order', 'title'],
            },
            bases=(models.Model,),
        ),
        migrations.CreateModel(
            name='category_ascendant',
            fields=[
                ('id', models.AutoField(verbose_name='ID', serialize=False, auto_created=True, primary_key=True)),
                ('position', models.IntegerField()),
                ('ascendant', models.ForeignKey(related_name='descendant_set', to='spud.category')),
                ('descendant', models.ForeignKey(related_name='ascendant_set', to='spud.category')),
            ],
            options={
                'ordering': ['position'],
            },
            bases=(models.Model,),
        ),
        migrations.CreateModel(
            name='feedback',
            fields=[
                ('id', models.AutoField(verbose_name='ID', serialize=False, auto_created=True, primary_key=True)),
                ('rating', models.IntegerField()),
                ('comment', models.TextField(blank=True)),
                ('user_name', models.CharField(max_length=50, blank=True)),
                ('user_email', models.EmailField(max_length=75, blank=True)),
                ('user_url', models.URLField(blank=True)),
                ('submit_datetime', models.DateTimeField()),
                ('utc_offset', models.IntegerField()),
                ('ip_address', models.GenericIPAddressField(null=True, unpack_ipv4=True, blank=True)),
                ('is_public', models.BooleanField(default=True)),
                ('is_removed', models.BooleanField(default=False)),
                ('parent', models.ForeignKey(related_name='children', blank=True, to='spud.feedback', null=True)),
            ],
            options={
                'ordering': ('submit_datetime',),
                'permissions': (('can_moderate', 'Can moderate'),),
            },
            bases=(models.Model,),
        ),
        migrations.CreateModel(
            name='feedback_ascendant',
            fields=[
                ('id', models.AutoField(verbose_name='ID', serialize=False, auto_created=True, primary_key=True)),
                ('position', models.IntegerField()),
                ('ascendant', models.ForeignKey(related_name='descendant_set', to='spud.feedback')),
                ('descendant', models.ForeignKey(related_name='ascendant_set', to='spud.feedback')),
            ],
            options={
                'ordering': ['position'],
            },
            bases=(models.Model,),
        ),
        migrations.CreateModel(
            name='person',
            fields=[
                ('person_id', models.AutoField(serialize=False, primary_key=True)),
                ('first_name', models.CharField(db_index=True, max_length=96, blank=True)),
                ('last_name', models.CharField(db_index=True, max_length=96, blank=True)),
                ('middle_name', models.CharField(max_length=96, blank=True)),
                ('called', models.CharField(max_length=48, blank=True)),
                ('gender', models.CharField(blank=True, max_length=1, choices=[(b'1', b'male'), (b'2', b'female')])),
                ('dob', models.DateField(null=True, blank=True)),
                ('dod', models.DateField(null=True, blank=True)),
                ('notes', models.TextField(blank=True)),
                ('email', models.CharField(max_length=192, blank=True)),
            ],
            options={
                'ordering': ['last_name', 'first_name'],
            },
            bases=(models.Model,),
        ),
        migrations.CreateModel(
            name='person_ascendant',
            fields=[
                ('id', models.AutoField(verbose_name='ID', serialize=False, auto_created=True, primary_key=True)),
                ('position', models.IntegerField()),
                ('ascendant', models.ForeignKey(related_name='descendant_set', to='spud.person')),
                ('descendant', models.ForeignKey(related_name='ascendant_set', to='spud.person')),
            ],
            options={
                'ordering': ['position'],
            },
            bases=(models.Model,),
        ),
        migrations.CreateModel(
            name='photo',
            fields=[
                ('photo_id', models.AutoField(serialize=False, primary_key=True)),
                ('name', models.CharField(db_index=True, max_length=128, blank=True)),
                ('path', models.CharField(db_index=True, max_length=255, blank=True)),
                ('size', models.IntegerField(null=True, blank=True)),
                ('title', models.CharField(db_index=True, max_length=64, blank=True)),
                ('view', models.CharField(max_length=64, blank=True)),
                ('rating', models.FloatField(db_index=True, null=True, blank=True)),
                ('description', models.TextField(blank=True)),
                ('utc_offset', models.IntegerField()),
                ('datetime', models.DateTimeField(db_index=True)),
                ('camera_make', models.CharField(max_length=32, blank=True)),
                ('camera_model', models.CharField(max_length=32, blank=True)),
                ('flash_used', models.CharField(max_length=1, blank=True)),
                ('focal_length', models.CharField(max_length=64, blank=True)),
                ('exposure', models.CharField(max_length=64, blank=True)),
                ('compression', models.CharField(max_length=64, blank=True)),
                ('aperture', models.CharField(max_length=16, blank=True)),
                ('level', models.IntegerField()),
                ('iso_equiv', models.CharField(max_length=8, blank=True)),
                ('metering_mode', models.CharField(max_length=32, blank=True)),
                ('focus_dist', models.CharField(max_length=16, blank=True)),
                ('ccd_width', models.CharField(max_length=16, blank=True)),
                ('comment', models.TextField(blank=True)),
                ('action', models.CharField(blank=True, max_length=4, null=True, db_index=True, choices=[(b'D', b'delete'), (b'S', b'regenerate size'), (b'R', b'regenerate thumbnails'), (b'V', b'regenerate video'), (b'M', b'move photo'), (b'auto', b'rotate automatic'), (b'90', b'rotate 90 degrees clockwise'), (b'180', b'rotate 180 degrees clockwise'), (b'270', b'rotate 270 degrees clockwise')])),
                ('timestamp', models.DateTimeField()),
            ],
            options={
                'ordering': ['datetime', 'photo_id'],
            },
            bases=(models.Model,),
        ),
        migrations.CreateModel(
            name='photo_album',
            fields=[
                ('id', models.AutoField(verbose_name='ID', serialize=False, auto_created=True, primary_key=True)),
                ('album', models.ForeignKey(to='spud.album')),
                ('photo', models.ForeignKey(to='spud.photo')),
            ],
            options={
                'abstract': False,
            },
            bases=(models.Model,),
        ),
        migrations.CreateModel(
            name='photo_category',
            fields=[
                ('id', models.AutoField(verbose_name='ID', serialize=False, auto_created=True, primary_key=True)),
                ('category', models.ForeignKey(to='spud.category')),
                ('photo', models.ForeignKey(to='spud.photo')),
            ],
            options={
                'abstract': False,
            },
            bases=(models.Model,),
        ),
        migrations.CreateModel(
            name='photo_person',
            fields=[
                ('id', models.AutoField(verbose_name='ID', serialize=False, auto_created=True, primary_key=True)),
                ('position', models.IntegerField(null=True, blank=True)),
                ('person', models.ForeignKey(to='spud.person')),
                ('photo', models.ForeignKey(to='spud.photo')),
            ],
            options={
                'ordering': ['position'],
            },
            bases=(models.Model,),
        ),
        migrations.CreateModel(
            name='photo_relation',
            fields=[
                ('id', models.AutoField(verbose_name='ID', serialize=False, auto_created=True, primary_key=True)),
                ('desc_1', models.CharField(max_length=384)),
                ('desc_2', models.CharField(max_length=384)),
                ('photo_1', models.ForeignKey(related_name='relations_1', db_column='photo_id_1', to='spud.photo')),
                ('photo_2', models.ForeignKey(related_name='relations_2', db_column='photo_id_2', to='spud.photo')),
            ],
            options={
                'abstract': False,
            },
            bases=(models.Model,),
        ),
        migrations.CreateModel(
            name='photo_thumb',
            fields=[
                ('id', models.AutoField(verbose_name='ID', serialize=False, auto_created=True, primary_key=True)),
                ('size', models.CharField(max_length=10, db_index=True)),
                ('width', models.IntegerField(null=True, blank=True)),
                ('height', models.IntegerField(null=True, blank=True)),
                ('photo', models.ForeignKey(to='spud.photo')),
            ],
            options={
                'abstract': False,
            },
            bases=(models.Model,),
        ),
        migrations.CreateModel(
            name='photo_video',
            fields=[
                ('id', models.AutoField(verbose_name='ID', serialize=False, auto_created=True, primary_key=True)),
                ('size', models.CharField(max_length=10, db_index=True)),
                ('width', models.IntegerField(null=True, blank=True)),
                ('height', models.IntegerField(null=True, blank=True)),
                ('format', models.CharField(max_length=20)),
                ('extension', models.CharField(max_length=4)),
                ('photo', models.ForeignKey(to='spud.photo')),
            ],
            options={
                'abstract': False,
            },
            bases=(models.Model,),
        ),
        migrations.CreateModel(
            name='place',
            fields=[
                ('place_id', models.AutoField(serialize=False, primary_key=True)),
                ('title', models.CharField(max_length=192, db_index=True)),
                ('address', models.CharField(max_length=192, blank=True)),
                ('address2', models.CharField(max_length=192, blank=True)),
                ('city', models.CharField(max_length=96, blank=True)),
                ('state', models.CharField(max_length=96, blank=True)),
                ('postcode', models.CharField(max_length=30, blank=True)),
                ('country', models.CharField(max_length=96, blank=True)),
                ('url', models.CharField(max_length=3072, blank=True)),
                ('urldesc', models.CharField(max_length=96, blank=True)),
                ('notes', models.TextField(blank=True)),
                ('cover_photo', models.ForeignKey(related_name='place_cover_of', blank=True, to='spud.photo', null=True)),
                ('parent', models.ForeignKey(related_name='children', blank=True, to='spud.place', null=True)),
            ],
            options={
                'ordering': ['title'],
            },
            bases=(models.Model,),
        ),
        migrations.CreateModel(
            name='place_ascendant',
            fields=[
                ('id', models.AutoField(verbose_name='ID', serialize=False, auto_created=True, primary_key=True)),
                ('position', models.IntegerField()),
                ('ascendant', models.ForeignKey(related_name='descendant_set', to='spud.place')),
                ('descendant', models.ForeignKey(related_name='ascendant_set', to='spud.place')),
            ],
            options={
                'ordering': ['position'],
            },
            bases=(models.Model,),
        ),
        migrations.AddField(
            model_name='photo',
            name='albums',
            field=models.ManyToManyField(related_name='photos', through='spud.photo_album', to='spud.album'),
            preserve_default=True,
        ),
        migrations.AddField(
            model_name='photo',
            name='categorys',
            field=models.ManyToManyField(related_name='photos', through='spud.photo_category', to='spud.category'),
            preserve_default=True,
        ),
        migrations.AddField(
            model_name='photo',
            name='location',
            field=models.ForeignKey(related_name='photos', blank=True, to='spud.place', null=True),
            preserve_default=True,
        ),
        migrations.AddField(
            model_name='photo',
            name='persons',
            field=models.ManyToManyField(related_name='photos', through='spud.photo_person', to='spud.person'),
            preserve_default=True,
        ),
        migrations.AddField(
            model_name='photo',
            name='photographer',
            field=models.ForeignKey(related_name='photographed', blank=True, to='spud.person', null=True),
            preserve_default=True,
        ),
        migrations.AddField(
            model_name='photo',
            name='relations',
            field=models.ManyToManyField(to='spud.photo', through='spud.photo_relation'),
            preserve_default=True,
        ),
        migrations.AddField(
            model_name='person',
            name='cover_photo',
            field=models.ForeignKey(related_name='person_cover_of', blank=True, to='spud.photo', null=True),
            preserve_default=True,
        ),
        migrations.AddField(
            model_name='person',
            name='father',
            field=models.ForeignKey(related_name='father_of', blank=True, to='spud.person', null=True),
            preserve_default=True,
        ),
        migrations.AddField(
            model_name='person',
            name='home',
            field=models.ForeignKey(related_name='home_of', blank=True, to='spud.place', null=True),
            preserve_default=True,
        ),
        migrations.AddField(
            model_name='person',
            name='mother',
            field=models.ForeignKey(related_name='mother_of', blank=True, to='spud.person', null=True),
            preserve_default=True,
        ),
        migrations.AddField(
            model_name='person',
            name='spouse',
            field=models.ForeignKey(related_name='reverse_spouses', blank=True, to='spud.person', null=True),
            preserve_default=True,
        ),
        migrations.AddField(
            model_name='person',
            name='work',
            field=models.ForeignKey(related_name='work_of', blank=True, to='spud.place', null=True),
            preserve_default=True,
        ),
        migrations.AddField(
            model_name='feedback',
            name='photo',
            field=models.ForeignKey(related_name='feedbacks', to='spud.photo'),
            preserve_default=True,
        ),
        migrations.AddField(
            model_name='feedback',
            name='user',
            field=models.ForeignKey(related_name='photos_feedbacks', blank=True, to=settings.AUTH_USER_MODEL, null=True),
            preserve_default=True,
        ),
        migrations.AddField(
            model_name='category',
            name='cover_photo',
            field=models.ForeignKey(related_name='category_cover_of', blank=True, to='spud.photo', null=True),
            preserve_default=True,
        ),
        migrations.AddField(
            model_name='category',
            name='parent',
            field=models.ForeignKey(related_name='children', blank=True, to='spud.category', null=True),
            preserve_default=True,
        ),
        migrations.AddField(
            model_name='album',
            name='cover_photo',
            field=models.ForeignKey(related_name='album_cover_of', blank=True, to='spud.photo', null=True),
            preserve_default=True,
        ),
        migrations.AddField(
            model_name='album',
            name='parent',
            field=models.ForeignKey(related_name='children', blank=True, to='spud.album', null=True),
            preserve_default=True,
        ),
    ]
