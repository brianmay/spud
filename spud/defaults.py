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

import sys
import django
from socket import getfqdn

SITE_ID = 1
SESSION_COOKIE_SECURE = True

# If you set this to False, Django will make some optimizations so as not
# to load the internationalization machinery.
USE_I18N = True

# Absolute path to the directory that holds media.
# Example: "/home/media/media.lawrence.com/"
STATIC_ROOT = "/var/lib/spud/static"

# URL that handles the media served from MEDIA_ROOT. Make sure to use a
# trailing slash if there is a path component (optional in other cases).
# Examples: "http://media.lawrence.com", "http://example.com/media/"
STATIC_URL = '/spud/static/'

# List of callables that know how to import templates from various sources.
TEMPLATE_LOADERS = (
    'django.template.loaders.filesystem.Loader',
    'django.template.loaders.app_directories.Loader',
)

TEMPLATE_CONTEXT_PROCESSORS = (
    "spud.context_processors.common",
    "django.contrib.auth.context_processors.auth",
    "django.core.context_processors.debug",
    "django.core.context_processors.i18n",
    "django.core.context_processors.media",
    "django.core.context_processors.request",
    "django.core.context_processors.static",
)

MIDDLEWARE_CLASSES = (
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
)

ROOT_URLCONF = 'spud.urls'

TEMPLATE_DIRS = (
    "/etc/spud/templates",
)

INSTALLED_APPS = (
    'spud',
    'pipeline',
    'rest_framework',
    'corsheaders',
    'django.contrib.auth',
    'django.contrib.admin',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.sites',
    'django.contrib.staticfiles',
)

# South not available for Python 3+ or Django 1.7+
if sys.version_info < (3, 0) and django.VERSION < (1, 7):
    INSTALLED_APPS += ('south',)

LOGIN_URL = "/spud/account/login/"
LOGIN_REDIRECT_URL = "/spud/"
LOGOUT_URL = "/spud/account/login/"

IMAGE_PATH = "/var/lib/spud/images/"
IMAGE_URL = "/images/"
IMAGE_PATH = None

IMAGE_SIZES = {
    'thumb': {'size': 120, 'draft': True},
    'mid': {'size': 480, 'draft': True},
    'large': {'size': 960, 'draft': False},
}

DEFAULT_LIST_SIZE = 'thumb'

VIDEO_SIZES = {
    '320': {'size': 320},
}

VIDEO_FORMATS = {
    'video/webm': {'extension': 'webm', 'priority': 1},
    'video/ogg': {'extension': 'ogv', 'priority': 2},
    'video/mp4': {'extension': 'mp4', 'priority': 3},
}

# USE_TZ = True
DEFAULT_TIMEZONE = {}
DEFAULT_DTOFFSET = {}

# Local time zone for this installation. Choices can be found here:
# http://en.wikipedia.org/wiki/List_of_tz_zones_by_name
# although not all choices may be available on all operating systems.
# If running in a Windows environment this must be set to the same as your
# system time zone.
TIME_ZONE = 'UTC'


DEFAULT_CONTENT_TYPE = "application/xhtml+xml"

# The name of the class to use for starting the test suite.
TEST_RUNNER = 'django.test.runner.DiscoverRunner'

ALLOWED_HOSTS = [getfqdn()]

REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'rest_framework.authentication.SessionAuthentication',
    ),
    'DEFAULT_PERMISSION_CLASSES': (
        'rest_framework.permissions.DjangoModelPermissionsOrAnonReadOnly',
    ),
    'DEFAULT_PAGINATION_CLASS':
        'rest_framework.pagination.PageNumberPagination',
    'PAGE_SIZE': 10,
}
ANONYMOUS_USER_ID = -1

###
# DJANGO PIPELINE
###
STATICFILES_STORAGE = 'pipeline.storage.PipelineCachedStorage'

PIPELINE = {
    'PIPELINE_ENABLED': False,
    'EMBED_PATH': r'img/|images/',
    'CSS_COMPRESSOR': 'pipeline.compressors.cssmin.CSSMinCompressor',
    'STYLESHEETS': {
        'spud': {
            'source_filenames': (
                'css/*.css',
            ),
            'output_filename': 'min.css',
            'variant': 'datauri',
        },
    },
    'JS_COMPRESSOR': 'pipeline.compressors.slimit.SlimItCompressor',
    'JAVASCRIPT': {
        'spud': {
            'source_filenames': (
                'js/external/jquery.js',
                'js/external/jquery-ui.js',
                'js/external/showdown.js',
                'js/external/moment-with-locales.js',
                'js/external/moment-timezone-with-data.js',

                'js/jcookie.js',

                'js/globals.js',
                'js/signals.js',

                'js/base.js',
                'js/widgets.js',

                'js/dialog.js',
                'js/infobox.js',
                'js/generic.js',

                'js/session.js',
                'js/album.js',
                'js/category.js',
                'js/person.js',
                'js/place.js',
                'js/feedback.js',
                'js/photo.js',

                'js/state.js',
                'js/urls.js',
                'js/spud.js',
            ),
            'output_filename': 'min.js',
        }
    },
}
