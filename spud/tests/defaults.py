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


class InvalidString(str):
    def __mod__(self, other):
        from django.template.base import TemplateSyntaxError
        raise TemplateSyntaxError(
            "Undefined variable or unknown value for: \"%s\"" % other)

TEMPLATE_STRING_IF_INVALID = InvalidString("%s")

DEBUG = True
TEMPLATE_DEBUG = DEBUG
SESSION_COOKIE_SECURE = False

LOGGING = {
    'version': 1,
    'disable_existing_loggers': True,
    'formatters': {
        'verbose': {
            'format': '%(levelname)s %(asctime)s '
            '%(module)s %(process)d %(thread)d %(message)s'
        },
        'simple': {
            'format': '%(levelname)s %(message)s'
        },
    },
    'handlers': {
        'null': {
            'level': 'DEBUG',
            'class': 'logging.NullHandler',
        },
        'console': {
            'level': 'DEBUG',
            'class': 'logging.StreamHandler',
            'formatter': 'verbose'
        },
    },
    'loggers': {
        '': {
            'handlers': ['console'],
            'level': 'WARNING',
        },
        'py.warnings': {
            # spud test will automatically add a handler here
            # if verbosity is >= 0.
            'handlers': ["null"],
            'propagate': False,
        },
    },
}

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': 'spud.db',
        'USER': '',
        'PASSWORD': '',
        'HOST': '',
        'PORT': '',
        'ATOMIC_REQUESTS': True,
    }
}
import os
SERVER_EMAIL = 'django@' + os.uname()[1]
ACCOUNTS_EMAIL = 'accounts@vpac.org'
APPROVE_ACCOUNTS_EMAIL = ACCOUNTS_EMAIL
EMAIL_SUBJECT_PREFIX = '[Grunt VPAC] - '
EMAIL_BACKEND = 'django.core.mail.backends.console.EmailBackend'

TIME_ZONE = 'Australia/Melbourne'
LANGUAGE_CODE = 'en-au'

SECRET_KEY = '5hvhpe6gv2t5x4$3dtq(w2v#vg@)sx4p3r_@wv%l41g!stslc*'

STATIC_ROOT = 'tmp/static'
STATIC_URL = "/static/"

import os.path
TEST_MODULE_ROOT = os.path.dirname(os.path.realpath(__file__))
FIXTURE_DIRS = (os.path.join(TEST_MODULE_ROOT),)

ENABLE_CRACKLIB = False
