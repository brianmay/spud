#!/usr/bin/python
# spud - keep track of computers and licenses
# Copyright (C) 2008-2009 Brian May
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

from django.core.management.base import BaseCommand, CommandError

from optparse import make_option
import os
import datetime
import shutil
import sys
import pytz

from django.conf import settings
from django.db import transaction

from spud import models, media

class Command(BaseCommand):
        args = '<file file ...>'
        help = 'Imports photos into spud'
        option_list = BaseCommand.option_list + (
            make_option("-d", "--dry-run",action="store_true", dest="dryrun",default=False,
                              help="Dry run - used for testing timezone"),
            make_option("-p", "--photographer",action="store", dest="photographer",
                              help="Name of photographer to use when importing images"),
            make_option("-l", "--location",action="store", dest="location",
                              help="Name of location to use when importing images"),
            make_option("-r", "--rotate",action="store", dest="rotate",
                              help="Amount to rotate imported photos (auto,0,90,180,270)"),
            make_option("-a", "--album",action="append", dest="album",
                              help="Name of album to use when importing images"),
            make_option("--parent", action="store", dest="parent",
                              help="Name of parent album to use; if Album doesn't exist it will be created"),
            make_option("-c", "--category",action="append", dest="category",
                              help="Name of category to use when importing images"),
            make_option("-s", "--source-timezone",action="store", dest="src_timezone",
                              help="Source timezone that camera was set to"),
            make_option("-t", "--timezone",action="store", dest="dst_timezone",
                              help="Timezone that should be used to display photos"),
            make_option("-o", "--offset",action="store", dest="offset",
                              help="Adjust the time by [+-]HH:MM:SS"),
        )

        def handle(self, *args, **options):
            spud_file = u"%s/%s"%(settings.IMAGE_PATH,".spud.txt")
            if not os.path.exists(spud_file):
                raise RuntimeError("Cannot find spud file. Is '%s' mounted???"%(settings.IMAGE_PATH))

            io = import_options()

            io.dryrun = options['dryrun']

            io.action = "R"
            if options['rotate']:
                if options['rotate'] == "0":
                    io.action = "R"
                elif options['rotate'] == "auto":
                    io.action = "auto"
                elif options['rotate'] == "90":
                    io.action = "90"
                elif options['rotate'] == "180":
                    io.action = "180"
                elif options['rotate'] == "270":
                    io.action = "270"
                else:
                    raise CommandError("unknown value '%s' for rotate"%(options['rotate']))

            d = defaults()

            d.photographer = None
            if options['photographer'] is not None:
                (first_name,last_name) = options['photographer'].split(" ")
                d.photographer = models.person.objects.get(first_name=first_name,last_name=last_name)

            d.location = None
            if options['location'] is not None:
                d.location = models.place.objects.get(title=options['location'])

            d.albums = []
            if options['album'] is None:
                options['album'] = []
            if options['parent'] is None:
                for album in options['album']:
                    d.albums.append(models.album.objects.get(album=album).pk)
            else:
                parent = models.album.objects.get(album=options['parent'])
                for album in options['album']:
                    album,c = models.album.objects.get_or_create(parent_album=parent,album=album)
                    d.albums.append(album.pk)

            d.categorys = []
            if options['category'] is None:
                options['category'] = []
            for category in options['category']:
                d.categorys.append(models.category.objects.get(category=category).pk)

            if options['src_timezone'] is None:
                d.src_timezone = timezone(settings.TIME_ZONE)
            else:
                d.src_timezone = timezone(options['src_timezone'])

            if options['dst_timezone'] is None:
                d.dst_timezone = timezone(settings.TIME_ZONE)
            else:
                d.dst_timezone = timezone(options['dst_timezone'])

            offset = options['offset']
            if offset is not None:
                if offset[0] == '+':
                    direction = 1
                    offset = offset[1:]
                elif offset[0] == '-':
                    direction = -1
                    offset = offset[1:]
                else:
                    direction = 1
                (hh,mm,ss) = offset.split(":")

                hh = int(hh)
                mm = int(mm)
                ss = int(ss)

                d.offset = direction * datetime.timedelta(hours=hh, minutes=mm, seconds=ss)
            else:
                d.offset = datetime.timedelta(hours=0, minutes=0, seconds=0)

            warnings = 0
            for arg in args:
                try:
                    import_photo(arg,d,io)
                except models.photo_already_exists_error, e:
                    warnings = warnings + 1
                    sys.stderr.write( "Skipping %s due to %s\n"%(arg,e))

            if warnings > 0:
                sys.stderr.write("%d warnings found\n"%(warnings))

            return 0


