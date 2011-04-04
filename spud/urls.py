import django.views
from django.conf.urls.defaults import *
from spud import models
from spud import views

urlpatterns = patterns('',
    url(r'^$', 'spud.views.root', name='root'),

    url(r'^file/(?P<object_id>\d+)/size/(?P<size>\w+)/$', 'spud.views.photo_thumb_redirect', name='photo_thumb_redirect'),

    url(r'^photo/(?P<object_id>\d+)/size/(?P<size>\w+)/$', 'spud.views.photo_detail', name='photo_detail'),
    url(r'^photo/(?P<object_id>\d+)/orig/$', 'spud.views.photo_orig_redirect', name='photo_orig_redirect'),
    url(r'^photo/(?P<object_id>\d+)/edit/size/(?P<size>\w+)/$', 'spud.views.photo_edit', name='photo_edit'),

    (r'^place/$', 'spud.views.place_redirect', {'object_id': 1}),
    url(r'^place/(?P<object_id>\d+)/$', 'spud.views.place_detail', name='place_detail'),
    url(r'^place/(?P<object_id>\d+)/edit/$', 'spud.views.place_edit', name='place_edit'),
    url(r'^place/(?P<object_id>\d+)/add/$', 'spud.views.place_add', name='place_add'),
    url(r'^place/(?P<object_id>\d+)/delete/$', 'spud.views.place_delete', name='place_delete'),
    url(r'^place/(?P<object_id>\d+|none)/detail/(?P<number>\d+|random)/size/(?P<size>\w+)/$', 'spud.views.place_photo_detail', name='place_photo_detail'),
    url(r'^place/(?P<object_id>\d+|none)/edit/(?P<number>\d+|random)/size/(?P<size>\w+)/$', 'spud.views.place_photo_edit', name='place_photo_edit'),

    (r'^album/$', 'spud.views.album_redirect', {'object_id': 1}),
    url(r'^album/todo/$', 'spud.views.album_todo', name='album_todo'),
    url(r'^album/(?P<object_id>\d+)/$', 'spud.views.album_detail', name='album_detail'),
    url(r'^album/(?P<object_id>\d+)/edit/$', 'spud.views.album_edit', name='album_edit'),
    url(r'^album/(?P<object_id>\d+)/add/$', 'spud.views.album_add', name='album_add'),
    url(r'^album/(?P<object_id>\d+)/delete/$', 'spud.views.album_delete', name='album_delete'),
    url(r'^album/(?P<object_id>\d+|none)/detail/(?P<number>\d+|random)/size/(?P<size>\w+)/$', 'spud.views.album_photo_detail', name='album_photo_detail'),
    url(r'^album/(?P<object_id>\d+|none)/edit/(?P<number>\d+|random)/size/(?P<size>\w+)/$', 'spud.views.album_photo_edit', name='album_photo_edit'),

    (r'^category/$', 'spud.views.category_redirect', {'object_id': 1}),
    url(r'^category/(?P<object_id>\d+)/$', 'spud.views.category_detail', name='category_detail'),
    url(r'^category/(?P<object_id>\d+)/edit/$', 'spud.views.category_edit', name='category_edit'),
    url(r'^category/(?P<object_id>\d+)/add/$', 'spud.views.category_add', name='category_add'),
    url(r'^category/(?P<object_id>\d+)/delete/$', 'spud.views.category_delete', name='category_delete'),
    url(r'^category/(?P<object_id>\d+|none)/detail/(?P<number>\d+|random)/size/(?P<size>\w+)/$', 'spud.views.category_photo_detail', name='category_photo_detail'),
    url(r'^category/(?P<object_id>\d+|none)/edit/(?P<number>\d+|random)/size/(?P<size>\w+)/$', 'spud.views.category_photo_edit', name='category_photo_edit'),

    url(r'^person/$', 'spud.views.person_list', name='person_list'),
    url(r'^person/(?P<object_id>\d+)/$', 'spud.views.person_detail', name='person_detail'),
    url(r'^person/(?P<object_id>\d+)/edit/$', 'spud.views.person_edit', name='person_edit'),
    url(r'^person/add/$', 'spud.views.person_add', name='person_add'),
    url(r'^person/(?P<object_id>\d+)/delete/$', 'spud.views.person_delete', name='person_delete'),
    url(r'^person/(?P<object_id>\d+|none)/detail/(?P<number>\d+|random)/size/(?P<size>\w+)/$', 'spud.views.person_photo_detail', name='person_photo_detail'),
    url(r'^person/(?P<object_id>\d+|none)/edit/(?P<number>\d+|random)/size/(?P<size>\w+)/$', 'spud.views.person_photo_edit', name='person_photo_edit'),

    url(r'^date/$', 'spud.views.date_list', name='date_list'),
    url(r'^date/(?P<object_id>\d\d\d\d-\d\d-\d\d|all)/$', 'spud.views.date_detail', name='date_detail'),
    url(r'^date/(?P<object_id>\d\d\d\d-\d\d-\d\d|all)/detail/(?P<number>\d+|random)/size/(?P<size>\w+)/$', 'spud.views.date_photo_detail', name='date_photo_detail'),
    url(r'^date/(?P<object_id>\d\d\d\d-\d\d-\d\d|all)/edit/(?P<number>\d+|random)/size/(?P<size>\w+)/$', 'spud.views.date_photo_edit', name='date_photo_edit'),

    url(r'^action/$', 'spud.views.action_list', name='action_list'),
    url(r'^action/(?P<object_id>[A-Za-z0-9]+)/$', 'spud.views.action_detail', name='action_detail'),
    url(r'^action/(?P<object_id>[A-Za-z0-9]+)/detail/(?P<number>\d+|random)/size/(?P<size>\w+)/$', 'spud.views.action_photo_detail', name='action_photo_detail'),
    url(r'^action/(?P<object_id>[A-Za-z0-9]+)/edit/(?P<number>\d+|random)/size/(?P<size>\w+)/$', 'spud.views.action_photo_edit', name='action_photo_edit'),

    url(r'^search/$', 'spud.views.search_list', name='search_list'),
    url(r'^search/(?P<object_id>[A-Za-z0-9=,;!_ \'\.-]*)/$', 'spud.views.search_detail', name='search_detail'),
    url(r'^search/(?P<object_id>[A-Za-z0-9=,;!_ \'\.-]*)/detail/(?P<number>\d+|random)/size/(?P<size>\w+)/$', 'spud.views.search_photo_detail', name='search_photo_detail'),
    url(r'^search/(?P<object_id>[A-Za-z0-9=,;!_ \'\.-]*)/edit/(?P<number>\d+|random)/size/(?P<size>\w+)/$', 'spud.views.search_photo_edit', name='search_photo_edit'),

    url(r'^relation/$', 'spud.views.photo_relation_list', name='photo_relation_list'),
    url(r'^relation/add/$', 'spud.views.photo_relation_add', name='photo_relation_add'),
    url(r'^relation/add/(?P<object_id>\d+)/$', 'spud.views.photo_relation_add', name='photo_relation_add'),
    url(r'^relation/(?P<object_id>\d+)/edit/$', 'spud.views.photo_relation_edit', name='photo_relation_edit'),
    url(r'^relation/(?P<object_id>\d+)/delete/$', 'spud.views.photo_relation_delete', name='photo_relation_delete'),

    (r'^comments/', include('django.contrib.comments.urls')),

    url(r'^ajax/', include('ajax_select.urls')),

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
)
