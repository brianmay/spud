# Copyright 2008-2011, 2013-2015 VPAC
#
# This file is part of Karaage.
#
# Karaage is free software: you can redistribute it and/or modify
# it under the terms of the GNU General Public License as published by
# the Free Software Foundation, either version 3 of the License, or
# (at your option) any later version.
#
# Karaage is distributed in the hope that it will be useful,
# but WITHOUT ANY WARRANTY; without even the implied warranty of
# MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
# GNU General Public License for more details.
#
# You should have received a copy of the GNU General Public License
# along with Karaage  If not, see <http://www.gnu.org/licenses/>.

from spud import __version__
from django.conf import settings
from django.urls import reverse


def common(request):
    """ Set context with common variables. """
    api_root_url = getattr(settings, 'API_ROOT_URL', reverse('root'))

    ctx = {
        'API_ROOT_URL': api_root_url,
        'version': __version__,
        'BUILD_DATE': settings.BUILD_DATE,
        'VCS_REF': settings.VCS_REF,
    }

    return ctx
