# -*- coding: utf-8 -*-
# spud - keep track of photos
# Copyright (C) 2008-2016 Brian May
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

###
# DJANGO SETTINGS
###

# A boolean that turns on/off debug mode.
#
# Never deploy a site into production with DEBUG turned on.
#
# Did you catch that? NEVER deploy a site into production with DEBUG turned on.
#
# One of the main features of debug mode is the display of detailed error
# pages.  If your app raises an exception when DEBUG is True, Django will
# display a detailed traceback, including a lot of metadata about your
# environment, such as all the currently defined Django settings (from
# settings.py).
DEBUG = False

# For debugging purposes, ensure that static files are served when DEBUG=False,
# used for testing django-pipeline. Should never be set to True on production
# box or for normal debugging.
DEBUG_SERVE_STATIC = False

# A list containing the settings for all template engines to be used with
# Django. Each item of the list is a dictionary containing the options for an
# individual engine.
TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [
            "/etc/spud/templates",
        ],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'spud.context_processors.common',
                'django.contrib.auth.context_processors.auth',
                'django.template.context_processors.request',
                'django.template.context_processors.debug',
                'django.template.context_processors.i18n',
                'django.template.context_processors.media',
                'django.template.context_processors.static',
                'django.template.context_processors.tz',
                'django.contrib.messages.context_processors.messages',
            ],
            'debug': True,
            # 'string_if_invalid': InvalidString("%s"),
        },
    },
]


# Whether to use a secure cookie for the session cookie. If this is set to
# True, the cookie will be marked as “secure,” which means browsers may ensure
# that the cookie is only sent under an HTTPS connection.
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

# A tuple of middleware classes to use.
MIDDLEWARE_CLASSES = (
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
)

# A string representing the full Python import path to your root URLconf. For
# example: "mydjangoapps.urls". Can be overridden on a per-request basis by
# setting the attribute urlconf on the incoming HttpRequest object.
ROOT_URLCONF = 'spud.urls'

# A list of strings designating all applications that are enabled in this
# Django installation.
INSTALLED_APPS = (
    'spud',
    'pipeline',
    'rest_framework',
    'rest_framework.authtoken',
    'corsheaders',
    'django.contrib.auth',
    'django.contrib.admin',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.staticfiles',
)

# South not available for Python 3+ or Django 1.7+
if sys.version_info < (3, 0) and django.VERSION < (1, 7):
    INSTALLED_APPS += ('south',)

# The URL where requests are redirected for login, especially when
# using the login_required() decorator.
LOGIN_URL = "/spud/account/login/"

# The name of the class to use for starting the test suite.
TEST_RUNNER = 'django.test.runner.DiscoverRunner'

# A boolean that specifies if datetimes will be timezone-aware by default or
# not. If this is set to True, Django will use timezone-aware datetimes
# internally. Otherwise, Django will use naive datetimes in local time.
# USE_TZ = True

# A string representing the time zone for datetimes stored in this database
# (assuming that it doesn’t support time zones) or None. The same values are
# accepted as in the general TIME_ZONE setting.
#
# This allows interacting with third-party databases that store datetimes in
# local time rather than UTC. To avoid issues around DST changes, you shouldn’t
# set this option for databases managed by Django.
#
# Setting this option requires installing pytz.
#
# When USE_TZ is True and the database doesn’t support time zones (e.g. SQLite,
# MySQL, Oracle), Django reads and writes datetimes in local time according to
# this option if it is set and in UTC if it isn’t.
#
# When USE_TZ is True and the database supports time zones (e.g. PostgreSQL),
# it is an error to set this option.
TIME_ZONE = 'UTC'

# A list of strings representing the host/domain names that this Django site
# can serve. This is a security measure to prevent HTTP Host header attacks,
# which are possible even under many seemingly-safe web server configurations.
#
# Values in this list can be fully qualified names (e.g. 'www.example.com'), in
# which case they will be matched against the request’s Host header exactly
# (case-insensitive, not including port). A value beginning with a period can
# be used as a subdomain wildcard: '.example.com' will match example.com,
# www.example.com, and any other subdomain of example.com. A value of '*' will
# match anything; in this case you are responsible to provide your own
# validation of the Host header (perhaps in a middleware; if so this middleware
# must be listed first in MIDDLEWARE_CLASSES).
#
# Django also allows the fully qualified domain name (FQDN) of any entries.
# Some browsers include a trailing dot in the Host header which Django strips
# when performing host validation.
#
# If the Host header (or X-Forwarded-Host if USE_X_FORWARDED_HOST is enabled)
# does not match any value in this list, the django.http.HttpRequest.get_host()
# method will raise SuspiciousOperation.
#
# When DEBUG is True or when running tests, host validation is disabled; any
# host will be accepted. Thus it’s usually only necessary to set it in
# production.
#
# This validation only applies via get_host(); if your code accesses the Host
# header directly from request.META you are bypassing this security protection.
ALLOWED_HOSTS = [getfqdn()]


###
# DJANGO REST FRAMEWORK
###

REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'rest_framework.authentication.SessionAuthentication',
        'rest_framework.authentication.TokenAuthentication',
    ),
    'DEFAULT_PERMISSION_CLASSES': (
        'rest_framework.permissions.DjangoModelPermissionsOrAnonReadOnly',
    ),
    'DEFAULT_PAGINATION_CLASS':
        'rest_framework.pagination.PageNumberPagination',
    'PAGE_SIZE': 10,
}


###
# DJANGO PIPELINE
###
STATICFILES_STORAGE = 'pipeline.storage.PipelineCachedStorage'

PIPELINE = {
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


###
# SPUD SETTINGS
###
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