def timezone(name):
    if name[0:4] == 'UTC+' or name[0:4] == 'UTC-':
        offset = int(name[3:])*60
        return pytz.FixedOffset(offset)
    else:
        return pytz.timezone(name)

def set_album_list(photo, pk_list):
    pa_list = photo.photo_album_set.all()
    for pa in pa_list:
        if pa.album.pk in pk_list:
            pk_list.remove(pa.album.pk)
        else:
            pa.delete()

    for pk in pk_list:
        pa = models.photo_album.objects.create(photo=photo,album_id=pk)

def set_category_list(photo, pk_list):
    pa_list = photo.photo_category_set.all()
    for pa in pa_list:
        if pa.category.pk in pk_list:
            pk_list.remove(pa.category.pk)
        else:
            pa.delete()

    for pk in pk_list:
        pa = models.photo_category.objects.create(photo=photo,category_id=pk)

@transaction.commit_on_success
def import_photo(file,d,options):
    print

    # check source file
    if not os.path.exists(file):
        raise RuntimeError("source photo doesn't exist at %s"%(file))
    m = media.get_media(file)

    # set everything without commiting anything
    photo = models.photo()
    photo.title = ''
    photo.photographer = d.photographer
    photo.location = d.location
    photo.view = ''
    photo.rating = None
    photo.description = ''
    photo.comment = ""
    photo.level = 1
    photo.action = options.action
    photo.timestamp =datetime.datetime.now()

    photo.update_from_source(media=m)

    # get time
    dt = m.get_datetime()
    print dt

    # adjust time for source timezone
    if photo.camera_model in settings.DEFAULT_TIMEZONE:
        src_timezone = settings.DEFAULT_TIMEZONE[photo.camera_model]
        src_timezone = timezone(src_timezone)
    else:
        src_timezone = d.src_timezone
    dt = src_timezone.localize(dt)
    print dt

    # adjust time for destination timezone
    dt = dt.astimezone(d.dst_timezone)
    print dt

    # add manual offsets
    dt += d.offset
    if photo.camera_model in settings.DEFAULT_DTOFFSET:
        dt += settings.DEFAULT_DTOFFSET[photo.camera_model]
    print dt

    # save the time
    photo.utc_offset = dt.utcoffset().total_seconds() / 60
    photo.datetime = dt.astimezone(pytz.utc).replace(tzinfo=None)

    # determine the destination path
    path = "%04d/%02d/%02d"%(dt.year,dt.month,dt.day)
    name = os.path.basename(file)
    path, name = models.photo.get_new_name(file, path, name)
    photo.path = path
    photo.name = name
    dst = photo.get_orig_path()

    # don't do anything in dryrun mode
    if options.dryrun:
        print "would import %s to %s/%s (%s)"%(file,path,name,dt)
        return

    # Go ahead and do stuff
    print "importing %s to %s/%s"%(file,path,name)

    umask = os.umask(0022)
    if not os.path.lexists(os.path.dirname(dst)):
        os.makedirs(os.path.dirname(dst),0755)
    shutil.copyfile(file,dst)

    photo.save()
    set_album_list(photo, d.albums)
    set_category_list(photo, d.categorys)

    os.umask(umask)

    print "imported  %s to %s/%s as %d"%(file,path,name,photo.pk)

class defaults:
    pass

class import_options:
    pass

