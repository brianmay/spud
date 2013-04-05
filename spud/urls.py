# spud - keep track of computers and licenses
# Copyright (C) 2008-2009 Brian May
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

from django.conf.urls import url, include, patterns

from django.contrib import admin
admin.autodiscover()

urlpatterns = patterns('',
    url(r'^$', 'spud.views.root', name='root'),

    url(r'^file/(?P<object_id>\d+)/size/(?P<size>\w+)/$', 'spud.views.photo_thumb_redirect', name='photo_thumb_redirect'),

    url(r'^a/login/$', 'spud.ajax.login', name='ajax_login'),
    url(r'^a/logout/$', 'spud.ajax.logout', name='ajax_logout'),
    url(r'^a/photo/(?P<photo_id>\d+)/$', 'spud.ajax.photo', name='ajax_photo'),

    url(r'^a/album/(?P<album_id>\d+)/$', 'spud.ajax.album', name='ajax_album'),
    url(r'^a/album/add/$', 'spud.ajax.album_add', name='ajax_album_add'),
    url(r'^a/album/(?P<album_id>\d+)/delete/$', 'spud.ajax.album_delete', name='ajax_album_delete'),

    url(r'^a/category/(?P<category_id>\d+)/$', 'spud.ajax.category', name='ajax_category'),
    url(r'^a/category/add/$', 'spud.ajax.category_add', name='ajax_category_add'),
    url(r'^a/category/(?P<category_id>\d+)/delete/$', 'spud.ajax.category_delete', name='ajax_category_delete'),

    url(r'^a/place/(?P<place_id>\d+)/$', 'spud.ajax.place', name='ajax_place'),
    url(r'^a/place/add/$', 'spud.ajax.place_add', name='ajax_place_add'),
    url(r'^a/place/(?P<place_id>\d+)/delete/$', 'spud.ajax.place_delete', name='ajax_place_delete'),

    url(r'^a/person/$', 'spud.ajax.person_search', name='ajax_person_search'),
    url(r'^a/person/results/$', 'spud.ajax.person_search_results', name='ajax_person_search_results'),
    url(r'^a/person/(?P<person_id>\d+)/$', 'spud.ajax.person', name='ajax_person'),
    url(r'^a/person/add/$', 'spud.ajax.person_add', name='ajax_person_add'),
    url(r'^a/person/(?P<person_id>\d+)/delete/$', 'spud.ajax.person_delete', name='ajax_person_delete'),

    url(r'^a/relation/(?P<photo_relation_id>\d+)/$', 'spud.ajax.photo_relation', name='ajax_photo_relation'),
    url(r'^a/relation/add/$', 'spud.ajax.photo_relation_add', name='ajax_photo_relation_add'),
    url(r'^a/relation/(?P<photo_relation_id>\d+)/delete/$', 'spud.ajax.photo_relation_delete', name='ajax_photo_relation_delete'),

    url(r'^a/search/$', 'spud.ajax.search', name='ajax_photo_search'),
    url(r'^a/search/results/$', 'spud.ajax.search_results', name='ajax_photo_search_results'),
    url(r'^a/search/change/$', 'spud.ajax.search_change', name='ajax_photo_search_change'),
    url(r'^a/search/(?P<number>\d+)/$', 'spud.ajax.search_item', name='ajax_photo_search_item'),
    url(r'^a/settings/$', 'spud.ajax.settings', name='ajax_settings'),

    url(r'^b/$', 'spud.static.root', name='static_root'),
    url(r'^b/login/$', 'spud.static.login', name='static_login'),
    url(r'^b/logout/$', 'spud.static.logout', name='static_logout'),
    url(r'^b/photo/(?P<photo_id>\d+)/$', 'spud.static.photo_detail', name='static_photo_detail'),
    url(r'^b/album/(?P<album_id>\d+)/$', 'spud.static.album_detail', name='static_album_detail'),
    url(r'^b/category/(?P<category_id>\d+)/$', 'spud.static.category_detail', name='static_category_detail'),
    url(r'^b/place/(?P<place_id>\d+)/$', 'spud.static.place_detail', name='static_place_detail'),
    url(r'^b/person/$', 'spud.static.person_search_results', name='static_person_search_results'),
    url(r'^b/person/(?P<person_id>\d+)/$', 'spud.static.person_detail', name='static_person_detail'),
    url(r'^b/search/$', 'spud.static.search_results', name='static_search_results'),

    url(r'^photo/(?P<object_id>\d+)/size/(?P<size>\w+)/$', 'spud.views.photo_detail', name='photo_detail'),
    url(r'^photo/(?P<object_id>\d+)/orig/$', 'spud.views.photo_orig_redirect', name='photo_orig_redirect'),
    url(r'^photo/(?P<object_id>\d+)/edit/size/(?P<size>\w+)/$', 'spud.views.photo_edit', name='photo_edit'),
    url(r'^photo/(?P<object_id>\d+)/update/$', 'spud.views.photo_update', name='photo_update'),

    (r'^place/$', 'spud.views.place_redirect', {'object_id': 1}),
    url(r'^place/(?P<object_id>\d+)/$', 'spud.views.place_detail', name='place_detail'),
    url(r'^place/(?P<object_id>\d+)/edit/$', 'spud.views.place_edit', name='place_edit'),
    url(r'^place/(?P<object_id>\d+)/add/$', 'spud.views.place_add', name='place_add'),
    url(r'^place/(?P<object_id>\d+)/delete/$', 'spud.views.place_delete', name='place_delete'),
    url(r'^place/(?P<object_id>\d+|none)/detail/(?P<number>\d+|random)/size/(?P<size>\w+)/$', 'spud.views.place_photo_detail', name='place_photo_detail'),
    url(r'^place/(?P<object_id>\d+|none)/edit/(?P<number>\d+|random)/size/(?P<size>\w+)/$', 'spud.views.place_photo_edit', name='place_photo_edit'),
    url(r'^place/(?P<object_id>\d+|none)/update/$', 'spud.views.place_photo_update', name='place_photo_update'),

    (r'^album/$', 'spud.views.album_redirect', {'object_id': 1}),
    url(r'^album/todo/$', 'spud.views.album_todo', name='album_todo'),
    url(r'^album/(?P<object_id>\d+)/$', 'spud.views.album_detail', name='album_detail'),
    url(r'^album/(?P<object_id>\d+)/edit/$', 'spud.views.album_edit', name='album_edit'),
    url(r'^album/(?P<object_id>\d+)/add/$', 'spud.views.album_add', name='album_add'),
    url(r'^album/(?P<object_id>\d+)/delete/$', 'spud.views.album_delete', name='album_delete'),
    url(r'^album/(?P<object_id>\d+|none)/detail/(?P<number>\d+|random)/size/(?P<size>\w+)/$', 'spud.views.album_photo_detail', name='album_photo_detail'),
    url(r'^album/(?P<object_id>\d+|none)/edit/(?P<number>\d+|random)/size/(?P<size>\w+)/$', 'spud.views.album_photo_edit', name='album_photo_edit'),
    url(r'^album/(?P<object_id>\d+|none)/update/$', 'spud.views.album_photo_update', name='album_photo_update'),

    (r'^category/$', 'spud.views.category_redirect', {'object_id': 1}),
    url(r'^category/(?P<object_id>\d+)/$', 'spud.views.category_detail', name='category_detail'),
    url(r'^category/(?P<object_id>\d+)/edit/$', 'spud.views.category_edit', name='category_edit'),
    url(r'^category/(?P<object_id>\d+)/add/$', 'spud.views.category_add', name='category_add'),
    url(r'^category/(?P<object_id>\d+)/delete/$', 'spud.views.category_delete', name='category_delete'),
    url(r'^category/(?P<object_id>\d+|none)/detail/(?P<number>\d+|random)/size/(?P<size>\w+)/$', 'spud.views.category_photo_detail', name='category_photo_detail'),
    url(r'^category/(?P<object_id>\d+|none)/edit/(?P<number>\d+|random)/size/(?P<size>\w+)/$', 'spud.views.category_photo_edit', name='category_photo_edit'),
    url(r'^category/(?P<object_id>\d+|none)/update/$', 'spud.views.category_photo_update', name='category_photo_update'),

    url(r'^person/$', 'spud.views.person_list', name='person_list'),
    url(r'^person/(?P<object_id>\d+)/$', 'spud.views.person_detail', name='person_detail'),
    url(r'^person/(?P<object_id>\d+)/edit/$', 'spud.views.person_edit', name='person_edit'),
    url(r'^person/add/$', 'spud.views.person_add', name='person_add'),
    url(r'^person/(?P<object_id>\d+)/delete/$', 'spud.views.person_delete', name='person_delete'),
    url(r'^person/(?P<object_id>\d+|none)/detail/(?P<number>\d+|random)/size/(?P<size>\w+)/$', 'spud.views.person_photo_detail', name='person_photo_detail'),
    url(r'^person/(?P<object_id>\d+|none)/edit/(?P<number>\d+|random)/size/(?P<size>\w+)/$', 'spud.views.person_photo_edit', name='person_photo_edit'),
    url(r'^person/(?P<object_id>\d+|none)/update/$', 'spud.views.person_photo_update', name='person_photo_update'),

    url(r'^date/$', 'spud.views.date_list', name='date_list'),
    url(r'^date/(?P<object_id>\d\d\d\d-\d\d-\d\d[-+]\d\d\d\d|all)/$', 'spud.views.date_detail', name='date_detail'),
    url(r'^date/(?P<object_id>\d\d\d\d-\d\d-\d\d[-+]\d\d\d\d|all)/detail/(?P<number>\d+|random)/size/(?P<size>\w+)/$', 'spud.views.date_photo_detail', name='date_photo_detail'),
    url(r'^date/(?P<object_id>\d\d\d\d-\d\d-\d\d[-+]\d\d\d\d|all)/edit/(?P<number>\d+|random)/size/(?P<size>\w+)/$', 'spud.views.date_photo_edit', name='date_photo_edit'),
    url(r'^date/(?P<object_id>\d\d\d\d-\d\d-\d\d[-+]\d\d\d\d|all)/update/$', 'spud.views.date_photo_update', name='date_photo_update'),

    url(r'^action/$', 'spud.views.action_list', name='action_list'),
    url(r'^action/(?P<object_id>[A-Za-z0-9]+)/$', 'spud.views.action_detail', name='action_detail'),
    url(r'^action/(?P<object_id>[A-Za-z0-9]+)/detail/(?P<number>\d+|random)/size/(?P<size>\w+)/$', 'spud.views.action_photo_detail', name='action_photo_detail'),
    url(r'^action/(?P<object_id>[A-Za-z0-9]+)/edit/(?P<number>\d+|random)/size/(?P<size>\w+)/$', 'spud.views.action_photo_edit', name='action_photo_edit'),
    url(r'^action/(?P<object_id>[A-Za-z0-9]+)/update/$', 'spud.views.action_photo_update', name='action_photo_update'),

    url(r'^search/$', 'spud.views.search_list', name='search_list'),
    url(r'^search/(?P<object_id>[A-Za-z0-9=,:;!_ \'\.-]*)/$', 'spud.views.search_detail', name='search_detail'),
    url(r'^search/(?P<object_id>[A-Za-z0-9=,:;!_ \'\.-]*)/detail/(?P<number>\d+|random)/size/(?P<size>\w+)/$', 'spud.views.search_photo_detail', name='search_photo_detail'),
    url(r'^search/(?P<object_id>[A-Za-z0-9=,:;!_ \'\.-]*)/edit/(?P<number>\d+|random)/size/(?P<size>\w+)/$', 'spud.views.search_photo_edit', name='search_photo_edit'),
    url(r'^search/(?P<object_id>[A-Za-z0-9=,:;!_ \'\.-]*)/update/$', 'spud.views.search_photo_update', name='search_photo_update'),

    url(r'^relation/$', 'spud.views.photo_relation_list', name='photo_relation_list'),
    url(r'^relation/add/$', 'spud.views.photo_relation_add', name='photo_relation_add'),
    url(r'^relation/add/(?P<object_id>\d+)/$', 'spud.views.photo_relation_add', name='photo_relation_add'),
    url(r'^relation/(?P<object_id>\d+)/edit/$', 'spud.views.photo_relation_edit', name='photo_relation_edit'),
    url(r'^relation/(?P<object_id>\d+)/delete/$', 'spud.views.photo_relation_delete', name='photo_relation_delete'),

    (r'^comments/', include('django.contrib.comments.urls')),

    url(r'^ajax/', include('ajax_select.urls')),

    url(r'^settings/', 'spud.views.settings_form', name='settings_form'),

    # legacy
    (r'^all/(?P<object_id>\d+).html$', 'spud.views.legacy_detail',  {'type': 'photo'}),
    (r'^all/(?P<size>\w+)/(?P<object_id>\d+).jpg$', 'spud.views.photo_thumb_redirect'),
    (r'^places/$', 'spud.views.legacy_list', {'type': 'place'}),
    (r'^places/(?P<object_id>\d+).html$', 'spud.views.legacy_detail',  {'type': 'place'}),
    (r'^albums/$', 'spud.views.legacy_list', {'type': 'album'}),
    (r'^albums/(?P<object_id>\d+).html$', 'spud.views.legacy_detail',  {'type': 'album'}),
    (r'^categories/$', 'spud.views.legacy_list', {'type': 'category'}),
    (r'^categories/(?P<object_id>\d+).html$', 'spud.views.legacy_detail',  {'type': 'category'}),
    (r'^people/$', 'spud.views.legacy_list', {'type': 'person'}),
    (r'^people/(?P<object_id>\d+).html$', 'spud.views.legacy_detail',  {'type': 'person'}),

    # account management
    url(r'^admin/', include(admin.site.urls)),
    url(r'^account/login/$', 'django.contrib.auth.views.login', name='login'),
    url(r'^account/logout/$', 'django.contrib.auth.views.logout', name='logout'),
    url(r'^account/password_change/$', 'django.contrib.auth.views.password_change', name='password_change'),
    url(r'^account/password_change/done/$', 'django.contrib.auth.views.password_change_done', name='password_change_done'),
)
