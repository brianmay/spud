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

import json
import spud.models
import os.path
import pytz
import datetime

import django.conf
import django.contrib.auth
from django.shortcuts import get_object_or_404
from django.http import HttpResponse
from django.http import HttpResponseBadRequest, HttpResponseForbidden
#from django.core.urlresolvers import reverse
from django.utils.http import urlquote
from django.utils.encoding import iri_to_uri
from django.db.models import Q
from django.template import RequestContext, loader, TemplateDoesNotExist


def _decode_int(string):
    try:
        return int(string)
    except ValueError:
        raise HttpBadRequest("Got non-integer")


def _decode_boolean(string):
    if string.lower() == "true":
        return True
    elif string.lower() == "false":
        return False
    else:
        raise HttpBadRequest("Got non-boolean")


def _decode_datetime(value, timezone):
    index = value.find(" +")
    if index == -1:
        index = value.find(" -")
    if index != -1:
        value, sign, offset = (
            value[0:index].strip(),
            value[index+1:index+2],
            value[index+2:]
        )
        if len(offset) == 2:
            offset = _decode_int(offset) * 60
        elif len(offset) == 4:
            offset = _decode_int(offset[0:2]) * 60 + _decode_int(offset[2:4])
        else:
            raise HttpBadRequest("Can't parse timezone")
        if sign == '-':
            offset = -offset
        timezone = pytz.FixedOffset(offset)
        offset = None
    index = None

    value = value.split(" ")
    new_value = []
    for v in value:
        index = v.find("/")
        if index == -1:
            new_value.append(v)
        else:
            try:
                timezone = pytz.timezone(v)
            except pytz.UnknownTimeZoneError:
                raise HttpBadRequest("Unknown timezone")
    value = " ".join(new_value)
    new_value = None

    try:
        dt = datetime.datetime.strptime(value, "%Y-%m-%d %H:%M:%S")
    except ValueError:
        try:
            dt = datetime.datetime.strptime(value, "%Y-%m-%d %H:%M")
        except ValueError:
            try:
                dt = datetime.datetime.strptime(value, "%Y-%m-%d")
            except ValueError:
                raise HttpBadRequest("Can't parse date/time")

    dt = timezone.localize(dt)
    return dt


def _decode_array(value):
    if value == "":
        return []
    return value.split(".")


def _get_session(request):
    is_authenticated = request.user.is_authenticated()

    session = {
        'is_authenticated': is_authenticated,
    }

    if is_authenticated:
        session.update({
            'first_name': request.user.first_name,
            'last_name': request.user.last_name,
        })

    return session


def _get_photo_thumb(user, photo):
    if photo is None:
        return None

    resp = {
        'type': 'photo',
#        'url': reverse("static_photo_detail", kwargs={'photo_id': photo.pk}),
        'id': photo.photo_id,
        'title': unicode(photo),
#        'photographer': photo.photographer,
#        'place': photo.location,
        'view': photo.view,
        'rating': photo.rating,
        'description': photo.description,
        'localtime': _get_datetime(photo.datetime, photo.utc_offset),
        'utctime': _get_datetime(photo.datetime, 0),
#        'camera_make': photo.camera_make,
#        'camera_model': photo.camera_model,
#        'flash_used': photo.flash_used,
#        'focal_length': photo.focal_length,
#        'exposure': photo.exposure,
#        'compression': photo.compression,
#        'aperture': photo.aperture,
#        'level': photo.level,
#        'iso_equiv': photo.iso_equiv,
#        'metering_mode': photo.metering_mode,
#        'focus_dist': photo.focus_dist,
#        'ccd_width': photo.ccd_width,
#        'comment': photo.comment,
        'action': photo.action,
#        'timestamp': photo.timestamp,
#        'albums': photo.albums,
#        'categorys': photo.categorys,
#        'persons': photo.persons,
#        'relations': photo.relations,

        'thumb': {},
#        'orig': iri_to_uri(u"%sorig/%s/%s" % (
#            django.conf.settings.IMAGE_URL, urlquote(photo.path), urlquote(photo.name)))

        'can_add': user.has_perm('spud.add_photo'),
        'can_change': user.has_perm('spud.change_photo'),
        'can_delete': user.has_perm('spud.delete_photo'),
    }

    (shortname, _) = os.path.splitext(photo.name)

    for pt in photo.photo_thumb_set.all():
        d = {
            'width': pt.width,
            'height': pt.height,
            'url': iri_to_uri(u"%sthumb/%s/%s/%s.jpg" % (
                django.conf.settings.IMAGE_URL, urlquote(pt.size),
                urlquote(photo.path), urlquote(shortname)))
        }
        resp['thumb'][pt.size] = d

    return resp


def _get_photo_detail(user, photo):
    if photo is None:
        return None

    resp = {
        'type': 'photo',
#        'url': reverse("static_photo_detail", kwargs={'photo_id': photo.pk}),
        'id': photo.photo_id,
        'title': unicode(photo),
        'name': photo.name,
        'photographer': _get_person(user, photo.photographer),
        'place': _get_place(user, photo.location),
        'view': photo.view,
        'rating': photo.rating,
        'description': photo.description,
        'localtime': _get_datetime(photo.datetime, photo.utc_offset),
        'utctime': _get_datetime(photo.datetime, 0),
        'camera_make': photo.camera_make,
        'camera_model': photo.camera_model,
        'flash_used': photo.flash_used,
        'focal_length': photo.focal_length,
        'exposure': photo.exposure,
        'compression': photo.compression,
        'aperture': photo.aperture,
        'level': photo.level,
        'iso_equiv': photo.iso_equiv,
        'metering_mode': photo.metering_mode,
        'focus_dist': photo.focus_dist,
        'ccd_width': photo.ccd_width,
#        'comment': photo.comment,
        'action': photo.action,
#        'timestamp': photo.timestamp,
        'albums': [_get_album(user, a) for a in photo.albums.all()],
        'categorys': [_get_category(user, c) for c in photo.categorys.all()],
        'persons': [_get_person(user, p) for p in photo.persons.order_by("photo_person__position").all()],
#        'relations': photo.relations,

        'thumb': {},

        'related': [],

        'can_add': user.has_perm('spud.add_photo'),
        'can_change': user.has_perm('spud.change_photo'),
        'can_delete': user.has_perm('spud.delete_photo'),
    }

    for pr in photo.relations_1.all():
        resp['related'].append({
            'title': pr.desc_2,
            'photo': _get_photo_thumb(user, pr.photo_2),
        })

    for pr in photo.relations_2.all():
        resp['related'].append({
            'title': pr.desc_1,
            'photo': _get_photo_thumb(user, pr.photo_1),
        })

    (shortname, _) = os.path.splitext(photo.name)

    for pt in photo.photo_thumb_set.all():
        d = {
            'width': pt.width,
            'height': pt.height,
            'url': iri_to_uri(u"%sthumb/%s/%s/%s.jpg" % (
                django.conf.settings.IMAGE_URL, urlquote(pt.size),
                urlquote(photo.path), urlquote(shortname)))
        }
        resp['thumb'][pt.size] = d

    if user.is_staff:
        resp['orig'] = iri_to_uri(u"%sorig/%s/%s" % (
            django.conf.settings.IMAGE_URL,
            urlquote(photo.path), urlquote(photo.name)))
        resp['comment'] = photo.comment

    return resp


