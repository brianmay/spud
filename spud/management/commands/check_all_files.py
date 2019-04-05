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

from spud.models import photo_file


class Command(BaseCommand):
    help = 'Process pending actions in spud'

    def handle(self, **options):
        errors = photo_file.check_all_files()
        for error in errors:
            print(f"Error: {error}")
        if len(errors) > 0:
            raise CommandError("Errors were detected.")
