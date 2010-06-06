import django.views
from django.conf.urls.defaults import *
from spud import models
from spud import views

urlpatterns = patterns('',
    url(r'^$', 'spud.views.spud_root', name='spud_root'),

    url(r'^photo/(?P<object_id>\d+)/$', 'spud.views.photo_detail', name='photo_detail'),
    url(r'^photo/(?P<object_id>\d+)/orig/$', 'spud.views.photo_orig_redirect', name='photo_orig_redirect'),
    url(r'^photo/(?P<object_id>\d+)/size/(?P<size>\w+)/$', 'spud.views.photo_thumb_redirect', name='photo_thumb_redirect'),
    url(r'^photo/(?P<object_id>\d+)/edit/$', 'spud.views.photo_edit', name='photo_edit'),

    (r'^place/$', 'spud.views.place_redirect', {'object_id': 1}),
    url(r'^place/(?P<object_id>\d+|none)/$', 'spud.views.place_detail', name='place_detail'),
    url(r'^place/(?P<object_id>\d+)/edit/$', 'spud.views.place_edit', name='place_edit'),
    url(r'^place/(?P<object_id>\d+)/create/$', 'spud.views.place_create', name='place_create'),
    url(r'^place/(?P<object_id>\d+)/delete/$', 'spud.views.place_delete', name='place_delete'),
    url(r'^place/(?P<object_id>\d+|none)/detail/(?P<number>\d+|random)/$', 'spud.views.place_photo_detail', name='place_photo_detail'),
    url(r'^place/(?P<object_id>\d+|none)/edit/(?P<number>\d+|random)/$', 'spud.views.place_photo_edit', name='place_photo_edit'),

    (r'^album/$', 'spud.views.album_redirect', {'object_id': 1}),
    url(r'^album/todo/$', 'spud.views.album_todo', name='album_todo'),
    url(r'^album/(?P<object_id>\d+|none)/$', 'spud.views.album_detail', name='album_detail'),
    url(r'^album/(?P<object_id>\d+)/edit/$', 'spud.views.album_edit', name='album_edit'),
    url(r'^album/(?P<object_id>\d+)/create/$', 'spud.views.album_create', name='album_create'),
    url(r'^album/(?P<object_id>\d+)/delete/$', 'spud.views.album_delete', name='album_delete'),
    url(r'^album/(?P<object_id>\d+|none)/detail/(?P<number>\d+|random)/$', 'spud.views.album_photo_detail', name='album_photo_detail'),
    url(r'^album/(?P<object_id>\d+|none)/edit/(?P<number>\d+|random)/$', 'spud.views.album_photo_edit', name='album_photo_edit'),

    (r'^categegory/$', 'spud.views.category_redirect', {'object_id': 1}),
    url(r'^category/(?P<object_id>\d+|none)/$', 'spud.views.category_detail', name='category_detail'),
    url(r'^category/(?P<object_id>\d+)/edit/$', 'spud.views.category_edit', name='category_edit'),
    url(r'^category/(?P<object_id>\d+)/create/$', 'spud.views.category_create', name='category_create'),
    url(r'^category/(?P<object_id>\d+)/delete/$', 'spud.views.category_delete', name='category_delete'),
    url(r'^category/(?P<object_id>\d+|none)/detail/(?P<number>\d+|random)/$', 'spud.views.category_photo_detail', name='category_photo_detail'),
    url(r'^category/(?P<object_id>\d+|none)/edit/(?P<number>\d+|random)/$', 'spud.views.category_photo_edit', name='category_photo_edit'),

    url(r'^person/$', 'spud.views.person_list', name='person_list'),
    url(r'^person/(?P<object_id>\d+|none)/$', 'spud.views.person_detail', name='person_detail'),
    url(r'^person/(?P<object_id>\d+)/edit/$', 'spud.views.person_edit', name='person_edit'),
    url(r'^person/create/$', 'spud.views.person_create', name='person_create'),
    url(r'^person/(?P<object_id>\d+)/delete/$', 'spud.views.person_delete', name='person_delete'),
    url(r'^person/(?P<object_id>\d+|none)/detail/(?P<number>\d+|random)/$', 'spud.views.person_photo_detail', name='person_photo_detail'),
    url(r'^person/(?P<object_id>\d+|none)/edit/(?P<number>\d+|random)/$', 'spud.views.person_photo_edit', name='person_photo_edit'),

    url(r'^date/$', 'spud.views.date_list', name='date_list'),
    url(r'^date/(?P<object_id>\d\d\d\d-\d\d-\d\d|all)/$', 'spud.views.date_detail', name='date_detail'),
    url(r'^date/(?P<object_id>\d\d\d\d-\d\d-\d\d|all)/detail/(?P<number>\d+|random)/$', 'spud.views.date_photo_detail', name='date_photo_detail'),
    url(r'^date/(?P<object_id>\d\d\d\d-\d\d-\d\d|all)/edit/(?P<number>\d+|random)/$', 'spud.views.date_photo_edit', name='date_photo_edit'),

    url(r'^status/$', 'spud.views.status_list', name='status_list'),
    url(r'^status/(?P<object_id>[A-Z]|none)/$', 'spud.views.status_detail', name='status_detail'),
    url(r'^status/(?P<object_id>[A-Z]|none)/detail/(?P<number>\d+|random)/$', 'spud.views.status_photo_detail', name='status_photo_detail'),
    url(r'^status/(?P<object_id>[A-Z]|none)/edit/(?P<number>\d+|random)/$', 'spud.views.status_photo_edit', name='status_photo_edit'),

    url(r'^search/$', 'spud.views.search_list', name='search_list'),
    url(r'^search/(?P<object_id>[A-Za-z0-9=,;!_\.-]*)/$', 'spud.views.search_detail', name='search_detail'),
    url(r'^search/(?P<object_id>[A-Za-z0-9=,;!_\.-]*)/detail/(?P<number>\d+|random)/$', 'spud.views.search_photo_detail', name='search_photo_detail'),
    url(r'^search/(?P<object_id>[A-Za-z0-9=,;!_\.-]*)/edit/(?P<number>\d+|random)/$', 'spud.views.search_photo_edit', name='search_photo_edit'),

    url(r'^relation/$', 'spud.views.photo_relation_list', name='photo_relation_list'),
    url(r'^relation/create/$', 'spud.views.photo_relation_create', name='photo_relation_create'),
    url(r'^relation/create/(?P<object_id>\d+)/$', 'spud.views.photo_relation_create', name='photo_relation_create'),
    url(r'^relation/(?P<object_id>\d+)/edit/$', 'spud.views.photo_relation_edit', name='photo_relation_edit'),
    url(r'^relation/(?P<object_id>\d+)/delete/$', 'spud.views.photo_relation_delete', name='photo_relation_delete'),

    url(r'^queer/$', 'spud.views.queer_list', name='queer_list'),
    url(r'^queer/create/$', 'spud.views.queer_create', name='queer_create'),
    url(r'^queer/(?P<object_id>\d+)/$', 'spud.views.queer_detail', name='queer_detail'),
    url(r'^queer/(?P<object_id>\d+)/edit/$', 'spud.views.queer_edit', name='queer_edit'),
    url(r'^queer/(?P<object_id>\d+)/delete/$', 'spud.views.queer_delete', name='queer_delete'),

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