def _get_album(user, album):
    if album is None:
        return None

    d = {
        'type': 'album',
#        'url': reverse("static_album_detail", kwargs={'album_id': album.pk}),
        'id': album.album_id,
#        'parent_album': album.parent_album,
        'title': album.album,
        'description': album.album_description,
        'cover_photo': _get_photo_thumb(user, album.cover_photo),
        'sortname': album.sortname,
        'sortorder': album.sortorder,
        'revised': unicode(album.revised),
        'can_add': user.has_perm('spud.add_album'),
        'can_change': user.has_perm('spud.change_album'),
        'can_delete': user.has_perm('spud.delete_album'),
    }
    return d


def _get_album_detail(user, album):
    if album is None:
        return None

    d = {
        'type': 'album',
#        'url': reverse("static_album_detail", kwargs={'album_id': album.pk}),
        'id': album.album_id,
#        'parent_album': _get_album(user, album.parent_album),
        'title': album.album,
        'description': album.album_description,
        'cover_photo': _get_photo_thumb(user, album.cover_photo),
        'sortname': album.sortname,
        'sortorder': album.sortorder,
        'revised': unicode(album.revised),
        'parents': [],
        'children': [],
        'can_add': user.has_perm('spud.add_album'),
        'can_change': user.has_perm('spud.change_album'),
        'can_delete': user.has_perm('spud.delete_album'),
    }

    parent = album.parent_album
    seen = {}
    while parent is not None and parent.pk not in seen:
        d['parents'].insert(0, _get_album(user, parent))
        seen[parent.pk] = True
        parent = parent.parent_album

    for child in album.children.all():
        d['children'].append(_get_album(user, child))

    return d


def _get_category(user, category):
    if category is None:
        return None

    d = {
        'type': 'category',
#        'url': reverse("category_detail", kwargs={'object_id': category.pk}),
        'id': category.category_id,
#        'parent_category': category.parent_category,
        'title': category.category,
        'description': category.category_description,
        'cover_photo': _get_photo_thumb(user, category.cover_photo),
        'sortname': category.sortname,
        'sortorder': category.sortorder,
        'can_add': user.has_perm('spud.add_category'),
        'can_change': user.has_perm('spud.change_category'),
        'can_delete': user.has_perm('spud.delete_category'),
    }
    return d


def _get_category_detail(user, category):
    if category is None:
        return None

    d = {
        'type': 'category',
#        'url': reverse("category_detail", kwargs={'object_id': category.pk}),
        'id': category.category_id,
#        'parent_category': category.parent_category,
        'title': category.category,
        'description': category.category_description,
        'cover_photo': _get_photo_thumb(user, category.cover_photo),
        'sortname': category.sortname,
        'sortorder': category.sortorder,
        'parents': [],
        'children': [],
        'can_add': user.has_perm('spud.add_category'),
        'can_change': user.has_perm('spud.change_category'),
        'can_delete': user.has_perm('spud.delete_category'),
    }

    parent = category.parent_category
    seen = {}
    while parent is not None and parent.pk not in seen:
        d['parents'].insert(0, _get_category(user, parent))
        seen[parent.pk] = True
        parent = parent.parent_category

    for child in category.children.all():
        d['children'].append(_get_category(user, child))

    return d


def _get_place(user, place):
    if place is None:
        return None

    d = {
        'type': 'place',
#        'url': reverse("place_detail", kwargs={'object_id': place.pk}),
        'id': place.place_id,
#        'parent_place': place.parent_place,
        'title': place.title,
        'address': place.address,
        'address2': place.address2,
        'city': place.city,
        'state': place.state,
        'zip': place.zip,
        'country': place.country,
        'url': place.url,
        'urldesc': place.urldesc,
        'cover_photo': _get_photo_thumb(user, place.cover_photo),
        'notes': place.notes,
        'can_add': user.has_perm('spud.add_place'),
        'can_change': user.has_perm('spud.change_place'),
        'can_delete': user.has_perm('spud.delete_place'),
    }
    return d


def _get_place_detail(user, place):
    if place is None:
        return None

    d = {
        'type': 'place',
#        'url': reverse("place_detail", kwargs={'object_id': place.pk}),
        'id': place.place_id,
#        'parent_place': place.parent_place,
        'title': place.title,
        'address': place.address,
        'address2': place.address2,
        'city': place.city,
        'state': place.state,
        'zip': place.zip,
        'country': place.country,
        'url': place.url,
        'urldesc': place.urldesc,
        'cover_photo': _get_photo_thumb(user, place.cover_photo),
        'notes': place.notes,
        'parents': [],
        'children': [],
        'can_add': user.has_perm('spud.add_place'),
        'can_change': user.has_perm('spud.change_place'),
        'can_delete': user.has_perm('spud.delete_place'),
    }

    parent = place.parent_place
    seen = {}
    while parent is not None and parent.pk not in seen:
        d['parents'].insert(0, _get_place(user, parent))
        seen[parent.pk] = True
        parent = parent.parent_place

    for child in place.children.all():
        d['children'].append(_get_place(user, child))

    return d


def _get_person(user, person):
    if person is None:
        return None

    d = {
        'type': 'person',
#        'url': reverse("person_detail", kwargs={'object_id': person.pk}),
        'id': person.person_id,
        'title': unicode(person),
        'first_name': person.first_name,
        'last_name': person.last_name,
        'middle_name': person.middle_name,
        'called': person.called,
        'cover_photo': _get_photo_thumb(user, person.cover_photo),
#        'gender': person.gender,
#        'dob': unicode(person.dob),
#        'dod': unicode(person.dod),
#        'home': person.home,
#        'work': person.work,
#        'father': person.father,
#        'mother': person.mother,
#        'spouse': person.spouse,
#        'notes': person.notes,
#        'email': person.email,
        'can_add': user.has_perm('spud.add_person'),
        'can_change': user.has_perm('spud.change_person'),
        'can_delete': user.has_perm('spud.delete_person'),
    }
    return d


