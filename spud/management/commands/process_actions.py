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

from django.core.management.base import BaseCommand

from spud import models


class Command(BaseCommand):
    help = 'Process pending actions in spud'

    def handle(self, **options):

        for p in models.photo.objects.filter(
                action__isnull=False).order_by("pk"):
            name = p.name
            if p.action == "D":
                print(f"delete '{name}'.")
                p.delete()
            elif p.action == "R":
                print(f"move '{name}'.")
                p.move()
                print(f"regenerate thumbnail '{name}'")
                p.generate_thumbnails(overwrite=True)
                p.generate_videos(overwrite=True)
            elif p.action == "auto":
                print(f"move '{name}'.")
                p.move()
                print(f"rotate '{name}' by '{p.action}'")
                p.rotate_orig(p.action)
                print(f"regenerate thumbnail '{name}'")
                p.generate_thumbnails(overwrite=True)
            elif p.action == "90":
                print(f"move '{name}'.")
                p.move()
                print(f"rotate '{name}' by '{p.action}'")
                p.rotate_orig(p.action)
                print(f"regenerate thumbnail '{name}'")
                p.generate_thumbnails(overwrite=True)
            elif p.action == "180":
                print(f"move '{name}'.")
                p.move()
                print(f"rotate '{name}' by '{p.action}'")
                p.rotate_orig(p.action)
                print(f"regenerate thumbnail '{name}'")
                p.generate_thumbnails(overwrite=True)
            elif p.action == "270":
                print(f"move '{name}'.")
                p.move()
                print(f"rotate '{name}' by '{p.action}'")
                p.rotate_orig(p.action)
                print(f"regenerate thumbnail '{name}'")
                p.generate_thumbnails(overwrite=True)
            elif p.action == "M":
                print(f"move '{name}'.")
                p.move()
            else:
                raise RuntimeError(
                    f"Uknown action '{p.action}' for '{name}'")

            if p.action != "D":
                p.action = None
                p.save()
