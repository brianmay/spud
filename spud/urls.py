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

import re
from rest_framework import routers

from django.conf.urls import url, include
from django.conf import settings
from django.contrib import admin
import django.views.static

from . import views

admin.autodiscover()

router = routers.DefaultRouter()
router.register(r'users', views.UserViewSet)
router.register(r'groups', views.GroupViewSet)
router.register(r'places', views.PlaceViewSet)
router.register(r'albums', views.AlbumViewSet)
router.register(r'categorys', views.CategoryViewSet)
router.register(r'persons', views.PersonViewSet)
router.register(r'feedbacks', views.FeedbackViewSet)
router.register(r'relations', views.PhotoRelationViewSet)
router.register(r'photos', views.PhotoViewSet)

urlpatterns = [

    # account management
    url(r'^$',
        views.root, name='root'),

]

if getattr(settings, 'API_ROOT_URL', None) is None:
    urlpatterns += [

        url(r'^admin/', include(admin.site.urls)),

        url(r'^api/session/$', views.SessionDetail.as_view(),
            name="session-detail"),

        url(r'^api/session/login/$', views.Login.as_view(),
            name="session-login"),

        url(r'^api/session/logout/$', views.Logout.as_view(),
            name="session-logout"),

        url(r'^api/', include(router.urls)),
        url(r'^api-auth/', include('rest_framework.urls',
            namespace='rest_framework')),
    ]


urlpatterns += [

    url(r'^file/(?P<object_id>\d+)/size/(?P<size>\w+)/$',
        views.photo_thumb_redirect, name='photo_thumb_redirect'),

    url(r'^(?P<obj_type>\w+)/$',
        views.obj_list, name='obj_list'),

    url(r'^(?P<obj_type>\w+)/(?P<obj_id>\d+)/$',
        views.obj_detail, name='obj_detail'),
]


if settings.DEBUG:

    if settings.IMAGE_PATH is not None:
        urlpatterns += [
            url(r'^images/(?P<path>.*)$', django.views.static.serve,
                {'document_root': settings.IMAGE_PATH}),
        ]
    if settings.DEBUG:
        urlpatterns += [
            url(r'^errors.html$', django.views.static.serve,
                {'document_root': ".", 'path': "errors.html"}),
        ]

elif settings.DEBUG_SERVE_STATIC:

    urlpatterns += [
        url(r'^%s(?P<path>.*)$' % re.escape(settings.STATIC_URL.lstrip('/')),
            django.views.static.serve,
            {'document_root': settings.STATIC_ROOT}),
    ]

    if settings.IMAGE_PATH is not None:
        urlpatterns += [
            url(r'^images/(?P<path>.*)$', django.views.static.serve,
                {'document_root': settings.IMAGE_PATH}),
        ]
