from django.conf.urls.defaults import *
from django.conf import settings

# Uncomment the next two lines to enable the admin:
from django.contrib import admin
admin.autodiscover()

urlpatterns = patterns('',
    (r'^', include('spud.urls')),
    (r'^admin/(.*)', admin.site.root),

    url(r'^account/login/$', 'django.contrib.auth.views.login', name='login'),
    url(r'^account/logout/$', 'django.contrib.auth.views.logout', name='logout'),
    url(r'^account/password_change/$', 'django.contrib.auth.views.password_change', name='password_change'),
    url(r'^account/password_change/done/$', 'django.contrib.auth.views.password_change_done', name='password_change_done'),
)

if settings.DEBUG:
    urlpatterns += patterns('',
        (r'^media/(?P<path>.*)$', 'django.views.static.serve', {'document_root': settings.MEDIA_ROOT}),
    )
