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

SITE_ID = 1
SESSION_COOKIE_SECURE = True

# If you set this to False, Django will make some optimizations so as not
# to load the internationalization machinery.
USE_I18N = True

# Absolute path to the directory that holds media.
# Example: "/home/media/media.lawrence.com/"
STATIC_ROOT = "/usr/share/spud/media"

# URL that handles the media served from MEDIA_ROOT. Make sure to use a
# trailing slash if there is a path component (optional in other cases).
# Examples: "http://media.lawrence.com", "http://example.com/media/"
STATIC_URL = '/spud/media/'

# List of callables that know how to import templates from various sources.
TEMPLATE_LOADERS = (
    'django.template.loaders.filesystem.Loader',
    'django.template.loaders.app_directories.Loader',
)

TEMPLATE_CONTEXT_PROCESSORS = (
    "django.contrib.auth.context_processors.auth",
    "django.core.context_processors.debug",
    "django.core.context_processors.i18n",
    "django.core.context_processors.media",
    "django.core.context_processors.request",
    "django.core.context_processors.static",
)

MIDDLEWARE_CLASSES = (
    'django.middleware.common.CommonMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.middleware.transaction.TransactionMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
)

ROOT_URLCONF = 'spud.urls'

TEMPLATE_DIRS = (
    # Put strings here, like "/home/html/django_templates" or "C:/www/django/templates".
    # Always use forward slashes, even on Windows.
    # Don't forget to use absolute paths, not relative paths.
    "/etc/spud/templates",
)

INSTALLED_APPS = (
    'spud',
    'spud.comments',
    'django.contrib.auth',
    'django.contrib.admin',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.sites',
    'django.contrib.comments',
    'django.contrib.staticfiles',
    'ajax_select',
    'south',
)

LOGIN_URL = "/spud/account/login/"
LOGIN_REDIRECT_URL = "/spud/"
LOGOUT_URL = "/spud/account/login/"

AJAX_LOOKUP_CHANNELS = {
    'person' : ('spud.lookup', 'person_lookup'),
    'place' : ('spud.lookup', 'place_lookup'),
    'album' : ('spud.lookup', 'album_lookup'),
    'category' : ('spud.lookup', 'category_lookup'),
    'feedback' : ('spud.lookup', 'feedback_lookup'),
    'photo' : ('spud.lookup', 'photo_lookup'),
}
AJAX_SELECT_BOOTSTRAP = False
AJAX_SELECT_INLINES = None

COMMENTS_APP = "spud.comments"

IMAGE_CHECK_EXISTS=True
IMAGE_SIZES = {
    'thumb': 120,
    'mid': 480,
    'large': 960,
}

LIST_SIZES = (
    ('thumb', 'Thumb'),
)
DEFAULT_LIST_SIZE='thumb'

VIEW_SIZES = (
    ('thumb', 'Thumb'),
    ('mid', 'Medium'),
    ('large', 'Large'),
)
DEFAULT_VIEW_SIZE='mid'

CLICK_SIZES = (
    ('thumb', 'Thumb'),
    ('mid', 'Medium'),
    ('large', 'Large'),
)
DEFAULT_CLICK_SIZE='large'

DEFAULT_TIMEZONE = {}
DEFAULT_DTOFFSET = {}

DEFAULT_CONTENT_TYPE = "application/xhtml+xml"

# required for django versions earlier then 1.5
AUTH_USER_MODEL = 'auth.User'
execfile("/etc/spud/settings.py")
