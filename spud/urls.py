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
from __future__ import absolute_import, unicode_literals

import django.views.static
from django.conf import settings
from django.conf.urls import include, url
from django.contrib import admin
from rest_framework import routers

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
    url(r'^admin/', admin.site.urls),

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
]


if settings.DEBUG:
    if settings.IMAGE_PATH is not None:
        urlpatterns += [
            url(r'^images/(?P<path>.*)$', django.views.static.serve,
                {'document_root': settings.IMAGE_PATH}),
        ]
