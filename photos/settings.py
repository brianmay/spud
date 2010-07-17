SITE_ID = 1

# If you set this to False, Django will make some optimizations so as not
# to load the internationalization machinery.
USE_I18N = True

# Absolute path to the directory that holds media.
# Example: "/home/media/media.lawrence.com/"
MEDIA_ROOT = "/usr/share/spud/media"

# URL that handles the media served from MEDIA_ROOT. Make sure to use a
# trailing slash if there is a path component (optional in other cases).
# Examples: "http://media.lawrence.com", "http://example.com/media/"
MEDIA_URL = '/photo_media/'

# URL prefix for admin media -- CSS, JavaScript and images. Make sure to use a
# trailing slash.
# Examples: "http://foo.com/media/", "/media/".
ADMIN_MEDIA_PREFIX = '/media/'

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
    "/etc/spud/templates",
)

INSTALLED_APPS = (
    'spud',
    'spud.comments',
    'photos',
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

execfile("/etc/spud/settings.py")
