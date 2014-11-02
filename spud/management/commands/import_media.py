#!/usr/bin/python
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

from django.core.management.base import BaseCommand, CommandError

from optparse import make_option
import os
import datetime
import sys

from django.conf import settings

from spud import models
import spud.upload

import pytz


class Command(BaseCommand):
        args = '<file file ...>'
        help = 'Imports photos into spud'
        option_list = BaseCommand.option_list + (
            make_option(
                "-d", "--dry-run", action="store_true",
                dest="dryrun", default=False,
                help="Dry run - used for testing timezone"),
            make_option(
                "-p", "--photographer", action="store", dest="photographer",
                help="Name of photographer to use when importing images"),
            make_option(
                "-l", "--location", action="store", dest="location",
                help="Name of location to use when importing images"),
            make_option(
                "-r", "--rotate", action="store", dest="rotate",
                help="Amount to rotate imported photos (auto,0,90,180,270)"),
            make_option(
                "-a", "--album", action="append", dest="album",
                help="Name of album to use when importing images"),
            make_option(
                "--parse-name", action="store_true",
                dest="parse_name", default=False,
                help="Extract album names from file name"),
            make_option(
                "-c", "--category", action="append", dest="category",
                help="Name of category to use when importing images"),
            make_option(
                "-s", "--source-timezone", action="store", dest="src_timezone",
                help="Source timezone that camera was set to"),
            make_option(
                "-t", "--timezone", action="store", dest="dst_timezone",
                help="Timezone that should be used to display photos"),
            make_option(
                "-o", "--offset", action="store", dest="offset",
                help="Adjust the time by [+-]HH:MM:SS"),
        )

        def handle(self, *args, **options):
            spud_file = u"%s/%s" % (settings.IMAGE_PATH, ".spud.txt")
            if not os.path.exists(spud_file):
                raise RuntimeError(
                    "Cannot find spud file. Is '%s' mounted???"
                    % (settings.IMAGE_PATH))

            io = {}

            io['dryrun'] = options['dryrun']

            io['action'] = "V"

            rotate = "0"
            if options['rotate']:
                if options['rotate'] == "0":
                    rotate = "0"
                elif options['rotate'] == "auto":
                    rotate = "auto"
                elif options['rotate'] == "90":
                    rotate = "90"
                elif options['rotate'] == "180":
                    rotate = "180"
                elif options['rotate'] == "270":
                    rotate = "270"
                else:
                    raise CommandError(
                        "unknown value '%s' for rotate" % (options['rotate']))

            d = {}

            d['photographer'] = None
            if options['photographer'] is not None:
                (first_name, last_name) = options['photographer'].split(" ")
                d['photographer'] = models.person.objects.get(
                    first_name=first_name, last_name=last_name)

            d['location'] = None
            if options['location'] is not None:
                d['location'] = models.place.objects.get(
                    title=options['location'])

            d['albums'] = []
            if options['album'] is None:
                options['album'] = []
            for album in options['album']:
                d['albums'].append(models.album.objects.get(title=album))
            d['parse_name'] = options['parse_name']
            if options['parse_name'] and len(album) != 1:
                CommandError("Need exactly one album for parse_names option")

            d['categorys'] = []
            if options['category'] is None:
                options['category'] = []
            for category in options['category']:
                d['categorys'].append(
                    models.category.objects.get(title=category).pk)

            if options['src_timezone'] is not None:
                d['src_timezone'] = pytz.timezone(options['src_timezone'])

            if options['dst_timezone'] is not None:
                d['dst_timezone'] = pytz.timezone(options['dst_timezone'])

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
                (hh, mm, ss) = offset.split(":")

                hh = int(hh)
                mm = int(mm)
                ss = int(ss)

                d['offset'] = direction * datetime.timedelta(
                    hours=hh, minutes=mm, seconds=ss)
            else:
                d['offset'] = datetime.timedelta(hours=0, minutes=0, seconds=0)

            warnings = 0
            for arg in args:
                try:
                    photo = spud.upload.import_photo(arg, d, io)
                except models.photo_already_exists_error, e:
                    warnings = warnings + 1
                    sys.stderr.write("Skipping %s due to %s\n" % (arg, e))
                else:
                    if not options['dryrun']:
                        photo.rotate(rotate)
                        photo.generate_thumbnails(overwrite=False)

            if warnings > 0:
                sys.stderr.write("%d warnings found\n" % (warnings))

            return 0
