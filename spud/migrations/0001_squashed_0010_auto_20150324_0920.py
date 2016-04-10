# -*- coding: utf-8 -*-
from __future__ import unicode_literals

from django.db import migrations, models
from django.conf import settings
import django.db.models.deletion


class Migration(migrations.Migration):

    replaces = [('spud', '0001_initial'), ('spud', '0002_auto_20141217_0853'), ('spud', '0003_auto_20141217_0908'), ('spud', '0004_auto_20141217_0933'), ('spud', '0005_auto_20141217_0947'), ('spud', '0006_auto_20141219_0926'), ('spud', '0007_auto_20141220_1653'), ('spud', '0008_auto_20141221_1045'), ('spud', '0009_auto_20141229_0455'), ('spud', '0010_auto_20150324_0920')]

    initial = True

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name='album',
            fields=[
                ('id', models.AutoField(primary_key=True, serialize=False)),
                ('title', models.CharField(max_length=96, db_index=True)),
                ('description', models.TextField(blank=True)),
                ('sort_name', models.CharField(blank=True, max_length=96)),
                ('sort_order', models.CharField(blank=True, max_length=96)),
                ('revised', models.DateTimeField(null=True)),
                ('revised_utc_offset', models.IntegerField(null=True)),
            ],
            options={
                'ordering': ['sort_name', 'sort_order', 'title'],
            },
        ),
        migrations.CreateModel(
            name='album_ascendant',
            fields=[
                ('id', models.AutoField(primary_key=True, serialize=False, auto_created=True, verbose_name='ID')),
                ('position', models.IntegerField()),
                ('ascendant', models.ForeignKey(related_name='descendant_set', to='spud.album')),
                ('descendant', models.ForeignKey(related_name='ascendant_set', to='spud.album')),
            ],
            options={
                'ordering': ['position'],
            },
        ),
        migrations.CreateModel(
            name='category',
            fields=[
                ('id', models.AutoField(primary_key=True, serialize=False)),
                ('title', models.CharField(max_length=96, db_index=True)),
                ('description', models.TextField(blank=True)),
                ('sort_name', models.CharField(blank=True, max_length=96)),
                ('sort_order', models.CharField(blank=True, max_length=96)),
            ],
            options={
                'ordering': ['sort_name', 'sort_order', 'title'],
            },
        ),
        migrations.CreateModel(
            name='category_ascendant',
            fields=[
                ('id', models.AutoField(primary_key=True, serialize=False, auto_created=True, verbose_name='ID')),
                ('position', models.IntegerField()),
                ('ascendant', models.ForeignKey(related_name='descendant_set', to='spud.category')),
                ('descendant', models.ForeignKey(related_name='ascendant_set', to='spud.category')),
            ],
            options={
                'ordering': ['position'],
            },
        ),
        migrations.CreateModel(
            name='feedback',
            fields=[
                ('id', models.AutoField(primary_key=True, serialize=False, auto_created=True, verbose_name='ID')),
                ('rating', models.IntegerField()),
                ('comment', models.TextField(blank=True)),
                ('user_name', models.CharField(blank=True, max_length=50)),
                ('user_email', models.EmailField(blank=True, max_length=75)),
                ('user_url', models.URLField(blank=True)),
                ('submit_datetime', models.DateTimeField()),
                ('utc_offset', models.IntegerField()),
                ('ip_address', models.GenericIPAddressField(null=True, blank=True, unpack_ipv4=True)),
                ('is_public', models.BooleanField(default=True)),
                ('is_removed', models.BooleanField(default=False)),
                ('parent', models.ForeignKey(blank=True, to='spud.feedback', related_name='children', null=True)),
            ],
            options={
                'ordering': ('submit_datetime',),
                'permissions': (('can_moderate', 'Can moderate'),),
            },
        ),
        migrations.CreateModel(
            name='feedback_ascendant',
            fields=[
                ('id', models.AutoField(primary_key=True, serialize=False, auto_created=True, verbose_name='ID')),
                ('position', models.IntegerField()),
                ('ascendant', models.ForeignKey(related_name='descendant_set', to='spud.feedback')),
                ('descendant', models.ForeignKey(related_name='ascendant_set', to='spud.feedback')),
            ],
            options={
                'ordering': ['position'],
            },
        ),
        migrations.CreateModel(
            name='person',
            fields=[
                ('id', models.AutoField(primary_key=True, serialize=False)),
                ('first_name', models.CharField(blank=True, max_length=96, db_index=True)),
                ('last_name', models.CharField(blank=True, max_length=96, db_index=True)),
                ('middle_name', models.CharField(blank=True, max_length=96)),
                ('called', models.CharField(blank=True, max_length=48)),
                ('gender', models.CharField(choices=[(b'1', b'male'), (b'2', b'female')], blank=True, max_length=1)),
                ('dob', models.DateField(null=True, blank=True)),
                ('dod', models.DateField(null=True, blank=True)),
                ('notes', models.TextField(blank=True)),
                ('email', models.CharField(blank=True, max_length=192)),
            ],
            options={
                'ordering': ['last_name', 'first_name'],
            },
        ),
        migrations.CreateModel(
            name='person_ascendant',
            fields=[
                ('id', models.AutoField(primary_key=True, serialize=False, auto_created=True, verbose_name='ID')),
                ('position', models.IntegerField()),
                ('ascendant', models.ForeignKey(related_name='descendant_set', to='spud.person')),
                ('descendant', models.ForeignKey(related_name='ascendant_set', to='spud.person')),
            ],
            options={
                'ordering': ['position'],
            },
        ),
        migrations.CreateModel(
            name='photo',
            fields=[
                ('id', models.AutoField(primary_key=True, serialize=False)),
                ('name', models.CharField(blank=True, max_length=128, db_index=True)),
                ('path', models.CharField(blank=True, max_length=255, db_index=True)),
                ('size', models.IntegerField(null=True, blank=True)),
                ('title', models.CharField(blank=True, max_length=64, db_index=True)),
                ('view', models.CharField(blank=True, max_length=64)),
                ('rating', models.FloatField(null=True, blank=True, db_index=True)),
                ('description', models.TextField(blank=True)),
                ('utc_offset', models.IntegerField()),
                ('datetime', models.DateTimeField(db_index=True)),
                ('camera_make', models.CharField(blank=True, max_length=32)),
                ('camera_model', models.CharField(blank=True, max_length=32)),
                ('flash_used', models.CharField(blank=True, max_length=1)),
                ('focal_length', models.CharField(blank=True, max_length=64)),
                ('exposure', models.CharField(blank=True, max_length=64)),
                ('compression', models.CharField(blank=True, max_length=64)),
                ('aperture', models.CharField(blank=True, max_length=16)),
                ('level', models.IntegerField()),
                ('iso_equiv', models.CharField(blank=True, max_length=8)),
                ('metering_mode', models.CharField(blank=True, max_length=32)),
                ('focus_dist', models.CharField(blank=True, max_length=16)),
                ('ccd_width', models.CharField(blank=True, max_length=16)),
                ('comment', models.TextField(blank=True)),
                ('action', models.CharField(null=True, choices=[(b'D', b'delete'), (b'S', b'regenerate size'), (b'R', b'regenerate thumbnails'), (b'V', b'regenerate video'), (b'M', b'move photo'), (b'auto', b'rotate automatic'), (b'90', b'rotate 90 degrees clockwise'), (b'180', b'rotate 180 degrees clockwise'), (b'270', b'rotate 270 degrees clockwise')], blank=True, max_length=4, db_index=True)),
                ('timestamp', models.DateTimeField()),
            ],
            options={
                'ordering': ['datetime', 'id'],
            },
        ),
        migrations.CreateModel(
            name='photo_album',
            fields=[
                ('id', models.AutoField(primary_key=True, serialize=False, auto_created=True, verbose_name='ID')),
                ('album', models.ForeignKey(to='spud.album')),
                ('photo', models.ForeignKey(to='spud.photo')),
            ],
            options={
                'abstract': False,
            },
        ),
        migrations.CreateModel(
            name='photo_category',
            fields=[
                ('id', models.AutoField(primary_key=True, serialize=False, auto_created=True, verbose_name='ID')),
                ('category', models.ForeignKey(to='spud.category')),
                ('photo', models.ForeignKey(to='spud.photo')),
            ],
            options={
                'abstract': False,
            },
        ),
        migrations.CreateModel(
            name='photo_person',
            fields=[
                ('id', models.AutoField(primary_key=True, serialize=False, auto_created=True, verbose_name='ID')),
                ('position', models.IntegerField(null=True, blank=True)),
                ('person', models.ForeignKey(to='spud.person')),
                ('photo', models.ForeignKey(to='spud.photo')),
            ],
            options={
                'ordering': ['position'],
            },
        ),
        migrations.CreateModel(
            name='photo_relation',
            fields=[
                ('id', models.AutoField(primary_key=True, serialize=False, auto_created=True, verbose_name='ID')),
                ('desc_1', models.CharField(max_length=384)),
                ('desc_2', models.CharField(max_length=384)),
                ('photo_1', models.ForeignKey(related_name='relations_1', db_column='photo_id_1', to='spud.photo')),
                ('photo_2', models.ForeignKey(related_name='relations_2', db_column='photo_id_2', to='spud.photo')),
            ],
            options={
                'abstract': False,
            },
        ),
        migrations.CreateModel(
            name='photo_thumb',
            fields=[
                ('id', models.AutoField(primary_key=True, serialize=False, auto_created=True, verbose_name='ID')),
                ('size', models.CharField(max_length=10, db_index=True)),
                ('width', models.IntegerField(null=True, blank=True)),
                ('height', models.IntegerField(null=True, blank=True)),
                ('photo', models.ForeignKey(to='spud.photo')),
            ],
            options={
                'abstract': False,
            },
        ),
        migrations.CreateModel(
            name='photo_video',
            fields=[
                ('id', models.AutoField(primary_key=True, serialize=False, auto_created=True, verbose_name='ID')),
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
        ),
        migrations.CreateModel(
            name='place',
            fields=[
                ('id', models.AutoField(primary_key=True, serialize=False)),
                ('title', models.CharField(max_length=192, db_index=True)),
                ('address', models.CharField(blank=True, max_length=192)),
                ('address2', models.CharField(blank=True, max_length=192)),
                ('city', models.CharField(blank=True, max_length=96)),
                ('state', models.CharField(blank=True, max_length=96)),
                ('postcode', models.CharField(blank=True, max_length=30)),
                ('country', models.CharField(blank=True, max_length=96)),
                ('url', models.CharField(blank=True, max_length=3072)),
                ('urldesc', models.CharField(blank=True, max_length=96)),
                ('notes', models.TextField(blank=True)),
                ('cover_photo', models.ForeignKey(blank=True, to='spud.photo', related_name='place_cover_of', null=True)),
                ('parent', models.ForeignKey(blank=True, to='spud.place', related_name='children', null=True)),
            ],
            options={
                'ordering': ['title'],
            },
        ),
        migrations.CreateModel(
            name='place_ascendant',
            fields=[
                ('id', models.AutoField(primary_key=True, serialize=False, auto_created=True, verbose_name='ID')),
                ('position', models.IntegerField()),
                ('ascendant', models.ForeignKey(related_name='descendant_set', to='spud.place')),
                ('descendant', models.ForeignKey(related_name='ascendant_set', to='spud.place')),
            ],
            options={
                'ordering': ['position'],
            },
        ),
        migrations.AddField(
            model_name='photo',
            name='albums',
            field=models.ManyToManyField(to='spud.album', related_name='photos', through='spud.photo_album'),
        ),
        migrations.AddField(
            model_name='photo',
            name='categorys',
            field=models.ManyToManyField(to='spud.category', related_name='photos', through='spud.photo_category'),
        ),
        migrations.AddField(
            model_name='photo',
            name='place',
            field=models.ForeignKey(blank=True, to='spud.place', on_delete=django.db.models.deletion.SET_NULL, related_name='photos', null=True),
        ),
        migrations.AddField(
            model_name='photo',
            name='persons',
            field=models.ManyToManyField(to='spud.person', related_name='photos', through='spud.photo_person'),
        ),
        migrations.AddField(
            model_name='photo',
            name='photographer',
            field=models.ForeignKey(blank=True, to='spud.person', on_delete=django.db.models.deletion.SET_NULL, related_name='photographed', null=True),
        ),
        migrations.AddField(
            model_name='photo',
            name='relations',
            field=models.ManyToManyField(to='spud.photo', through='spud.photo_relation'),
        ),
        migrations.AddField(
            model_name='person',
            name='cover_photo',
            field=models.ForeignKey(blank=True, to='spud.photo', on_delete=django.db.models.deletion.SET_NULL, related_name='person_cover_of', null=True),
        ),
        migrations.AddField(
            model_name='person',
            name='father',
            field=models.ForeignKey(blank=True, to='spud.person', on_delete=django.db.models.deletion.SET_NULL, related_name='father_of', null=True),
        ),
        migrations.AddField(
            model_name='person',
            name='home',
            field=models.ForeignKey(blank=True, to='spud.place', on_delete=django.db.models.deletion.SET_NULL, related_name='home_of', null=True),
        ),
        migrations.AddField(
            model_name='person',
            name='mother',
            field=models.ForeignKey(blank=True, to='spud.person', on_delete=django.db.models.deletion.SET_NULL, related_name='mother_of', null=True),
        ),
        migrations.AddField(
            model_name='person',
            name='spouse',
            field=models.ForeignKey(blank=True, to='spud.person', on_delete=django.db.models.deletion.SET_NULL, related_name='reverse_spouses', null=True),
        ),
        migrations.AddField(
            model_name='person',
            name='work',
            field=models.ForeignKey(blank=True, to='spud.place', on_delete=django.db.models.deletion.SET_NULL, related_name='work_of', null=True),
        ),
        migrations.AddField(
            model_name='feedback',
            name='photo',
            field=models.ForeignKey(related_name='feedbacks', to='spud.photo'),
        ),
        migrations.AddField(
            model_name='feedback',
            name='user',
            field=models.ForeignKey(blank=True, to=settings.AUTH_USER_MODEL, on_delete=django.db.models.deletion.SET_NULL, related_name='photos_feedbacks', null=True),
        ),
        migrations.AddField(
            model_name='category',
            name='cover_photo',
            field=models.ForeignKey(blank=True, to='spud.photo', on_delete=django.db.models.deletion.SET_NULL, related_name='category_cover_of', null=True),
        ),
        migrations.AddField(
            model_name='category',
            name='parent',
            field=models.ForeignKey(blank=True, to='spud.category', on_delete=django.db.models.deletion.PROTECT, related_name='children', null=True),
        ),
        migrations.AddField(
            model_name='album',
            name='cover_photo',
            field=models.ForeignKey(blank=True, to='spud.photo', on_delete=django.db.models.deletion.SET_NULL, related_name='album_cover_of', null=True),
        ),
        migrations.AddField(
            model_name='album',
            name='parent',
            field=models.ForeignKey(blank=True, to='spud.album', on_delete=django.db.models.deletion.PROTECT, related_name='children', null=True),
        ),
        migrations.AlterField(
            model_name='photo',
            name='timestamp',
            field=models.DateTimeField(auto_now_add=True),
        ),
        migrations.AlterField(
            model_name='place',
            name='cover_photo',
            field=models.ForeignKey(blank=True, to='spud.photo', on_delete=django.db.models.deletion.SET_NULL, related_name='place_cover_of', null=True),
        ),
        migrations.AlterField(
            model_name='place',
            name='parent',
            field=models.ForeignKey(blank=True, to='spud.place', on_delete=django.db.models.deletion.PROTECT, related_name='children', null=True),
        ),
        migrations.AlterModelOptions(
            name='photo',
            options={'ordering': ['datetime', 'id']},
        ),
        migrations.RenameField(
            model_name='person',
            old_name='gender',
            new_name='sex',
        ),
        migrations.AlterUniqueTogether(
            name='photo_relation',
            unique_together=set([('photo_1', 'photo_2')]),
        ),
        migrations.AlterField(
            model_name='album',
            name='description',
            field=models.TextField(null=True, blank=True),
        ),
        migrations.AlterField(
            model_name='album',
            name='revised',
            field=models.DateTimeField(null=True, blank=True),
        ),
        migrations.AlterField(
            model_name='album',
            name='revised_utc_offset',
            field=models.IntegerField(null=True, blank=True),
        ),
        migrations.AlterField(
            model_name='album',
            name='sort_name',
            field=models.CharField(null=True, blank=True, max_length=96),
        ),
        migrations.AlterField(
            model_name='album',
            name='sort_order',
            field=models.CharField(null=True, blank=True, max_length=96),
        ),
        migrations.AlterField(
            model_name='category',
            name='description',
            field=models.TextField(null=True, blank=True),
        ),
        migrations.AlterField(
            model_name='category',
            name='sort_name',
            field=models.CharField(null=True, blank=True, max_length=96),
        ),
        migrations.AlterField(
            model_name='category',
            name='sort_order',
            field=models.CharField(null=True, blank=True, max_length=96),
        ),
        migrations.AlterField(
            model_name='feedback',
            name='comment',
            field=models.TextField(null=True, blank=True),
        ),
        migrations.AlterField(
            model_name='feedback',
            name='user_email',
            field=models.EmailField(null=True, blank=True, max_length=75),
        ),
        migrations.AlterField(
            model_name='feedback',
            name='user_name',
            field=models.CharField(null=True, blank=True, max_length=50),
        ),
        migrations.AlterField(
            model_name='feedback',
            name='user_url',
            field=models.URLField(null=True, blank=True),
        ),
        migrations.AlterField(
            model_name='person',
            name='called',
            field=models.CharField(null=True, blank=True, max_length=48),
        ),
        migrations.AlterField(
            model_name='person',
            name='email',
            field=models.CharField(null=True, blank=True, max_length=192),
        ),
        migrations.AlterField(
            model_name='person',
            name='first_name',
            field=models.CharField(max_length=96, db_index=True),
        ),
        migrations.AlterField(
            model_name='person',
            name='last_name',
            field=models.CharField(null=True, blank=True, max_length=96, db_index=True),
        ),
        migrations.AlterField(
            model_name='person',
            name='middle_name',
            field=models.CharField(null=True, blank=True, max_length=96),
        ),
        migrations.AlterField(
            model_name='person',
            name='notes',
            field=models.TextField(null=True, blank=True),
        ),
        migrations.AlterField(
            model_name='person',
            name='sex',
            field=models.CharField(null=True, choices=[('1', 'male'), ('2', 'female')], blank=True, max_length=1),
        ),
        migrations.AlterField(
            model_name='photo',
            name='aperture',
            field=models.CharField(null=True, blank=True, max_length=16),
        ),
        migrations.AlterField(
            model_name='photo',
            name='camera_make',
            field=models.CharField(null=True, blank=True, max_length=32),
        ),
        migrations.AlterField(
            model_name='photo',
            name='camera_model',
            field=models.CharField(null=True, blank=True, max_length=32),
        ),
        migrations.AlterField(
            model_name='photo',
            name='ccd_width',
            field=models.CharField(null=True, blank=True, max_length=16),
        ),
        migrations.AlterField(
            model_name='photo',
            name='comment',
            field=models.TextField(null=True, blank=True),
        ),
        migrations.AlterField(
            model_name='photo',
            name='compression',
            field=models.CharField(null=True, blank=True, max_length=64),
        ),
        migrations.AlterField(
            model_name='photo',
            name='description',
            field=models.TextField(null=True, blank=True),
        ),
        migrations.AlterField(
            model_name='photo',
            name='exposure',
            field=models.CharField(null=True, blank=True, max_length=64),
        ),
        migrations.AlterField(
            model_name='photo',
            name='flash_used',
            field=models.CharField(null=True, blank=True, max_length=1),
        ),
        migrations.AlterField(
            model_name='photo',
            name='focal_length',
            field=models.CharField(null=True, blank=True, max_length=64),
        ),
        migrations.AlterField(
            model_name='photo',
            name='focus_dist',
            field=models.CharField(null=True, blank=True, max_length=16),
        ),
        migrations.AlterField(
            model_name='photo',
            name='iso_equiv',
            field=models.CharField(null=True, blank=True, max_length=8),
        ),
        migrations.AlterField(
            model_name='photo',
            name='metering_mode',
            field=models.CharField(null=True, blank=True, max_length=32),
        ),
        migrations.AlterField(
            model_name='photo',
            name='name',
            field=models.CharField(max_length=128, db_index=True),
        ),
        migrations.AlterField(
            model_name='photo',
            name='path',
            field=models.CharField(max_length=255, db_index=True),
        ),
        migrations.AlterField(
            model_name='photo',
            name='view',
            field=models.CharField(null=True, blank=True, max_length=64),
        ),
        migrations.AlterField(
            model_name='place',
            name='address',
            field=models.CharField(null=True, blank=True, max_length=192),
        ),
        migrations.AlterField(
            model_name='place',
            name='address2',
            field=models.CharField(null=True, blank=True, max_length=192),
        ),
        migrations.AlterField(
            model_name='place',
            name='city',
            field=models.CharField(null=True, blank=True, max_length=96),
        ),
        migrations.AlterField(
            model_name='place',
            name='country',
            field=models.CharField(null=True, blank=True, max_length=96),
        ),
        migrations.AlterField(
            model_name='place',
            name='notes',
            field=models.TextField(null=True, blank=True),
        ),
        migrations.AlterField(
            model_name='place',
            name='postcode',
            field=models.CharField(null=True, blank=True, max_length=30),
        ),
        migrations.AlterField(
            model_name='place',
            name='state',
            field=models.CharField(null=True, blank=True, max_length=96),
        ),
        migrations.AlterField(
            model_name='place',
            name='url',
            field=models.CharField(null=True, blank=True, max_length=3072),
        ),
        migrations.AlterField(
            model_name='place',
            name='urldesc',
            field=models.CharField(null=True, blank=True, max_length=96),
        ),
        migrations.AlterField(
            model_name='album',
            name='title',
            field=models.CharField(null=True, blank=True, max_length=96, db_index=True),
        ),
        migrations.AlterField(
            model_name='photo',
            name='action',
            field=models.CharField(null=True, choices=[('D', 'delete'), ('R', 'regenerate thumbnails & video'), ('M', 'move photo'), ('auto', 'rotate automatic'), ('90', 'rotate 90 degrees clockwise'), ('180', 'rotate 180 degrees clockwise'), ('270', 'rotate 270 degrees clockwise')], blank=True, max_length=4, db_index=True),
        ),
    ]