def _get_person_detail(user, person):
    if person is None:
        return None

    d = {
        'type': 'person',
#        'url': reverse("person_detail", kwargs={'object_id': person.pk}),
        'id': person.person_id,
        'title': unicode(person),
        'first_name': person.first_name,
        'last_name': person.last_name,
        'middle_name': person.middle_name,
        'called': person.called,
        'cover_photo': _get_photo_thumb(user, person.cover_photo),
        'can_add': user.has_perm('spud.add_person'),
        'can_change': user.has_perm('spud.change_person'),
        'can_delete': user.has_perm('spud.delete_person'),
    }

    if user.is_staff:
        d.update({
            'gender': person.gender,
            'dob': None,
            'dod': None,
            'home': _get_place(user, person.home),
            'work': _get_place(user, person.work),
            'father': _get_person(user, person.father),
            'mother': _get_person(user, person.mother),
            'spouses': [],
            'grandparents': [_get_person(user, p) for p in person.grandparents()],
            'uncles_aunts': [_get_person(user, p) for p in person.uncles_aunts()],
            'parents': [_get_person(user, p) for p in person.parents()],
            'siblings': [_get_person(user, p) for p in person.siblings()],
            'cousins': [_get_person(user, p) for p in person.cousins()],
            'children': [_get_person(user, p) for p in person.children()],
            'nephews_nieces': [_get_person(user, p) for p in person.nephews_nieces()],
            'grandchildren': [_get_person(user, p) for p in person.grandchildren()],
            'notes': person.notes,
            'email': person.email,
        })

        if person.dob:
            d['dob'] = unicode(person.dob)

        if person.dod:
            d['dod'] = unicode(person.dod)

        if person.spouse:
            d['spouses'].append(_get_person(user, person.spouse))

        for p in person.reverse_spouses.all():
            if p.person_id != person.spouse.person_id:
                d['spouses'].append(_get_person(user, p))

    return d


def _get_datetime(value, utc_offset):
    from_tz = pytz.utc
    to_tz = pytz.FixedOffset(utc_offset)
    to_offset = datetime.timedelta(minutes=utc_offset)

    local = from_tz.localize(value)
    local = (local + to_offset).replace(tzinfo=to_tz)

    if utc_offset < 0:
        tz_string = "-%02d%02d" % (-utc_offset/60, -utc_offset % 60)
        object_id = "%s-%02d%02d" % (local.date(),
                                     -utc_offset/60, -utc_offset % 60)
    else:
        tz_string = "+%02d%02d" % (utc_offset/60, utc_offset % 60)
        object_id = "%s+%02d%02d" % (local.date(),
                                     utc_offset/60, utc_offset % 60)

    return {
        'type': 'datetime',
#        'url': reverse("date_detail", kwargs={'object_id': object_id}),
        'date': unicode(local.date()),
        'time': unicode(local.time()),
        'timezone': tz_string
    }


class HttpBadRequest(Exception):
    pass


class HttpForbidden(Exception):
    pass


def check_errors(func):
    def wrapper(request, *args, **kwargs):
        try:
            return func(request, *args, **kwargs)
        except HttpBadRequest, e:
            try:
                template = loader.get_template("400.html")
            except TemplateDoesNotExist:
                return HttpResponseBadRequest('<h1>Bad Request</h1>')
            return HttpResponseBadRequest(
                template.render(RequestContext(request, {
                    'error': unicode(e)
                })))
        except HttpForbidden, e:
            try:
                template = loader.get_template("403.html")
            except TemplateDoesNotExist:
                return HttpResponseForbidden('<h1>Forbidden</h1>')
            return HttpResponseForbidden(
                template.render(RequestContext(request, {
                    'error': unicode(e)
                })))
    return wrapper


@check_errors
def login(request):
    if request.method != "POST":
        raise HttpBadRequest("Only POST is supported")
    if 'username' not in request.POST:
        raise HttpBadRequest("username not supplied")
    if 'password' not in request.POST:
        raise HttpBadRequest("password not supplied")
    username = request.POST['username']
    password = request.POST['password']
    user = django.contrib.auth.authenticate(
        username=username, password=password)
    if user is not None:
        if user.is_active:
            django.contrib.auth.login(request, user)
            resp = {'status': 'success'}
        else:
            resp = {'status': 'account_disabled'}
    else:
        resp = {'status': 'invalid_login'}
    resp['session'] = _get_session(request)
    return HttpResponse(json.dumps(resp), mimetype="application/json")


@check_errors
def logout(request):
    if request.method != "POST":
        raise HttpBadRequest("Only POST is supported")
    django.contrib.auth.logout(request)
    resp = {'status': 'success'}
    resp['session'] = _get_session(request)
    return HttpResponse(json.dumps(resp), mimetype="application/json")


def photo(request, photo_id):
    object = get_object_or_404(spud.models.photo, pk=photo_id)
    resp = {
        'photo': _get_photo_detail(request.user, object),
        'session': _get_session(request),
    }
    return HttpResponse(json.dumps(resp), mimetype="application/json")


@check_errors
def album(request, album_id):
    if request.method == "POST":
        if not request.user.has_perm('spud.change_album'):
            raise HttpForbidden("No rights to change albums")
    album = get_object_or_404(spud.models.album, pk=album_id)
    return album_finish(request, album)


@check_errors
def album_add(request):
    if request.method != "POST":
        raise HttpBadRequest("Only POST is supported")
    if request.method == "POST":
        if not request.user.has_perm('spud.add_album'):
            raise HttpForbidden("No rights to add albums")
    album = spud.models.album()
    return album_finish(request, album)


@check_errors
def album_delete(request, album_id):
    if request.method != "POST":
        raise HttpBadRequest("Only POST is supported")
    if not request.user.has_perm('spud.delete_album'):
        raise HttpForbidden("No rights to delete albums")
    album = get_object_or_404(spud.models.album, pk=album_id)

    errors = album.check_delete()
    resp = {
        'errors': errors,
        'session': _get_session(request),
    }

    if len(errors) == 0:
        album.delete()
        resp['status'] = 'success'
    else:
        resp['status'] = 'errors'

    return HttpResponse(json.dumps(resp), mimetype="application/json")


