# spud - keep track of photos
# Copyright (C) 2008-2013 Brian May
#
# This program is free software: you can redistribute it and/or modify
# it under the terms of the GNU General Public License as published by
# the Free Software Foundation, either version 3 of the License, or
# (at your option) any later version.
#
# This program is distributed in the hope that it will be useful,
# but WITHOUT ANY WARRANTY; without even the implied warranty of
# MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
# GNU General Public License for more details.
#
# You should have received a copy of the GNU General Public License
# along with this program.  If not, see <http://www.gnu.org/licenses/>.
from __future__ import absolute_import
from __future__ import unicode_literals
from __future__ import print_function

import os
import datetime
import shutil
import pytz

from django.conf import settings
from django.db import transaction

import spud.models
import spud.media


def timezone(name):
    if name[0:4] == 'UTC+' or name[0:4] == 'UTC-':
        offset = int(name[3:])*60
        return pytz.FixedOffset(offset)
    else:
        return pytz.timezone(name)


def set_album_list(photo, album_list):
    for album in album_list:
        spud.models.photo_album.objects.create(photo=photo, album=album)


def set_category_list(photo, category_list):
    for category in category_list:
        spud.models.photo_category.objects.create(
            photo=photo, category=category)


@transaction.commit_on_success
def import_photo(
        tmp_filename, src_filename,
        photographer, location, albums, categorys,
        src_timezone, dst_timezone, offset, dryrun, action):

    print()

    # check source file
    if not os.path.exists(file):
        raise RuntimeError("source photo doesn't exist at %s" % (file))
    m = spud.media.get_media(file)

    # set everything without commiting anything
    photo = spud.models.photo()
    photo.title = ''
    photo.photographer = photographer
    photo.location = location
    photo.view = ''
    photo.rating = None
    photo.description = ''
    photo.comment = ""
    photo.level = 1
    photo.action = action
    photo.timestamp = datetime.datetime.now()

    photo.update_from_source(media=m)

    # get time
    dt = m.get_datetime()
    print(dt)

    if src_timezone is None:
        src_timezone = pytz.timezone(settings.TIME_ZONE)

    dt = src_timezone.localize(dt)
    print(dt)

    # adjust time for destination timezone
    if dst_timezone is None:
        dst_timezone = pytz.timezone(settings.TIME_ZONE)

    dt = dt.astimezone(dst_timezone)
    print(dt)

    # add manual offsets
    dt += offset
    if photo.camera_model in settings.DEFAULT_DTOFFSET:
        dt += settings.DEFAULT_DTOFFSET[photo.camera_model]
    print(dt)

    # save the time
    photo.utc_offset = dt.utcoffset().total_seconds() / 60
    photo.datetime = dt.astimezone(pytz.utc).replace(tzinfo=None)

    # determine the destination path
    path = "%04d/%02d/%02d" % (dt.year, dt.month, dt.day)
    filename = os.path.basename(src_filename)
    path, filename = spud.models.photo.get_new_name(
        tmp_filename, path, filename)
    photo.path = path
    photo.name = filename
    dst = photo.get_orig_path()

    # don't do anything in dryrun mode
    if dryrun:
        print("would import %s to %s/%s (%s)"
              % (tmp_filename, path, filename, dt))
        return photo

    # Go ahead and do stuff
    print("importing %s to %s/%s" % (tmp_filename, path, filename))

    umask = os.umask(0o022)
    if not os.path.lexists(os.path.dirname(dst)):
        os.makedirs(os.path.dirname(dst), 0o755)

    try:
        shutil.copyfile(tmp_filename, dst)
        photo.save()
        set_album_list(photo, albums)
        set_category_list(photo, categorys)

        os.umask(umask)
    except:
        print("An exception occcured importing photo.")
        photo.delete()
        raise

    print("imported  %s to %s/%s as %d"
          % (tmp_filename, path, filename, photo.pk))

    return photo
