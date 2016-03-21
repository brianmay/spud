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

from django.core.management.base import NoArgsCommand
from spud import models


class Command(NoArgsCommand):
        help = 'Process pending actions in spud'

        def handle_noargs(self, **options):

            for p in models.photo.objects.filter(
                    action__isnull=False).order_by("pk"):
                if p.action == "D":
                    print("delete '%s'." % (p.get_orig_path()))
                    p.delete()
                elif p.action == "R":
                    print("regenerate thumbnail '%s'" % (p.get_orig_path()))
                    p.generate_thumbnails(overwrite=True)
                    p.generate_videos(overwrite=True)
                elif p.action == "auto":
                    print("rotate '%s' by '%s'"
                          % (p.get_orig_path(), p.action))
                    p.rotate(p.action)
                    print("regenerate thumbnail '%s'" % (p.get_orig_path()))
                    p.generate_thumbnails(overwrite=True)
                elif p.action == "90":
                    print("rotate '%s' by '%s'"
                          % (p.get_orig_path(), p.action))
                    p.rotate(p.action)
                    print("regenerate thumbnail '%s'" % (p.get_orig_path()))
                    p.generate_thumbnails(overwrite=True)
                elif p.action == "180":
                    print("rotate '%s' by '%s'"
                          % (p.get_orig_path(), p.action))
                    p.rotate(p.action)
                    print("regenerate thumbnail '%s'" % (p.get_orig_path()))
                    p.generate_thumbnails(overwrite=True)
                elif p.action == "270":
                    print("rotate '%s' by '%s'"
                          % (p.get_orig_path(), p.action))
                    p.rotate(p.action)
                    print("regenerate thumbnail '%s'" % (p.get_orig_path()))
                    p.generate_thumbnails(overwrite=True)
                elif p.action == "M":
                    pass
                else:
                    raise RuntimeError(
                        "Uknown action '%s' for '%s'" %
                        (p.action, p.get_orig_path()))

                if p.action != "D":
                    print("move '%s'." % (p.get_orig_path()))
                    p.move()
                    p.action = None
                    p.save()