def album_finish(request, album):
    if request.method == "POST":
        updated = False
        if 'title' in request.POST:
            album.album = request.POST['title']
            updated = True
        if 'description' in request.POST:
            album.album_description = request.POST['description']
            updated = True
        if 'cover_photo' in request.POST:
            if request.POST['cover_photo'] == "":
                album.cover_photo = None
            else:
                try:
                    photo_id = _decode_int(request.POST['cover_photo'])
                    cp = spud.models.photo.objects.get(pk=photo_id)
                    album.cover_photo = cp
                except spud.models.photo.DoesNotExist:
                    raise HttpBadRequest("cover_photo does not exist")
            updated = True
        if 'sortname' in request.POST:
            album.sortname = request.POST['sortname']
            updated = True
        if 'sortorder' in request.POST:
            album.sortorder = request.POST['sortorder']
            updated = True
        if 'parent' in request.POST:
            if request.POST['parent'] == "":
                album.parent_album = None
            else:
                try:
                    parent_id = _decode_int(request.POST['parent'])
                    p = spud.models.album.objects.get(pk=parent_id)
                    album.parent_album = p
                except spud.models.album.DoesNotExist:
                    raise HttpBadRequest("cover_photo does not exist")
            updated = True
        if updated:
            album.save()

    resp = _get_album_detail(request.user, album)
    resp = {
        'album': _get_album_detail(request.user, album),
        'session': _get_session(request),
    }
    return HttpResponse(json.dumps(resp), mimetype="application/json")


@check_errors
def category(request, category_id):
    if request.method == "POST":
        if not request.user.has_perm('spud.change_category'):
            raise HttpForbidden("No rights to change categorys")
    category = get_object_or_404(spud.models.category, pk=category_id)
    return category_finish(request, category)


@check_errors
def category_add(request):
    if request.method != "POST":
        raise HttpBadRequest("Only POST is supported")
    if request.method == "POST":
        if not request.user.has_perm('spud.add_category'):
            raise HttpForbidden("No rights to add categorys")
    category = spud.models.category()
    return category_finish(request, category)


@check_errors
def category_delete(request, category_id):
    if request.method != "POST":
        raise HttpBadRequest("Only POST is supported")
    if not request.user.has_perm('spud.delete_category'):
        raise HttpForbidden("No rights to delete categorys")
    category = get_object_or_404(spud.models.category, pk=category_id)

    errors = category.check_delete()
    resp = {
        'errors': errors,
        'session': _get_session(request),
    }

    if len(errors) == 0:
        category.delete()
        resp['status'] = 'success'
    else:
        resp['status'] = 'errors'

    return HttpResponse(json.dumps(resp), mimetype="application/json")


def category_finish(request, category):
    if request.method == "POST":
        updated = False
        if 'title' in request.POST:
            category.category = request.POST['title']
            updated = True
        if 'description' in request.POST:
            category.category_description = request.POST['description']
            updated = True
        if 'cover_photo' in request.POST:
            if request.POST['cover_photo'] == "":
                category.cover_photo = None
            else:
                try:
                    photo_id = _decode_int(request.POST['cover_photo'])
                    cp = spud.models.photo.objects.get(pk=photo_id)
                    category.cover_photo = cp
                except spud.models.photo.DoesNotExist:
                    raise HttpBadRequest("cover_photo does not exist")
            updated = True
        if 'sortname' in request.POST:
            category.sortname = request.POST['sortname']
            updated = True
        if 'sortorder' in request.POST:
            category.sortorder = request.POST['sortorder']
            updated = True
        if 'parent' in request.POST:
            if request.POST['parent'] == "":
                category.parent_category = None
            else:
                try:
                    parent_id = _decode_int(request.POST['parent'])
                    p = spud.models.category.objects.get(pk=parent_id)
                    category.parent_category = p
                except spud.models.category.DoesNotExist:
                    raise HttpBadRequest("cover_photo does not exist")
            updated = True
        if updated:
            category.save()

    resp = _get_category_detail(request.user, category)
    resp = {
        'category': _get_category_detail(request.user, category),
        'session': _get_session(request),
    }
    return HttpResponse(json.dumps(resp), mimetype="application/json")


@check_errors
def place(request, place_id):
    if request.method == "POST":
        if not request.user.has_perm('spud.change_place'):
            raise HttpForbidden("No rights to change places")
    place = get_object_or_404(spud.models.place, pk=place_id)
    return place_finish(request, place)


@check_errors
def place_add(request):
    if request.method != "POST":
        raise HttpBadRequest("Only POST is supported")
    if request.method == "POST":
        if not request.user.has_perm('spud.add_place'):
            raise HttpForbidden("No rights to add places")
    place = spud.models.place()
    return place_finish(request, place)


@check_errors
def place_delete(request, place_id):
    if request.method != "POST":
        raise HttpBadRequest("Only POST is supported")
    if not request.user.has_perm('spud.delete_place'):
        raise HttpForbidden("No rights to delete places")
    place = get_object_or_404(spud.models.place, pk=place_id)

    errors = place.check_delete()
    resp = {
        'errors': errors,
        'session': _get_session(request),
    }

    if len(errors) == 0:
        place.delete()
        resp['status'] = 'success'
    else:
        resp['status'] = 'errors'

    return HttpResponse(json.dumps(resp), mimetype="application/json")


def place_finish(request, place):
    if request.method == "POST":
        updated = False
        if 'title' in request.POST:
            place.title = request.POST['title']
            updated = True
        if 'address' in request.POST:
            place.address = request.POST['address']
            updated = True
        if 'address2' in request.POST:
            place.address2 = request.POST['address2']
            updated = True
        if 'city' in request.POST:
            place.city = request.POST['city']
            updated = True
        if 'zip' in request.POST:
            place.zip = request.POST['zip']
            updated = True
        if 'country' in request.POST:
            place.country = request.POST['country']
            updated = True
        if 'url' in request.POST:
            place.url = request.POST['url']
            updated = True
        if 'urldesc' in request.POST:
            place.urldesc = request.POST['urldesc']
            updated = True
        if 'notes' in request.POST:
            place.place_description = request.POST['notes']
            updated = True
        if 'cover_photo' in request.POST:
            if request.POST['cover_photo'] == "":
                place.cover_photo = None
            else:
                try:
                    photo_id = _decode_int(request.POST['cover_photo'])
                    cp = spud.models.photo.objects.get(pk=photo_id)
                    place.cover_photo = cp
                except spud.models.photo.DoesNotExist:
                    raise HttpBadRequest("cover_photo does not exist")
            updated = True
        if 'parent' in request.POST:
            if request.POST['parent'] == "":
                place.parent_place = None
            else:
                try:
                    parent_id = _decode_int(request.POST['parent'])
                    p = spud.models.place.objects.get(pk=parent_id)
                    place.parent_place = p
                except spud.models.place.DoesNotExist:
                    raise HttpBadRequest("cover_photo does not exist")
            updated = True
        if updated:
            place.save()

    resp = _get_place_detail(request.user, place)
    resp = {
        'place': _get_place_detail(request.user, place),
        'session': _get_session(request),
    }
    return HttpResponse(json.dumps(resp), mimetype="application/json")


