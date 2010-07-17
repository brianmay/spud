from os import path as os_path

# Django settings for photos project.

DEBUG = True
TEMPLATE_DEBUG = DEBUG

PROJECT_DIR = os_path.abspath(os_path.split(__file__)[0])

ADMINS = (
    ('Brian May', 'brian@microcomaustralia.com.au'),
)

MANAGERS = ADMINS

DATABASE_ENGINE = 'mysql'           # 'postgresql_psycopg2', 'postgresql', 'mysql', 'sqlite3' or 'oracle'.
DATABASE_NAME = 'zoph'             # Or path to database file if using sqlite3.
DATABASE_USER = 'zoph_brian'             # Not used with sqlite3.
DATABASE_PASSWORD = 'FN2Ca66asWwRSpGE'         # Not used with sqlite3.
DATABASE_HOST = 'db.microcomaustralia.com.au'             # Set to empty string for localhost. Not used with sqlite3.
DATABASE_PORT = ''             # Set to empty string for default. Not used with sqlite3.

# Local time zone for this installation. Choices can be found here:
# http://en.wikipedia.org/wiki/List_of_tz_zones_by_name
# although not all choices may be available on all operating systems.
# If running in a Windows environment this must be set to the same as your
# system time zone.
TIME_ZONE = 'Australia/Victoria'

# Language code for this installation. All choices can be found here:
# http://www.i18nguy.com/unicode/language-identifiers.html
LANGUAGE_CODE = 'en-AU'

SITE_ID = 1

# If you set this to False, Django will make some optimizations so as not
# to load the internationalization machinery.
USE_I18N = True

# Absolute path to the directory that holds media.
# Example: "/home/media/media.lawrence.com/"
MEDIA_ROOT = os_path.join(PROJECT_DIR, 'media')

# URL that handles the media served from MEDIA_ROOT. Make sure to use a
# trailing slash if there is a path component (optional in other cases).
# Examples: "http://media.lawrence.com", "http://example.com/media/"
MEDIA_URL = '/photo_media/'

# URL prefix for admin media -- CSS, JavaScript and images. Make sure to use a
# trailing slash.
# Examples: "http://foo.com/media/", "/media/".
ADMIN_MEDIA_PREFIX = '/media/'

# Make this unique, and don't share it with anybody.
SECRET_KEY = 'iheor07%*i6&9fyg$s8i5$-*=a(!lk#5995g+*ie1(^4mtil6t'

# List of callables that know how to import templates from various sources.
TEMPLATE_LOADERS = (
    'django.template.loaders.filesystem.load_template_source',
    'django.template.loaders.app_directories.load_template_source',
#     'django.template.loaders.eggs.load_template_source',
)

MIDDLEWARE_CLASSES = (
    'django.middleware.common.CommonMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
)

ROOT_URLCONF = 'photos.urls'

TEMPLATE_DIRS = (
    # Put strings here, like "/home/html/django_templates" or "C:/www/django/templates".
    # Always use forward slashes, even on Windows.
    # Don't forget to use absolute paths, not relative paths.
    os_path.join(PROJECT_DIR, 'templates'),
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
    'ajax_select',
    'south',
)

AJAX_LOOKUP_CHANNELS = {
    'person' : ('spud.lookup', 'person_lookup'),
    'place' : ('spud.lookup', 'place_lookup'),
    'album' : ('spud.lookup', 'album_lookup'),
    'category' : ('spud.lookup', 'category_lookup'),
    'photo' : ('spud.lookup', 'photo_lookup'),
}

COMMENTS_APP = "spud.comments"

EMAIL_HOST="mail.microcomaustralia.com.au"
DEFAULT_FROM_EMAIL = "Brian May <brian@microcomaustralia.com.au>"
LOGIN_REDIRECT_URL = "/"

IMAGE_URL="http://staff.microcomaustralia.com.au/images/"
IMAGE_PATH="/home/brian/zoph/"
IMAGE_CHECK_EXISTS=False

IMAGE_SIZES = {
    'mid': 480,
    'thumb': 120,
    'large': 960,
}
