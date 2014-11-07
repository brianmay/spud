# Django settings for photos project.

# DEBUG = True
# TEMPLATE_DEBUG = DEBUG

ADMINS = (
    # ('Name', 'email@example.org'),
)

MANAGERS = ADMINS

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.dummy',
        'NAME': '',
        'USER': '',
        'PASSWORD': '',
        'HOST': '',
        'PORT': '',
        'ATOMIC_REQUESTS': True,
    }
}

# Local time zone for this installation. Choices can be found here:
# http://en.wikipedia.org/wiki/List_of_tz_zones_by_name
# although not all choices may be available on all operating systems.
# If running in a Windows environment this must be set to the same as your
# system time zone.
TIME_ZONE = 'Australia/Victoria'

# Language code for this installation. All choices can be found here:
# http://www.i18nguy.com/unicode/language-identifiers.html
LANGUAGE_CODE = 'en-AU'

# Make this unique, and don't share it with anybody.
SECRET_KEY = ''

EMAIL_HOST = "mail.example.org"
DEFAULT_FROM_EMAIL = "Name <email@example.org>"

IMAGE_URL = "http://website.example.org/images/"