@check_errors
def person_search(request):
    resp = {}

    for key in request.GET:
        value = request.GET[key]

        if value == "" or key == "_":
            continue
        elif key == "q":
            resp[key] = value
        else:
            raise HttpBadRequest("Unknown key %s" % (key))

    resp['can_add'] = request.user.has_perm('spud.add_person')
    resp['session'] = _get_session(request)
    return HttpResponse(json.dumps(resp), mimetype="application/json")


@check_errors
def person_search_results(request):
    search_dict = request.GET.copy()

    first = search_dict.pop("first", ["0"])[-1]
    first = _decode_int(first)
    if first < 0:
        raise HttpBadRequest("first is negative")

    count = search_dict.pop("count", ["10"])[-1]
    count = _decode_int(count)
    if count < 0:
        raise HttpBadRequest("count is negative")

    person_list = spud.models.person.objects.all()

    q = search_dict.pop("q", [None])[-1]
    if q is not None:
        person_list = spud.models.person.objects.filter(
            Q(first_name=q) | Q(last_name=q) |
            Q(middle_name=q) | Q(called=q))

    number_results = person_list.count()
    person_list = person_list[first:first+count]
    number_returned = len(person_list)

    resp = {
        'persons': [_get_person(request.user, p) for p in person_list],
        'number_results': number_results,
        'first': first,
        'last': first + number_returned - 1,
        'session': _get_session(request),
        'can_add': request.user.has_perm('spud.add_person'),
        'q': q,
    }
    return HttpResponse(json.dumps(resp), mimetype="application/json")


@check_errors
def person(request, person_id):
    if request.method == "POST":
        if not request.user.has_perm('spud.change_person'):
            raise HttpForbidden("No rights to change persons")
    person = get_object_or_404(spud.models.person, pk=person_id)
    return person_finish(request, person)


@check_errors
def person_add(request):
    if request.method != "POST":
        raise HttpBadRequest("Only POST is supported")
    if request.method == "POST":
        if not request.user.has_perm('spud.add_person'):
            raise HttpForbidden("No rights to add persons")
    person = spud.models.person()
    return person_finish(request, person)


@check_errors
def person_delete(request, person_id):
    if request.method != "POST":
        raise HttpBadRequest("Only POST is supported")
    if not request.user.has_perm('spud.delete_person'):
        raise HttpForbidden("No rights to delete persons")
    person = get_object_or_404(spud.models.person, pk=person_id)

    errors = person.check_delete()
    resp = {
        'errors': errors,
        'session': _get_session(request),
    }

    if len(errors) == 0:
        person.delete()
        resp['status'] = 'success'
    else:
        resp['status'] = 'errors'

    return HttpResponse(json.dumps(resp), mimetype="application/json")


def person_finish(request, person):
    if request.method == "POST":
        updated = False
        if 'first_name' in request.POST:
            person.first_name = request.POST['first_name']
            updated = True
        if 'middle_name' in request.POST:
            person.middle_name = request.POST['middle_name']
            updated = True
        if 'last_name' in request.POST:
            person.last_name = request.POST['last_name']
            updated = True
        if 'called' in request.POST:
            person.called = request.POST['called']
            updated = True
        if 'gender' in request.POST:
            if not request.user.is_staff:
                raise HttpForbidden("No rights to change gender")
            gender = _decode_int(request.POST['gender'])
            if gender < 1 or gender > 2:
                raise HttpBadRequest("Unknown gender")
            person.gender = gender
            updated = True
        if 'notes' in request.POST:
            if not request.user.is_staff:
                raise HttpForbidden("No rights to change notes")
            person.notes = request.POST['notes']
            updated = True
        if 'email' in request.POST:
            if not request.user.is_staff:
                raise HttpForbidden("No rights to change email")
            person.email = request.POST['email']
            updated = True
        if 'dob' in request.POST:
            if not request.user.is_staff:
                raise HttpForbidden("No rights to change dob")
            person.dob = request.POST['dob']
            updated = True
        if 'dod' in request.POST:
            if not request.user.is_staff:
                raise HttpForbidden("No rights to change dod")
            person.email = request.POST['dod']
            updated = True
        if 'cover_photo' in request.POST:
            if request.POST['cover_photo'] == "":
                person.cover_photo = None
            else:
                try:
                    photo_id = _decode_int(request.POST['cover_photo'])
                    cp = spud.models.photo.objects.get(pk=photo_id)
                    person.cover_photo = cp
                except spud.models.photo.DoesNotExist:
                    raise HttpBadRequest("cover_photo does not exist")
            updated = True
        if 'work' in request.POST:
            if not request.user.is_staff:
                raise HttpForbidden("No rights to change work")
            if request.POST['work'] == "":
                person.work = None
            else:
                try:
                    place_id = _decode_int(request.POST['work'])
                    p = spud.models.place.objects.get(pk=place_id)
                    person.work = p
                except spud.models.place.DoesNotExist:
                    raise HttpBadRequest("work does not exist")
            updated = True
        if 'home' in request.POST:
            if not request.user.is_staff:
                raise HttpForbidden("No rights to change home")
            if request.POST['home'] == "":
                person.home = None
            else:
                try:
                    place_id = _decode_int(request.POST['home'])
                    p = spud.models.place.objects.get(pk=place_id)
                    person.home = p
                except spud.models.place.DoesNotExist:
                    raise HttpBadRequest("home does not exist")
            updated = True
        if 'mother' in request.POST:
            if not request.user.is_staff:
                raise HttpForbidden("No rights to change mother")
            if request.POST['mother'] == "":
                person.mother = None
            else:
                try:
                    person_id = _decode_int(request.POST['mother'])
                    p = spud.models.person.objects.get(pk=person_id)
                    person.mother = p
                except spud.models.person.DoesNotExist:
                    raise HttpBadRequest("mother does not exist")
            updated = True
        if 'father' in request.POST:
            if not request.user.is_staff:
                raise HttpForbidden("No rights to change father")
            if request.POST['father'] == "":
                person.father = None
            else:
                try:
                    person_id = _decode_int(request.POST['father'])
                    p = spud.models.person.objects.get(pk=person_id)
                    person.father = p
                except spud.models.person.DoesNotExist:
                    raise HttpBadRequest("father does not exist")
            updated = True
        if 'spouse' in request.POST:
            if not request.user.is_staff:
                raise HttpForbidden("No rights to change spouse")
            if request.POST['spouse'] == "":
                person.spouse = None
            else:
                try:
                    person_id = _decode_int(request.POST['spouse'])
                    p = spud.models.person.objects.get(pk=person_id)
                    person.spouse = p
                except spud.models.person.DoesNotExist:
                    raise HttpBadRequest("spouse does not exist")
            updated = True
        if updated:
            person.save()

    resp = _get_person_detail(request.user, person)
    resp = {
        'person': _get_person_detail(request.user, person),
        'session': _get_session(request),
    }
    return HttpResponse(json.dumps(resp), mimetype="application/json")


