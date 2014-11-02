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

from django.conf.urls import url, include, patterns
from django.conf import settings

from django.contrib import admin
admin.autodiscover()

urlpatterns = patterns(
    '',
    url(r'^file/(?P<object_id>\d+)/size/(?P<size>\w+)/$',
        'spud.views.photo_thumb_redirect', name='photo_thumb_redirect'),

    url(r'^a/login/$', 'spud.ajax.login', name='ajax_login'),
    url(r'^a/logout/$', 'spud.ajax.logout', name='ajax_logout'),

    url(r'^a/album/form/$',
        'spud.ajax.album_search_form', name='ajax_album_search_form'),
    url(r'^a/album/results/$',
        'spud.ajax.album_search_results', name='ajax_album_search_results'),
    url(r'^a/album/(?P<album_id>\d+)/$',
        'spud.ajax.album', name='ajax_album'),
    url(r'^a/album/add/$',
        'spud.ajax.album_add', name='ajax_album_add'),
    url(r'^a/album/(?P<album_id>\d+)/delete/$',
        'spud.ajax.album_delete', name='ajax_album_delete'),

    url(r'^a/category/form/$',
        'spud.ajax.category_search_form', name='ajax_category_search_form'),
    url(r'^a/category/results/$',
        'spud.ajax.category_search_results',
        name='ajax_category_search_results'),
    url(r'^a/category/(?P<category_id>\d+)/$',
        'spud.ajax.category', name='ajax_category'),
    url(r'^a/category/add/$',
        'spud.ajax.category_add', name='ajax_category_add'),
    url(r'^a/category/(?P<category_id>\d+)/delete/$',
        'spud.ajax.category_delete', name='ajax_category_delete'),

    url(r'^a/place/form/$',
        'spud.ajax.place_search_form', name='ajax_place_search_form'),
    url(r'^a/place/results/$',
        'spud.ajax.place_search_results', name='ajax_place_search_results'),
    url(r'^a/place/(?P<place_id>\d+)/$',
        'spud.ajax.place', name='ajax_place'),
    url(r'^a/place/add/$',
        'spud.ajax.place_add', name='ajax_place_add'),
    url(r'^a/place/(?P<place_id>\d+)/delete/$',
        'spud.ajax.place_delete', name='ajax_place_delete'),

    url(r'^a/person/form/$',
        'spud.ajax.person_search_form', name='ajax_person_search_form'),
    url(r'^a/person/results/$',
        'spud.ajax.person_search_results', name='ajax_person_search_results'),
    url(r'^a/person/(?P<person_id>\d+)/$',
        'spud.ajax.person', name='ajax_person'),
    url(r'^a/person/add/$',
        'spud.ajax.person_add', name='ajax_person_add'),
    url(r'^a/person/(?P<person_id>\d+)/delete/$',
        'spud.ajax.person_delete', name='ajax_person_delete'),

    url(r'^a/relation/(?P<photo_relation_id>\d+)/$',
        'spud.ajax.photo_relation', name='ajax_photo_relation'),
    url(r'^a/relation/add/$',
        'spud.ajax.photo_relation_add', name='ajax_photo_relation_add'),
    url(r'^a/relation/(?P<photo_relation_id>\d+)/delete/$',
        'spud.ajax.photo_relation_delete', name='ajax_photo_relation_delete'),

    url(r'^a/feedback/form/$',
        'spud.ajax.feedback_search_form', name='ajax_feedback_search_form'),
    url(r'^a/feedback/results/$',
        'spud.ajax.feedback_search_results',
        name='ajax_feedback_search_results'),
    url(r'^a/feedback/(?P<feedback_id>\d+)/$',
        'spud.ajax.feedback', name='ajax_feedback'),
    url(r'^a/feedback/add/$',
        'spud.ajax.feedback_add', name='ajax_feedback_add'),
    url(r'^a/feedback/(?P<feedback_id>\d+)/delete/$',
        'spud.ajax.feedback_delete', name='ajax_feedback_delete'),

    url(r'^a/photo/form/$',
        'spud.ajax.photo_search_form', name='ajax_photo_search_form'),
    url(r'^a/photo/results/$',
        'spud.ajax.photo_search_results', name='ajax_photo_search_results'),
    url(r'^a/photo/change/$',
        'spud.ajax.photo_search_change', name='ajax_photo_search_change'),
    url(r'^a/photo/(?P<photo_id>\d+)/$',
        'spud.ajax.photo', name='ajax_photo'),

    url(r'^a/upload/form/$', 'spud.ajax.upload_form', name='ajax_upload_form'),
    url(r'^a/upload/file/$', 'spud.ajax.upload_file', name='ajax_upload_file'),

    url(r'^$',
        'spud.views.root', name='root'),
    url(r'^login/$',
        'spud.views.login', name='login'),
    url(r'^logout/$',
        'spud.views.logout', name='logout'),
    url(r'^album/$',
        'spud.views.album_search_results', name='album_search_results'),
    url(r'^album/(?P<album_id>\d+)/$',
        'spud.views.album_detail', name='album_detail'),
    url(r'^category/$',
        'spud.views.category_search_results', name='category_search_results'),
    url(r'^category/(?P<category_id>\d+)/$',
        'spud.views.category_detail', name='category_detail'),
    url(r'^place/$',
        'spud.views.place_search_results', name='place_search_results'),
    url(r'^place/(?P<place_id>\d+)/$',
        'spud.views.place_detail', name='place_detail'),
    url(r'^person/$',
        'spud.views.person_search_results', name='person_search_results'),
    url(r'^person/(?P<person_id>\d+)/$',
        'spud.views.person_detail', name='person_detail'),
    url(r'^feedback/$',
        'spud.views.feedback_search_results', name='feedback_search_results'),
    url(r'^feedback/(?P<feedback_id>\d+)/$',
        'spud.views.feedback_detail', name='feedback_detail'),
    url(r'^photo/$',
        'spud.views.photo_search_results', name='photo_search_results'),
    url(r'^photo/(?P<photo_id>\d+)/$',
        'spud.views.photo_detail', name='photo_detail'),
    url(r'^upload/$',
        'spud.views.upload', name='upload'),

    url(r'^ajax/', include('ajax_select.urls')),

    # account management
    url(r'^admin/', include(admin.site.urls)),
    url(r'^account/login/$',
        'django.contrib.auth.views.login', name='login'),
    url(r'^account/logout/$',
        'django.contrib.auth.views.logout', name='logout'),
    url(r'^account/password_change/$',
        'django.contrib.auth.views.password_change', name='password_change'),
    url(r'^account/password_change/done/$',
        'django.contrib.auth.views.password_change_done',
        name='password_change_done'),

    # backward compatability
    url(r'^photo/(?P<object_id>\d+)/size/(?P<size>\w+)/$',
        'spud.views.old_photo_detail', name='old_photo_detail'),
)

if settings.DEBUG and settings.IMAGE_PATH is not None:
    urlpatterns += patterns(
        '',
        url(r'^images/(?P<path>.*)$', 'django.views.static.serve',
            {'document_root': settings.IMAGE_PATH}),
    )
