# Generated by Django 2.1.2 on 2019-03-21 17:22
import base64
import logging
import os

import mimetypes
from django.db import migrations

from django.conf import settings
from spud.media import get_media


logger = logging.getLogger(__name__)


def populate_photo_files(apps, schema_editor):
    photo_file = apps.get_model('spud', 'photo_file')

    photo = apps.get_model('spud', 'photo')

    for p in photo.objects.all():
        dir = os.path.join("orig", p.path)
        full_path = os.path.join(settings.IMAGE_PATH, dir, p.name)
        media = get_media(full_path)
        mime_type, _ = mimetypes.guess_type(full_path)
        sha256_hash = media.get_sha256_hash()
        xy_size = media.get_size()
        num_bytes = media.get_num_bytes()
        size_key = 'orig'

        print(f"{p.pk} {full_path} {base64.encodebytes(sha256_hash)}")
        if photo_file.objects.filter(size_key=size_key, sha256_hash=sha256_hash).count() > 0:
            print("SKIPPING {p.pk} {full_path} {base64.encodebytes(sha256_hash)}")
            continue

        photo_file.objects.create(
            photo_id=p.pk,
            size_key=size_key,
            width=xy_size[0],
            height=xy_size[1],
            mime_type=mime_type,
            dir=dir,
            name=p.name,
            is_video=False,
            sha256_hash=sha256_hash,
            num_bytes=num_bytes,
        )

        for pf in p.photo_thumb_set.all():
            short_name, extension = os.path.splitext(pf.photo.name)
            name = f"{short_name}.jpg"
            dir = os.path.join("thumb", pf.size, pf.photo.path)
            full_path = os.path.join(settings.IMAGE_PATH, dir, name)
            media = get_media(full_path)
            sha256_hash = media.get_sha256_hash()
            num_bytes = media.get_num_bytes()

            print(f"---> {pf.pk} {full_path} {base64.encodebytes(sha256_hash)}")
            photo_file.objects.create(
                photo_id=pf.photo_id,
                size_key=pf.size,
                width=pf.width,
                height=pf.height,
                mime_type="image/jpeg",
                dir=dir,
                name=name,
                is_video=False,
                sha256_hash=sha256_hash,
                num_bytes=num_bytes,
            )

        for pf in p.photo_video_set.all():
            short_name, _ = os.path.splitext(pf.photo.name)
            name = f"{short_name}.{pf.extension}"
            dir = os.path.join("video", pf.size, pf.photo.path)
            full_path = os.path.join(settings.IMAGE_PATH, dir, name)
            media = get_media(full_path)
            sha256_hash = media.get_sha256_hash()
            num_bytes = media.get_num_bytes()

            print(f"---> {pf.pk} {full_path} {base64.encodebytes(sha256_hash)}")
            photo_file.objects.create(
                photo_id=pf.photo_id,
                size_key=pf.size,
                width=pf.width,
                height=pf.height,
                mime_type=pf.format,
                dir=dir,
                name=name,
                is_video=True,
                sha256_hash=sha256_hash,
                num_bytes=num_bytes,
            )


class Migration(migrations.Migration):

    dependencies = [
        ('spud', '0004_auto_20190324_1831'),
    ]

    operations = [
        migrations.RunPython(populate_photo_files)
    ]