def _get_search(user, search_dict):
    criteria = []

    search = Q()
    photo_list = spud.models.photo.objects.all()

    search_dict.pop("_", None)

    ld = search_dict.pop("place_descendants", ["false"])[-1]
    ld = _decode_boolean(ld)

    ad = search_dict.pop("album_descendants", ["false"])[-1]
    ad = _decode_boolean(ad)

    cd = search_dict.pop("category_descendants", ["false"])[-1]
    cd = _decode_boolean(cd)

    timezone = django.conf.settings.TIME_ZONE

    def add_criteria(key, condition, value, post_text=None):
        criteria.append({
            'key': key, 'condition': condition,
            'value': value, 'post_text': post_text})

    for key in search_dict:
        value = search_dict[key]

        if value == "" or key == "_":
            continue
        elif key == "timezone":
            continue
        elif key == "first_id":
            add_criteria('id', 'is or greator then',
                         {'type': "string", 'value': value})
            search = search & Q(pk__gte=_decode_int(value))
        elif key == "last_id":
            add_criteria('id', 'less then',
                         {'type': "string", 'value': value})
            search = search & Q(pk__lt=_decode_int(value))
        elif key == "first_date":
            try:
                timezone = pytz.timezone(timezone)
                value = _decode_datetime(value, timezone)
            except pytz.UnknownTimeZoneError:
                raise HttpBadRequest("Invalid timezone")
            except ValueError:
                raise HttpBadRequest("Invalid date/time")
            utc_value = value.astimezone(pytz.utc).replace(tzinfo=None)
            add_criteria(
                'date/time', 'at or later then',
                _get_datetime(utc_value, value.utcoffset().total_seconds() / 60))
            search = search & Q(datetime__gte=utc_value)
        elif key == "last_date":
            try:
                timezone = pytz.timezone(timezone)
                value = _decode_datetime(value, timezone)
            except pytz.UnknownTimeZoneError:
                raise HttpBadRequest("Invalid timezone")
            except ValueError:
                raise HttpBadRequest("Invalid date/time")
            utc_value = value.astimezone(pytz.utc).replace(tzinfo=None)
            add_criteria(
                'date/time', 'earlier then',
                _get_datetime(utc_value, value.utcoffset().total_seconds() / 60))
            search = search & Q(datetime__lt=utc_value)
        elif key == "lower_rating":
            add_criteria('rating', 'higher then',
                         {'type': "string", 'value': value})
            search = search & Q(rating__gte=value)
        elif key == "upper_rating":
            add_criteria('rating', 'less then',
                         {'type': "string", 'value': value})
            search = search & Q(rating__lte=value)
        elif key == "title":
            add_criteria(key, 'contains',
                         {'type': "string", 'value': value})
            search = search & Q(title__icontains=value)
        elif key == "camera_make":
            add_criteria(key, 'contains',
                         {'type': "string", 'value': value})
            search = search & Q(camera_make__icontains=value)
        elif key == "camera_model":
            add_criteria(key, 'contains',
                         {'type': "string", 'value': value})
            search = search & Q(camera_model__icontains=value)
        elif key == "photographer":
            object = get_object_or_404(spud.models.person, pk=value)
            add_criteria(key, 'is', _get_person(user, object))
            search = search & Q(photographer=object)
        elif key == "place":
            object = get_object_or_404(spud.models.place, pk=value)
            if ld:
                add_criteria(key, 'is', _get_place(user, object),
                             '(or descendants)')
                descendants = object.get_descendants()
                search = search & Q(location__in=descendants)
            else:
                add_criteria(key, 'is', _get_place(user, object))
                search = search & Q(location=object)
        elif key == "person":
            values = _decode_array(value)
            for value in values:
                value = _decode_int(value)
                object = get_object_or_404(spud.models.person, pk=value)
                add_criteria(key, 'is', _get_person(user, object))
                photo_list = photo_list.filter(persons=object)
        elif key == "album":
            values = _decode_array(value)
            for value in values:
                value = _decode_int(value)
                object = get_object_or_404(spud.models.album, pk=value)
                if ad:
                    add_criteria(key, 'is', _get_album(user, object),
                                 '(or descendants)')
                    descendants = object.get_descendants()
                    photo_list = photo_list.filter(albums__in=descendants)
                else:
                    add_criteria(key, 'is', _get_album(user, object))
                    photo_list = photo_list.filter(albums=object)
        elif key == "category":
            values = _decode_array(value)
            for value in values:
                value = _decode_int(value)
                object = get_object_or_404(spud.models.category, pk=value)
                if cd:
                    add_criteria(key, 'is', _get_category(user, object),
                                 '(or descendants)')
                    descendants = object.get_descendants()
                    photo_list = photo_list.filter(
                        categorys__in=descendants)
                else:
                    add_criteria(key, 'is', _get_category(user, object))
                    photo_list = photo_list.filter(categorys=object)
        elif key == "photo":
            values = _decode_array(value)
            a = []
            q = Q()
            for value in values:
                value = _decode_int(value)
                object = get_object_or_404(spud.models.photo, pk=value)
                a.append(_get_photo_thumb(user, object))
                q = q | Q(pk=object.pk)
            add_criteria(key, 'is', {'type': "photos", 'value': a})
            photo_list = photo_list.filter(q)
        elif key == "place_none":
            value = _decode_boolean(value)
            if value:
                add_criteria("location", 'is',
                             {'type': "string", 'value': "None"})
                search = search & Q(location=None)
        elif key == "person_none":
            value = _decode_boolean(value)
            if value:
                add_criteria("person", 'is',
                             {'type': "string", 'value': "None"})
                search = search & Q(persons=None)
        elif key == "album_none":
            value = _decode_boolean(value)
            if value:
                add_criteria("album", 'is',
                             {'type': "string", 'value': "None"})
                search = search & Q(albums=None)
        elif key == "category_none":
            value = _decode_boolean(value)
            if value:
                add_criteria("category", 'is',
                             {'type': "string", 'value': "None"})
                search = search & Q(categorys=None)
        elif key == "action":
            if value == "none":
                search = search & Q(action__isnull=True)
            else:
                search = search & Q(action=value)
            value = spud.models.action_to_string(value)
            add_criteria(key, 'is', {'type': "string", 'value': value})
        elif key == "path":
            add_criteria(key, 'is', {'type': "string", 'value': value})
            search = search & Q(path=value)
        elif key == "name":
            add_criteria(key, 'is', {'type': "string", 'value': value})
            search = search & Q(name=value)
