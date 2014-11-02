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

import os
import re
from random import choice


class Command(NoArgsCommand):
        help = 'Update secret key in /etc/spud/settings.py'

        def handle_noargs(self, **options):
            main_settings_file = "/etc/spud/settings.py"
            main_settings_file_tmp = "/etc/spud/settings.py.tmp"

            settings_contents = open(main_settings_file, 'r').read()
            secret_key = ''.join([
                choice('abcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*(-_=+)')
                for i in range(50)
            ])
            settings_contents = re.sub(
                r"(?<=SECRET_KEY = ')[^']*'",
                secret_key + "'", settings_contents)

            fp = open(main_settings_file_tmp, 'w')
            fp.write(settings_contents)
            fp.close()

            os.rename(main_settings_file_tmp, main_settings_file)