#        else:
#            raise HttpBadRequest("Unknown key %s" % (key))

        photo_list = photo_list.filter(search)

    return photo_list, criteria


@check_errors
def search(request):
    resp = {}

    for key in request.GET:
        value = request.GET[key]

        if value == "" or key == "_":
            continue
        elif key == "place_descendants":
            resp[key] = value
        elif key == "album_descendants":
            resp[key] = value
        elif key == "category_descendants":
            resp[key] = value
        elif key == "first_id":
            resp[key] = value
        elif key == "last_id":
            resp[key] = value
        elif key == "first_date":
            resp[key] = value
        elif key == "last_date":
            resp[key] = value
        elif key == "lower_rating":
            resp[key] = value
        elif key == "upper_rating":
            resp[key] = value
        elif key == "title":
            resp[key] = value
        elif key == "camera_make":
            resp[key] = value
        elif key == "camera_model":
            resp[key] = value
        elif key == "photographer":
            value = _decode_int(value)
            photographer = get_object_or_404(spud.models.person, pk=value)
            resp['photographer'] = _get_person(request.user, photographer)
        elif key == "place":
            value = _decode_int(value)
            place = get_object_or_404(spud.models.place, pk=value)
            resp['place'] = _get_place(request.user, place)
        elif key == "person":
            values = _decode_array(value)
            resp['person'] = []
            for person_id in values:
                person_id = _decode_int(person_id)
                person = get_object_or_404(spud.models.person, pk=person_id)
                resp['person'].append(_get_person(request.user, person))
        elif key == "album":
            values = _decode_array(value)
            resp['album'] = []
            for album_id in values:
                album_id = _decode_int(album_id)
                album = get_object_or_404(spud.models.album, pk=album_id)
                resp['album'].append(_get_album(request.user, album))
        elif key == "category":
            values = _decode_array(request.GET['category'])
            resp['category'] = []
            for category_id in values:
                category_id = _decode_int(category_id)
                category = get_object_or_404(
                    spud.models.category, pk=category_id)
                resp['category'].append(_get_category(request.user, category))
        elif key == "photo":
            values = _decode_array(request.GET['photo'])
            resp['photo'] = []
            for photo_id in values:
                photo_id = _decode_int(photo_id)
                photo = get_object_or_404(
                    spud.models.photo, pk=photo_id)
                resp['photo'].append(_get_photo_thumb(request.user, photo))
        elif key == "place_none":
            resp[key] = value
        elif key == "person_none":
            resp[key] = value
        elif key == "album_none":
            resp[key] = value
        elif key == "category_none":
            resp[key] = value
        elif key == "action":
            resp[key] = value
        elif key == "path":
            resp[key] = value
        elif key == "name":
            resp[key] = value
#        else:
#            raise HttpBadRequest("Unknown key %s" % (key))

    resp['session'] = _get_session(request)
    return HttpResponse(json.dumps(resp), mimetype="application/json")


@check_errors
def search_results(request):
    search_dict = request.GET.copy()

    first = search_dict.pop("first", ["0"])[-1]
    first = _decode_int(first)
    if first < 0:
        raise HttpBadRequest("first is negative")

    count = search_dict.pop("count", ["10"])[-1]
    count = _decode_int(count)
    if count < 0:
        raise HttpBadRequest("count is negative")

    photo_list, criteria = _get_search(request.user, search_dict)
    number_results = photo_list.count()

    photos = photo_list[first:first+count]
    number_returned = len(photos)

    resp = {
        'criteria': criteria,
        'photos': [_get_photo_thumb(request.user, p) for p in photos],
        'number_results': number_results,
        'first': first,
        'last': first + number_returned - 1,
        'session': _get_session(request),
        'can_add': request.user.has_perm('spud.add_photo'),
    }
    return HttpResponse(json.dumps(resp), mimetype="application/json")


@check_errors
def search_change(request):
    if request.method != "POST":
        raise HttpBadRequest("Only POST is supported")
    if request.method == "POST":
        if not request.user.has_perm('spud.change_photo'):
            raise HttpForbidden("No rights to change photos")

    search_dict = request.POST.copy()

    timezone = django.conf.settings.TIME_ZONE

    photo_list, criteria = _get_search(request.user, search_dict)
    number_results = photo_list.count()

    print len(photo_list)
    print "dddd"
    print request.POST
    if request.method == "POST" and False:
        if 'set_title' in request.POST:
            photo_list.update(title=request.POST['set_title'])
        if 'set_description' in request.POST:
            photo_list.update(description=request.POST['set_description'])
        if 'set_view' in request.POST:
            photo_list.update(view=request.POST['set_view'])
        if 'set_comment' in request.POST:
            if not request.user.is_staff:
                raise HttpForbidden("No rights to change comment")
            photo_list.update(view=request.POST['set_comment'])
        if 'set_datetime' in request.POST:
            dt = _decode_datetime(request.POST['set_datetime'], timezone)
            utc_offset = dt.utcoffset().total_seconds() / 60
            dt = dt.astimezone(pytz.utc).replace(tzinfo=None)
            photo_list.update(action="M",
                              utc_offset=utc_offset, datetime=dt)
            utc_offset = None
            dt = None
        if 'set_action' in request.POST:
            action = request.POST['set_action']
            found = False
            for a in spud.models.PHOTO_ACTION:
                if a[0] == action:
                    found = True
            if not found:
                raise HttpBadRequest("Unknown action")
            photo_list.update(action=action)
            action = None
            found = None
        if 'set_photographer' in request.POST:
            if request.POST['set_photographer'] == "":
                photographer = None
            else:
                try:
                    person_id = _decode_int(request.POST['set_photographer'])
                    photographer = spud.models.person.objects.get(pk=person_id)
                    person_id = None
                except spud.models.person.DoesNotExist:
                    raise HttpBadRequest("photographer does not exist")
            photo_list.update(photographer=photographer)
            photographer = None
        if 'set_place' in request.POST:
            if request.POST['set_place'] == "":
                place = None
            else:
                try:
                    place_id = _decode_int(request.POST['set_place'])
                    place = spud.models.place.objects.get(pk=place_id)
                    place_id = None
                except spud.models.place.DoesNotExist:
                    raise HttpBadRequest("place does not exist")
            photo_list.update(location=place)
            place = None

        if 'set_albums' in request.POST:
            values = _decode_array(request.POST['set_albums'])
            values = [_decode_int(i) for i in values]
            for photo in photo_list:
                pa_list = list(photo.photo_album_set.all())
                for pa in pa_list:
                    if pa.album.pk in values:
                        values.remove(pa.album.pk)
                    else:
                        pa.delete()
                for pk in values:
                    pa = spud.models.photo_album.objects.create(
                        photo=photo, album_id=pk)
        if 'add_albums' in request.POST:
            values = _decode_array(request.POST['add_albums'])
            for value in values:
                album_id = _decode_int(value)
                try:
                    album = spud.models.album.objects.get(pk=album_id)
                except spud.models.album.DoesNotExist:
                    raise HttpBadRequest("album does not exist")
                for photo in photo_list:
                    spud.models.photo_album.objects.create(
                        photo=photo, album=album
                    )
                album_id = None
                album = None
        if 'del_albums' in request.POST:
            values = _decode_array(request.POST['del_albums'])
            for value in values:
                album_id = _decode_int(value)
                value = None
                try:
                    album = spud.models.album.objects.get(pk=album_id)
                except spud.models.album.DoesNotExist:
                    raise HttpBadRequest("album does not exist")
                for photo in photo_list:
                    spud.models.photo_album.objects.filter(
                        photo=photo, album=album
                    ).delete()
                album_id = None
                album = None

        if 'set_categorys' in request.POST:
            values = _decode_array(request.POST['set_albums'])
            values = [_decode_int(i) for i in values]
            pa_list = list(photo.photo_category_set.all())
            for photo in photo_list:
                for pa in pa_list:
                    if pa.category.pk in values:
                        values.remove(pa.category.pk)
                    else:
                        pa.delete()
                for pk in values:
                    pa = spud.models.photo_category.objects.create(
                        photo=photo, category_id=pk)
        if 'add_categorys' in request.POST:
            values = _decode_array(request.POST['add_categorys'])
            for value in values:
                category_id = _decode_int(value)
                try:
                    category = spud.models.category.objects.get(pk=category_id)
                except spud.models.category.DoesNotExist:
                    raise HttpBadRequest("category does not exist")
                for photo in photo_list:
                    spud.models.photo_category.objects.create(
                        photo=photo, category=category
                    )
                category_id = None
                category = None
        if 'del_categorys' in request.POST:
            values = _decode_array(request.POST['del_categorys'])
            for value in values:
                category_id = _decode_int(value)
                try:
                    category = spud.models.category.objects.get(pk=category_id)
                except spud.models.category.DoesNotExist:
                    raise HttpBadRequest("category does not exist")
                for photo in photo_list:
                    spud.models.photo_category.objects.filter(
                        photo=photo, category=category
                    ).delete()
                category_id = None
                category = None

        if 'set_persons' in request.POST:
            values = _decode_array(request.POST['set_albums'])
            values = [_decode_int(i) for i in values]
            pa_list = list(photo.photo_person_set.all())
            for photo in photo_list:
                for pa in pa_list:
                    if pa.person.pk in values:
                        values.remove(pa.person.pk)
                    else:
                        pa.delete()
                for pk in values:
                    pa = spud.models.photo_person.objects.create(
                        photo=photo, person_id=pk)
        if 'add_persons' in request.POST:
            values = _decode_array(request.POST['add_persons'])
            for value in values:
                person_id = _decode_int(value)
                try:
                    person = spud.models.person.objects.get(pk=person_id)
                except spud.models.person.DoesNotExist:
                    raise HttpBadRequest("person does not exist")
                for photo in photo_list:
                    spud.models.photo_person.objects.create(
                        photo=photo, person=person
                    )
                person_id = None
                person = None
        if 'del_persons' in request.POST:
            values = _decode_array(request.POST['del_persons'])
            for value in values:
                person_id = _decode_int(value)
                try:
                    person = spud.models.person.objects.get(pk=person_id)
                except spud.models.person.DoesNotExist:
                    raise HttpBadRequest("person does not exist")
                for photo in photo_list:
                    spud.models.photo_person.objects.filter(
                        photo=photo, person=person
                    ).delete()
                person_id = None
                person = None

    resp = {
        'criteria': criteria,
        'number_results': number_results,
        'session': _get_session(request),
        'can_add': request.user.has_perm('spud.add_photo'),
    }
    return HttpResponse(json.dumps(resp), mimetype="application/json")


def search_item(request, number):
    search_dict = request.GET.copy()
    number = _decode_int(number)

    photo_list, criteria = _get_search(request.user, search_dict)
    number_results = photo_list.count()

    try:
        photo = photo_list[number]
    except IndexError:
        raise HttpBadRequest("Result %d does not exist" % (number))

    resp = {
        'criteria': criteria,
        'photo': _get_photo_detail(request.user, photo),
        'number_results': number_results,
        'session': _get_session(request),
    }
    return HttpResponse(json.dumps(resp), mimetype="application/json")


def settings(request):
    resp = {
        'list_sizes': django.conf.settings.LIST_SIZES,
        'view_sizes': django.conf.settings.VIEW_SIZES,
        'click_sizes': django.conf.settings.CLICK_SIZES,
        'session': _get_session(request),
    }

    return HttpResponse(json.dumps(resp), mimetype="application/json")
