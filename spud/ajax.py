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

import json
import spud.models
import os.path
import pytz
import datetime
import re

import django.db.transaction
import django.conf
import django.contrib.auth
from django.shortcuts import get_object_or_404
from django.http import HttpResponse
from django.db.models import Q


def _decode_int(title, string):
    if string is None:
        return None
    try:
        return int(string)
    except ValueError:
        raise ErrorBadRequest("%s got non-integer" % title)


def _decode_boolean(title, string):
    if string is None:
        return None
    elif string.lower() == "true":
        return True
    elif string.lower() == "false":
        return False
    else:
        raise ErrorBadRequest("%s got non-boolean" % title)


def _decode_datetime(title, value, timezone):
    if value is None:
        return None

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
            offset = _decode_int(title, offset) * 60
        elif len(offset) == 4:
            offset = (
                _decode_int(title, offset[0:2]) * 60 +
                _decode_int(title, offset[2:4]))
        else:
            raise ErrorBadRequest("%s can't parse timezone" % title)
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
                raise ErrorBadRequest("%s unknown timezone" % title)
    value = " ".join(new_value)
    new_value = None

    dt = None

    if dt is None:
        try:
            dt = datetime.datetime.strptime(value, "%Y-%m-%d nextday")
            dt = dt + datetime.timedelta(days=1)
        except ValueError:
            pass

    if dt is None:
        try:
            dt = datetime.datetime.strptime(value, "%Y-%m-%d nextday")
            dt = dt + datetime.timedelta(days=1)
        except ValueError:
            pass

    if dt is None:
        try:
            dt = datetime.datetime.strptime(value, "%Y-%m-%d %H:%M:%S")
        except ValueError:
            pass

    if dt is None:
        try:
            dt = datetime.datetime.strptime(value, "%Y-%m-%d %H:%M")
        except ValueError:
            pass

    if dt is None:
        try:
            dt = datetime.datetime.strptime(value, "%Y-%m-%d")
        except ValueError:
            raise ErrorBadRequest("%s can't parse date/time", title)

    dt = timezone.localize(dt)
    return dt


def _decode_object(title, model, pk):
    if pk is None:
        return pk
    try:
        return model.objects.get(pk=pk)
    except model.DoesNotExist:
        raise ErrorBadRequest("%s does not exist" % title)


def _pop_string(params, key):
    value = params.pop(key, None)
    if value is None:
        return None
    if len(value) < 1:
        raise ErrorBadRequest("%s has <0 length")
    if len(value) > 1:
        raise ErrorBadRequest("%s has >1 length")
    return value[0]


def _pop_int(params, key):
    return _decode_int(key, _pop_string(params, key))


def _pop_object(params, key, model):
    return _decode_object(key, model, _pop_int(params, key))


def _pop_boolean(params, key):
    return _decode_boolean(key, _pop_string(params, key))


def _pop_datetime(params, key, timezone):
    return _decode_datetime(key, _pop_string(params, key), timezone)


def _pop_int_array(params, key):
    value = params.pop(key, None)
    if value is None:
        return None
    result = []
    for v in value:
        if v != "":
            v = [_decode_int(key, w) for w in v.split(".")]
            result.extend(v)
    return result


def _pop_object_array(params, key, model):
    value = params.pop(key, None)
    if value is None:
        return None
    result = []
    for v in value:
        if v != "":
            v = [_decode_object(key, model, w) for w in v.split(".")]
            result.extend(v)
    return result


def check_params_empty(params):
    if len(params) > 0:
        raise ErrorBadRequest("Unknown parameters %s" % params)


def _json_session(request):
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


def _json_photo(user, photo):
    if photo is None:
        return None

    resp = {
        'type': 'photo',
        'id': photo.photo_id,
        'title': unicode(photo),
#        'photographer': photo.photographer,
#        'place': photo.location,
        'view': photo.view,
        'rating': photo.rating,
        'description': photo.description,
        'localtime': _json_datetime(photo.datetime, photo.utc_offset),
        'utctime': _json_datetime(photo.datetime, 0),
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
#        'orig': photo.get_orig_url(),

        'can_add': user.has_perm('spud.add_photo'),
        'can_change': user.has_perm('spud.change_photo'),
        'can_delete': user.has_perm('spud.delete_photo'),
    }

    (shortname, _) = os.path.splitext(photo.name)

    for pt in photo.photo_thumb_set.all():
        resp['thumb'][pt.size] = {
            'width': pt.width,
            'height': pt.height,
            'url': pt.get_url(),
        }

    return resp


def _json_photo_detail(user, photo):
    if photo is None:
        return None

    resp = {
        'type': 'photo',
        'id': photo.photo_id,
        'title': unicode(photo),
        'name': photo.name,
        'photographer': _json_person(user, photo.photographer),
        'place': _json_place(user, photo.location),
        'view': photo.view,
        'rating': photo.rating,
        'description': photo.description,
        'localtime': _json_datetime(photo.datetime, photo.utc_offset),
        'utctime': _json_datetime(photo.datetime, 0),
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
        'albums': [_json_album(user, a) for a in photo.albums.all()],
        'categorys': [_json_category(user, c) for c in photo.categorys.all()],
        'persons': [
            _json_person(user, p) for p in
            photo.persons.order_by("photo_person__position").all()],
#        'relations': photo.relations,

        'thumb': {},

        'related': [],

        'can_add': user.has_perm('spud.add_photo'),
        'can_change': user.has_perm('spud.change_photo'),
        'can_delete': user.has_perm('spud.delete_photo'),

        'can_add_feedback': user.has_perm('spud.add_feedback'),
    }

    for pr in photo.relations_1.all():
        resp['related'].append({
            'id': pr.pk,
            'title': pr.desc_2,
            'photo': _json_photo(user, pr.photo_2),
        })

    for pr in photo.relations_2.all():
        resp['related'].append({
            'id': pr.pk,
            'title': pr.desc_1,
            'photo': _json_photo(user, pr.photo_1),
        })

    (shortname, _) = os.path.splitext(photo.name)

    for pt in photo.photo_thumb_set.all():
        resp['thumb'][pt.size] = {
            'width': pt.width,
            'height': pt.height,
            'url': pt.get_url(),
        }

    if user.is_staff:
        resp['orig'] = photo.get_orig_url()
        resp['comment'] = photo.comment

    return resp


def _json_album(user, album):
    if album is None:
        return None

    d = {
        'type': 'album',
        'id': album.album_id,
        'title': album.album,
        'description': album.album_description,
        'cover_photo': _json_photo(user, album.cover_photo),
        'sortname': album.sortname,
        'sortorder': album.sortorder,
        'revised': unicode(album.revised),
        'can_add': user.has_perm('spud.add_album'),
        'can_change': user.has_perm('spud.change_album'),
        'can_delete': user.has_perm('spud.delete_album'),
#        'parent_album': album.parent_album,
    }
    return d


def _json_album_detail(user, album):
    if album is None:
        return None

    d = {
        'type': 'album',
        'id': album.album_id,
        'title': album.album,
        'description': album.album_description,
        'cover_photo': _json_photo(user, album.cover_photo),
        'sortname': album.sortname,
        'sortorder': album.sortorder,
        'revised': unicode(album.revised),
        'parent': _json_album(user, album.parent_album),
        'ancestors': [],
        'can_add': user.has_perm('spud.add_album'),
        'can_change': user.has_perm('spud.change_album'),
        'can_delete': user.has_perm('spud.delete_album'),
#        'parent_album': _json_album(user, album.parent_album),
    }

    for ancestor in album.get_ascendants(include_self=False):
        d['ancestors'].insert(0, _json_album(user, ancestor))

    return d


def _json_category(user, category):
    if category is None:
        return None

    d = {
        'type': 'category',
        'id': category.category_id,
        'title': category.category,
        'description': category.category_description,
        'cover_photo': _json_photo(user, category.cover_photo),
        'sortname': category.sortname,
        'sortorder': category.sortorder,
        'can_add': user.has_perm('spud.add_category'),
        'can_change': user.has_perm('spud.change_category'),
        'can_delete': user.has_perm('spud.delete_category'),
#        'parent_category': category.parent_category,
    }
    return d


def _json_category_detail(user, category):
    if category is None:
        return None

    d = {
        'type': 'category',
        'id': category.category_id,
        'title': category.category,
        'description': category.category_description,
        'cover_photo': _json_photo(user, category.cover_photo),
        'sortname': category.sortname,
        'sortorder': category.sortorder,
        'parent': _json_category(user, category.parent_category),
        'ancestors': [],
        'can_add': user.has_perm('spud.add_category'),
        'can_change': user.has_perm('spud.change_category'),
        'can_delete': user.has_perm('spud.delete_category'),
#        'parent_category': category.parent_category,
    }

    for ancestor in category.get_ascendants(include_self=False):
        d['ancestors'].insert(0, _json_category(user, ancestor))

    return d


def _json_place(user, place):
    if place is None:
        return None

    d = {
        'type': 'place',
        'id': place.place_id,
        'title': place.title,
        'address': place.address,
        'address2': place.address2,
        'city': place.city,
        'state': place.state,
        'zip': place.zip,
        'country': place.country,
        'url': place.url,
        'urldesc': place.urldesc,
        'cover_photo': _json_photo(user, place.cover_photo),
        'notes': place.notes,
        'can_add': user.has_perm('spud.add_place'),
        'can_change': user.has_perm('spud.change_place'),
        'can_delete': user.has_perm('spud.delete_place'),
#        'parent': place.parent_place,
    }
    return d


def _json_place_detail(user, place):
    if place is None:
        return None

    d = {
        'type': 'place',
        'id': place.place_id,
        'parent': _json_place(user, place.parent_place),
        'ancestors': [],
        'title': place.title,
        'address': place.address,
        'address2': place.address2,
        'city': place.city,
        'state': place.state,
        'zip': place.zip,
        'country': place.country,
        'url': place.url,
        'urldesc': place.urldesc,
        'cover_photo': _json_photo(user, place.cover_photo),
        'notes': place.notes,
        'parents': [],
        'can_add': user.has_perm('spud.add_place'),
        'can_change': user.has_perm('spud.change_place'),
        'can_delete': user.has_perm('spud.delete_place'),
    }

    for ancestor in place.get_ascendants(include_self=False):
        d['ancestors'].insert(0, _json_place(user, ancestor))

    if user.is_staff:
        d.update({
            'work_of': [_json_person(user, p) for p in place.work_of.all()],
            'home_of': [_json_person(user, p) for p in place.home_of.all()],
        })
    return d


def _json_person(user, person):
    if person is None:
        return None

    d = {
        'type': 'person',
        'id': person.person_id,
        'title': unicode(person),
        'first_name': person.first_name,
        'last_name': person.last_name,
        'middle_name': person.middle_name,
        'called': person.called,
        'cover_photo': _json_photo(user, person.cover_photo),
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


def _json_person_detail(user, person):
    if person is None:
        return None

    d = {
        'type': 'person',
        'id': person.person_id,
        'title': unicode(person),
        'first_name': person.first_name,
        'last_name': person.last_name,
        'middle_name': person.middle_name,
        'called': person.called,
        'cover_photo': _json_photo(user, person.cover_photo),
        'can_add': user.has_perm('spud.add_person'),
        'can_change': user.has_perm('spud.change_person'),
        'can_delete': user.has_perm('spud.delete_person'),
    }

    if user.is_staff:
        d.update({
            'gender': person.gender,
            'dob': None,
            'dod': None,
            'home': _json_place(user, person.home),
            'work': _json_place(user, person.work),
            'father': _json_person(user, person.father),
            'mother': _json_person(user, person.mother),
            'spouses': [],
            'grandparents': [
                _json_person(user, p) for p in person.grandparents()],
            'uncles_aunts': [
                _json_person(user, p) for p in person.uncles_aunts()],
            'parents': [_json_person(user, p) for p in person.parents()],
            'siblings': [_json_person(user, p) for p in person.siblings()],
            'cousins': [_json_person(user, p) for p in person.cousins()],
            'children': [_json_person(user, p) for p in person.children()],
            'nephews_nieces': [
                _json_person(user, p) for p in person.nephews_nieces()],
            'grandchildren': [
                _json_person(user, p) for p in person.grandchildren()],
            'notes': person.notes,
            'email': person.email,
            'ancestors': None,
        })

        if person.dob:
            d['dob'] = unicode(person.dob)

        if person.dod:
            d['dod'] = unicode(person.dod)

        if person.spouse:
            d['spouses'].append(_json_person(user, person.spouse))

        for p in person.reverse_spouses.all():
            if person.spouse is None:
                d['spouses'].append(_json_person(user, p))
            elif p.person_id != person.spouse.person_id:
                d['spouses'].append(_json_person(user, p))

        for ancestor in feedback.get_ascendants(include_self=False):
            d['ancestors'].insert(0, _json_feedback(user, ancestor))

    return d


def _json_photo_relation_detail(user, photo_relation):
    if photo_relation is None:
        return None

    d = {
        'type': 'photo_relation',
        'id': photo_relation.pk,
        'photo_1': _json_photo(user, photo_relation.photo_1),
        'desc_1': photo_relation.desc_1,
        'photo_2': _json_photo(user, photo_relation.photo_2),
        'desc_2': photo_relation.desc_2,
    }
    return d


def _json_feedback(user, feedback, seen=None):
    if feedback is None:
        return None

    if seen is None:
        seen = set()

    if feedback.pk in seen:
        return None

    seen.add(feedback.pk)

    if not feedback.is_public and not user.is_staff:
        return None

    d = {
        'type': "feedback",
        'title': u"%s feedback" % unicode(feedback.photo),
        'id': feedback.pk,
        'is_public': feedback.is_public,
        'is_removed': feedback.is_removed,
        'can_add': user.has_perm('spud.add_feedback'),
        'can_change': user.has_perm('spud.change_feedback'),
        'can_delete': user.has_perm('spud.delete_feedback'),
        'can_moderate': user.is_staff,
    }

    if not feedback.is_removed or user.is_staff:
        d.update({
            'rating': feedback.rating,
            'comment': feedback.comment,
            'user': feedback.user.get_full_name(),
            'user_name': feedback.user_name,
            'user_email': feedback.user_email,
            'user_url': feedback.user_url,
            'submit_datetime': _json_datetime(
                feedback.submit_datetime, feedback.utc_offset),
            'children': [],
            'photo': _json_photo(user, feedback.photo),
        })

        for child in feedback.children.all():
            child_json = _json_feedback(user, child, seen)
            if json is not None:
                d['children'].append(child_json)
            del child_json
            del child

    if user.is_staff:
        d.update({
            'ip_address': feedback.ip_address,
        })

    return d


def _json_feedback_detail(user, feedback):
    d = _json_feedback(user, feedback)
    d.update({
        'parent': _json_feedback(user, feedback.parent),
        'ancestors': [],
    })

    for ancestor in feedback.get_ascendants(include_self=False):
        d['ancestors'].insert(0, _json_feedback(user, ancestor))
    return d


def _json_datetime(value, utc_offset):
    from_tz = pytz.utc
    to_tz = pytz.FixedOffset(utc_offset)
    to_offset = datetime.timedelta(minutes=utc_offset)

    local = from_tz.localize(value)
    local = (local + to_offset).replace(tzinfo=to_tz)

    if utc_offset < 0:
        tz_string = "-%02d%02d" % (-utc_offset/60, -utc_offset % 60)
#        object_id = "%s-%02d%02d" % (local.date(),
#                                     -utc_offset/60, -utc_offset % 60)
    else:
        tz_string = "+%02d%02d" % (utc_offset/60, utc_offset % 60)
#        object_id = "%s+%02d%02d" % (local.date(),
#                                     utc_offset/60, utc_offset % 60)

    return {
        'type': 'datetime',
        'title': u"%s %s %s" % (local.date(), local.time(), tz_string),
        'date': unicode(local.date()),
        'time': unicode(local.time()),
        'timezone': tz_string
    }


def _json_search(user, params):
    criteria = {}

    search = Q()
    photo_list = spud.models.photo.objects.all()

    pd = _pop_boolean(params, "person_descendants")
    if pd:
        criteria["person_descendants"] = True

    ld = _pop_boolean(params, "place_descendants")
    if ld:
        criteria["place_descendants"] = True

    ad = _pop_boolean(params, "album_descendants")
    if ad:
        criteria["album_descendants"] = True

    cd = _pop_boolean(params, "category_descendants")
    if cd:
        criteria["category_descendants"] = True

    timezone = django.conf.settings.TIME_ZONE
    timezone = pytz.timezone(timezone)

    value = _pop_string(params, "description")

    value = _pop_int(params, "first_id")
    if value is not None:
        criteria["first_id"] = value
        search = search & Q(pk__gte=value)

    value = _pop_int(params, "last_id")
    if value is not None:
        criteria["last_id"] = value
        search = search & Q(pk__lt=value)

    value = _pop_datetime(params, "first_date", timezone)
    if value is not None:
        utc_value = value.astimezone(pytz.utc).replace(tzinfo=none)
        criteria["first_date"] = _json_datetime(
            utc_value, value.utcoffset().total_seconds() / 60)
        search = search & Q(datetime__gte=utc_value)

    value = _pop_datetime(params, "last_date", timezone)
    if value is not None:
        utc_value = value.astimezone(pytz.utc).replace(tzinfo=None)
        criteria["last_date"] = _json_datetime(
            utc_value, value.utcoffset().total_seconds() / 60)
        search = search & Q(datetime__lt=utc_value)

    value = _pop_int(params, "lower_rating")
    if value is not None:
        criteria["lower_rating"] = value
        search = search & Q(rating__gte=value)

    value = _pop_int(params, "upper_rating")
    if value is not None:
        criteria["upper_rating"] = value
        search = search & Q(rating__lte=value)

    value = _pop_string(params, "title")
    if value is not None:
        criteria["title"] = value
        search = search & Q(title__icontains=value)

    value = _pop_string(params, "camera_make")
    if value is not None:
        criteria["camera_make"] = value
        search = search & Q(camera_make__icontains=value)

    value = _pop_string(params, "camera_model")
    if value is not None:
        criteria["camera_model"] = value
        search = search & Q(camera_model__icontains=value)

    value = _pop_object(params, "photographer", spud.models.person)
    if value is not None:
        criteria["photographer"] = _json_person(user, value)
        search = search & Q(photographer=value)

    value = _pop_object(params, "place", spud.models.place)
    if value is not None:
        criteria["place"] = _json_place(user, value)
        if ld:
            search = search & Q(location__ascendant_set__ascendant=value)
        else:
            search = search & Q(location=value)

    del value

    values = _pop_object_array(params, "persons", spud.models.person)
    if values is not None:
        criteria["person"] = []
        for value in values:
            criteria["person"].append(_json_person(user, value))
            if pd:
                photo_list = photo_list.filter(
                    persons__ascendant_set__ascendant=value)
            else:
                photo_list = photo_list.filter(persons=value)

    values = _pop_object_array(params, "albums", spud.models.album)
    if values is not None:
        criteria["album"] = []
        for value in values:
            criteria["album"].append(_json_album(user, value))
            if ad:
                photo_list = photo_list.filter(
                    albums__ascendant_set__ascendant=value)
            else:
                photo_list = photo_list.filter(albums=value)

    values = _pop_object_array(params, "categorys", spud.models.category)
    if values is not None:
        criteria["category"] = []
        for value in values:
            criteria["category"].append(_json_category(user, value))
            if cd:
                photo_list = photo_list.filter(
                    categorys__ascendant_set__ascendant=value)
            else:
                photo_list = photo_list.filter(categorys=value)

    values = _pop_object_array(params, "photos", spud.models.photo)
    if values is not None:
        criteria["photos"] = []
        q = Q()
        for value in values:
            criteria["photos"].append(_json_photo(user, value))
            q = q | Q(pk=value.pk)
        photo_list = photo_list.filter(q)

    del values

    value = _pop_boolean(params, "place_none")
    if value is not None:
        if value:
            criteria["place_none"] = True
            search = search & Q(location=None)

    value = _pop_boolean(params, "person_none")
    if value is not None:
        if value:
            criteria["person_none"] = True
            search = search & Q(persons=None)

    value = _pop_boolean(params, "album_none")
    if value is not None:
        if value:
            criteria["album_none"] = True
            search = search & Q(albums=None)

    value = _pop_boolean(params, "category_none")
    if value is not None:
        if value:
            criteria["category_none"] = True
            search = search & Q(categorys=None)

    value = _pop_string(params, "action")
    if value is not None:
        if value == "none":
            search = search & Q(action__isnull=True)
        else:
            search = search & Q(action=value)
        value = spud.models.action_to_string(value)
        criteria["action"] = value

    value = _pop_string(params, "path")
    if value is not None:
        criteria["path"] = value
        search = search & Q(path=value)

    value = _pop_string(params, "name")
    if value is not None:
        criteria["name"] = value
        search = search & Q(name=value)

    photo_list = photo_list.filter(search)
    return photo_list, criteria


# These errors are due to bad input from user. These
# are expected and don't require rollback.
class ErrorUser(Exception):
    pass


# These errors should not occur and are due to bad parameters from the client
class ErrorBadRequest(Exception):
    pass


# User tried to access something they are not allowed to. Should never
# occur under normal usage
class ErrorForbidden(Exception):
    pass


# Check if one of the above errors occured and give appropriate JSON
# response
def check_errors(func):
    def wrapper(request, *args, **kwargs):
        try:
            return func(request, *args, **kwargs)
        except ErrorUser, e:
            resp = {
                'type': 'error',
                'message': unicode(e),
                'session': _json_session(request),
            }
            return HttpResponse(json.dumps(resp), mimetype="application/json")
        except ErrorBadRequest, e:
            django.db.transaction.rollback()
            resp = {
                'type': 'error',
                'message': "Bad request: " + unicode(e),
                'session': _json_session(request),
            }
            return HttpResponse(json.dumps(resp), mimetype="application/json")
        except ErrorForbidden, e:
            django.db.transaction.rollback()
            resp = {
                'type': 'error',
                'message': "Access Forbidden: " + unicode(e),
                'session': _json_session(request),
            }
            return HttpResponse(json.dumps(resp), mimetype="application/json")
    return wrapper


@check_errors
def login(request):
    if request.method != "POST":
        raise ErrorBadRequest("Only POST is supported")

    params = request.POST.copy()
    _pop_string(params, "_")

    username = _pop_string(params, "username")
    password = _pop_string(params, "password")

    if username is None:
        raise ErrorBadRequest("username not supplied")
    if password is None:
        raise ErrorBadRequest("password not supplied")

    user = django.contrib.auth.authenticate(
        username=username, password=password)
    if user is not None:
        if user.is_active:
            django.contrib.auth.login(request, user)
            resp = {'type': 'login'}
        else:
            raise ErrorUser("Account is disabled")
    else:
        raise ErrorUser("Invalid login")
    resp['session'] = _json_session(request)
    return HttpResponse(json.dumps(resp), mimetype="application/json")


@check_errors
def logout(request):
    if request.method != "POST":
        raise ErrorBadRequest("Only POST is supported")
    django.contrib.auth.logout(request)
    resp = {'type': 'logout'}
    resp['session'] = _json_session(request)
    return HttpResponse(json.dumps(resp), mimetype="application/json")


@check_errors
def album_search_form(request):
    criteria = {}
    params = request.GET.copy()
    _pop_string(params, "_")

    q = _pop_string(params, "q")
    if q is not None:
        criteria['q'] = q

    mode = _pop_string(params, "mode")
    if mode is not None:
        mode = mode.lower()
        criteria['mode'] = mode

    instance = _pop_object(params, "instance", spud.models.album)
    if instance is not None:
        criteria['instance'] = _json_album(request.user, instance)

    root_only = _pop_boolean(params, "root_only")
    if root_only:
        criteria["root_only"] = True

    check_params_empty(params)

    resp = {
        'type': 'album_search_form',
        'criteria': criteria,
        'can_add': request.user.has_perm('spud.add_album'),
        'session': _json_session(request),
    }
    return HttpResponse(json.dumps(resp), mimetype="application/json")


@check_errors
def album_search_results(request):
    params = request.GET.copy()
    _pop_string(params, "_")

    first = _pop_int(params, "first")
    if first is None:
        raise ErrorBadRequest("first is not specified")
    if first < 0:
        raise ErrorBadRequest("first is negative")

    count = _pop_int(params, "count")
    if count is None:
        raise ErrorBadRequest("count is not specified")
    if count < 0:
        raise ErrorBadRequest("count is negative")

    album_list = spud.models.album.objects.all()
    criteria = {}

    q = _pop_string(params, "q")
    if q is not None:
        album_list = album_list.filter(
            Q(album__icontains=q) | Q(album_description__icontains=q))
        criteria['q'] = q

    mode = _pop_string(params, "mode")
    if mode is not None:
        mode = mode.lower()
        criteria['mode'] = mode

    instance = _pop_object(params, "instance", spud.models.album)
    if instance is not None:
        criteria['instance'] = _json_album(request.user, instance)
        if mode == "children":
            album_list = album_list.filter(parent_album=instance)
        elif mode == "ascendants":
            album_list = album_list.filter(
                descendant_set__descendant=instance,
                descendant_set__position__gt=0)
        elif mode == "descendants":
            album_list = album_list.filter(
                ascendant_set__ascendant=instance,
                ascendant_set__position__gt=0)
        else:
            ErrorBadRequest("Unknown search mode")

    root_only = _pop_boolean(params, "root_only")
    if root_only:
        album_list = album_list.filter(parent_album=None)
        criteria["root_only"] = True

    check_params_empty(params)

    number_results = album_list.count()
    album_list = album_list[first:first+count]
    number_returned = len(album_list)

    resp = {
        'type': 'album_search_results',
        'criteria': criteria,
        'albums': [_json_album(request.user, p) for p in album_list],
        'number_results': number_results,
        'first': first,
        'last': first + number_returned - 1,
        'session': _json_session(request),
        'can_add': request.user.has_perm('spud.add_album'),
    }
    return HttpResponse(json.dumps(resp), mimetype="application/json")


@check_errors
def album(request, album_id):
    if request.method == "POST":
        if not request.user.has_perm('spud.change_album'):
            raise ErrorForbidden("No rights to change albums")
    album = get_object_or_404(spud.models.album, pk=album_id)
    return album_finish(request, album)


@check_errors
def album_add(request):
    if request.method != "POST":
        raise ErrorBadRequest("Only POST is supported")
    if request.method == "POST":
        if not request.user.has_perm('spud.add_album'):
            raise ErrorForbidden("No rights to add albums")
    album = spud.models.album()
    return album_finish(request, album)


@check_errors
def album_delete(request, album_id):
    if request.method != "POST":
        raise ErrorBadRequest("Only POST is supported")
    if not request.user.has_perm('spud.delete_album'):
        raise ErrorForbidden("No rights to delete albums")
    album = get_object_or_404(spud.models.album, pk=album_id)

    errors = album.check_delete()
    if len(errors) > 0:
        raise ErrorBadRequest(", ".join(errors))

    album.delete()

    resp = {
        'type': 'album_delete',
        'session': _json_session(request),
    }
    return HttpResponse(json.dumps(resp), mimetype="application/json")


def album_finish(request, album):
    if request.method == "POST":
        params = request.POST.copy()
        _pop_string(params, "_")

        updated = False
        updated_parent = False

        value = _pop_string(params, "title")
        if value is not None:
            album.album = value
            updated = True

        value = _pop_string(params, "description")
        if value is not None:
            album.album_description = value
            updated = True

        value = _pop_string(params, "cover_photo")
        if value is not None:
            if value == "":
                album.cover_photo = None
            else:
                value = _decode_object("cover_photo", spud.models.photo, value)
                album.cover_photo = value
            updated = True

        value = _pop_string(params, "sortname")
        if value is not None:
            album.sortname = value
            updated = True

        value = _pop_string(params, "sortorder")
        if value is not None:
            album.sortorder = value
            updated = True

        value = _pop_string(params, "parent")
        if value is not None:
            if value == "":
                album.parent_album = None
            else:
                value = _decode_object("parent", spud.models.album, value)
                album.parent_album = value
            updated = True
            updated_parent = True

        check_params_empty(params)

        if updated:
            album.save()

        if updated_parent:
            album.fix_ascendants()

    resp = {
        'type': 'album_get',
        'album': _json_album_detail(request.user, album),
        'session': _json_session(request),
    }
    return HttpResponse(json.dumps(resp), mimetype="application/json")


@check_errors
def category_search_form(request):
    criteria = {}
    params = request.GET.copy()
    _pop_string(params, "_")

    q = _pop_string(params, "q")
    if q is not None:
        criteria['q'] = q

    mode = _pop_string(params, "mode")
    if mode is not None:
        mode = mode.lower()
        criteria['mode'] = mode

    instance = _pop_object(params, "instance", spud.models.category)
    if instance is not None:
        criteria['instance'] = _json_category(request.user, instance)

    root_only = _pop_boolean(params, "root_only")
    if root_only:
        criteria["root_only"] = True

    check_params_empty(params)

    resp = {
        'type': 'category_search_form',
        'criteria': criteria,
        'can_add': request.user.has_perm('spud.add_category'),
        'session': _json_session(request),
    }
    return HttpResponse(json.dumps(resp), mimetype="application/json")


@check_errors
def category_search_results(request):
    params = request.GET.copy()
    _pop_string(params, "_")

    first = _pop_int(params, "first")
    if first is None:
        raise ErrorBadRequest("first is not specified")
    if first < 0:
        raise ErrorBadRequest("first is negative")

    count = _pop_int(params, "count")
    if count is None:
        raise ErrorBadRequest("count is not specified")
    if count < 0:
        raise ErrorBadRequest("count is negative")

    category_list = spud.models.category.objects.all()
    criteria = {}

    q = _pop_string(params, "q")
    if q is not None:
        category_list = category_list.filter(
            Q(category__icontains=q) | Q(category_description__icontains=q))
        criteria['q'] = q

    mode = _pop_string(params, "mode")
    if mode is not None:
        mode = mode.lower()
        criteria['mode'] = mode

    instance = _pop_object(params, "instance", spud.models.category)
    if instance is not None:
        criteria['instance'] = _json_category(request.user, instance)
        if mode == "children":
            category_list = category_list.filter(parent_category=instance)
        elif mode == "ascendants":
            category_list = category_list.filter(
                descendant_set__descendant=instance,
                descendant_set__position__gt=0)
        elif mode == "descendants":
            category_list = category_list.filter(
                ascendant_set__ascendant=instance,
                ascendant_set__position__gt=0)
        else:
            ErrorBadRequest("Unknown search mode")

    root_only = _pop_boolean(params, "root_only")
    if root_only:
        category_list = category_list.filter(parent_category=None)
        criteria["root_only"] = True

    check_params_empty(params)

    number_results = category_list.count()
    category_list = category_list[first:first+count]
    number_returned = len(category_list)

    resp = {
        'type': 'category_search_results',
        'criteria': criteria,
        'categorys': [_json_category(request.user, p) for p in category_list],
        'number_results': number_results,
        'first': first,
        'last': first + number_returned - 1,
        'session': _json_session(request),
        'can_add': request.user.has_perm('spud.add_category'),
    }
    return HttpResponse(json.dumps(resp), mimetype="application/json")


@check_errors
def category(request, category_id):
    if request.method == "POST":
        if not request.user.has_perm('spud.change_category'):
            raise ErrorForbidden("No rights to change categorys")
    category = get_object_or_404(spud.models.category, pk=category_id)
    return category_finish(request, category)


@check_errors
def category_add(request):
    if request.method != "POST":
        raise ErrorBadRequest("Only POST is supported")
    if request.method == "POST":
        if not request.user.has_perm('spud.add_category'):
            raise ErrorForbidden("No rights to add categorys")
    category = spud.models.category()
    return category_finish(request, category)


@check_errors
def category_delete(request, category_id):
    if request.method != "POST":
        raise ErrorBadRequest("Only POST is supported")
    if not request.user.has_perm('spud.delete_category'):
        raise ErrorForbidden("No rights to delete categorys")
    category = get_object_or_404(spud.models.category, pk=category_id)

    errors = category.check_delete()
    if len(errors) > 0:
        raise ErrorBadRequest(", ".join(errors))

    category.delete()

    resp = {
        'type': 'category_delete',
        'session': _json_session(request),
    }

    return HttpResponse(json.dumps(resp), mimetype="application/json")


def category_finish(request, category):
    if request.method == "POST":
        params = request.POST.copy()
        _pop_string(params, "_")

        updated = False
        updated_parent = False

        value = _pop_string(params, "title")
        if value is None:
            category.category = value
            updated = True

        value = _pop_string(params, "description")
        if value is not None:
            category.category_description = value
            updated = True

        value = _pop_string(params, "cover_photo")
        if value is not None:
            if value == "":
                category.cover_photo = None
            else:
                value = _decode_object("cover_photo", spud.models.photo, value)
                category.cover_photo = value
            updated = True

        value = _pop_string(params, "sortname")
        if value is not None:
            category.sortname = value
            updated = True

        value = _pop_string(params, "sortorder")
        if value is not None:
            category.sortorder = value
            updated = True

        value = _pop_string(params, "parent")
        if 'parent' in request.POST:
            if request.POST['parent'] == "":
                category.parent_category = None
            else:
                value = _decode_object("parent", spud.models.category, value)
                category.parent_category = value
            updated = True
            updated_parent = True

        check_params_empty(params)

        if updated is not None:
            category.save()

        if updated_parent:
            category.fix_ascendants()

    resp = {
        'type': 'category_get',
        'category': _json_category_detail(request.user, category),
        'session': _json_session(request),
    }
    return HttpResponse(json.dumps(resp), mimetype="application/json")


@check_errors
def place_search_form(request):
    criteria = {}
    params = request.GET.copy()
    _pop_string(params, "_")

    q = _pop_string(params, "q")
    if q is not None:
        criteria['q'] = q

    mode = _pop_string(params, "mode")
    if mode is not None:
        mode = mode.lower()
        criteria['mode'] = mode

    instance = _pop_object(params, "instance", spud.models.place)
    if instance is not None:
        criteria['instance'] = _json_place(request.user, instance)

    root_only = _pop_boolean(params, "root_only")
    if root_only:
        criteria["root_only"] = True

    check_params_empty(params)

    resp = {
        'type': 'place_search_form',
        'criteria': criteria,
        'can_add': request.user.has_perm('spud.add_place'),
        'session': _json_session(request),
    }
    return HttpResponse(json.dumps(resp), mimetype="application/json")


@check_errors
def place_search_results(request):
    params = request.GET.copy()
    _pop_string(params, "_")

    first = _pop_int(params, "first")
    if first is None:
        raise ErrorBadRequest("first is not specified")
    if first < 0:
        raise ErrorBadRequest("first is negative")

    count = _pop_int(params, "count")
    if count is None:
        raise ErrorBadRequest("count is not specified")
    if count < 0:
        raise ErrorBadRequest("count is negative")

    place_list = spud.models.place.objects.all()
    criteria = {}

    q = _pop_string(params, "q")
    if q is not None:
        place_list = place_list.filter(
            Q(title__icontains=q) | Q(address__icontains=q))
        criteria['q'] = q

    mode = _pop_string(params, "mode")
    if mode is not None:
        mode = mode.lower()
        criteria['mode'] = mode

    instance = _pop_object(params, "instance", spud.models.place)
    if instance is not None:
        criteria['instance'] = _json_place(request.user, instance)
        if mode == "children":
            place_list = place_list.filter(parent_place=instance)
        elif mode == "ascendants":
            place_list = place_list.filter(
                descendant_set__descendant=instance,
                descendant_set__position__gt=0)
        elif mode == "descendants":
            place_list = place_list.filter(
                ascendant_set__ascendant=instance,
                ascendant_set__position__gt=0)
        else:
            ErrorBadRequest("Unknown search mode")

    root_only = _pop_boolean(params, "root_only")
    if root_only:
        place_list = place_list.filter(parent_place=None)
        criteria["root_only"] = True

    check_params_empty(params)

    number_results = place_list.count()
    place_list = place_list[first:first+count]
    number_returned = len(place_list)

    resp = {
        'type': 'place_search_results',
        'criteria': criteria,
        'places': [_json_place(request.user, p) for p in place_list],
        'number_results': number_results,
        'first': first,
        'last': first + number_returned - 1,
        'session': _json_session(request),
        'can_add': request.user.has_perm('spud.add_place'),
    }
    return HttpResponse(json.dumps(resp), mimetype="application/json")


@check_errors
def place(request, place_id):
    if request.method == "POST":
        if not request.user.has_perm('spud.change_place'):
            raise ErrorForbidden("No rights to change places")
    place = get_object_or_404(spud.models.place, pk=place_id)
    return place_finish(request, place)


@check_errors
def place_add(request):
    if request.method != "POST":
        raise ErrorBadRequest("Only POST is supported")
    if request.method == "POST":
        if not request.user.has_perm('spud.add_place'):
            raise ErrorForbidden("No rights to add places")
    place = spud.models.place()
    return place_finish(request, place)


@check_errors
def place_delete(request, place_id):
    if request.method != "POST":
        raise ErrorBadRequest("Only POST is supported")
    if not request.user.has_perm('spud.delete_place'):
        raise ErrorForbidden("No rights to delete places")
    place = get_object_or_404(spud.models.place, pk=place_id)

    errors = place.check_delete()
    if len(errors) > 0:
        raise ErrorBadRequest(", ".join(errors))

    place.delete()

    resp = {
        'type': 'place_delete',
        'session': _json_session(request),
    }
    return HttpResponse(json.dumps(resp), mimetype="application/json")


def place_finish(request, place):
    if request.method == "POST":
        params = request.POST.copy()
        _pop_string(params, "_")

        updated = False
        updated_parent = False

        value = _pop_string(params, "title")
        if value is not None:
            place.title = value
            updated = True

        value = _pop_string(params, "address")
        if value is not None:
            place.address = value
            updated = True

        value = _pop_string(params, "address2")
        if value is not None:
            place.address2 = value
            updated = True

        value = _pop_string(params, "city")
        if value is not None:
            place.city = value
            updated = True

        value = _pop_string(params, "state")
        if value is not None:
            place.state = value
            updated = True

        value = _pop_string(params, "zip")
        if value is not None:
            place.zip = value
            updated = True

        value = _pop_string(params, "country")
        if value is not None:
            place.country = value
            updated = True

        value = _pop_string(params, "url")
        if value is not None:
            place.url = value
            updated = True

        value = _pop_string(params, "urldesc")
        if value is not None:
            place.urldesc = value
            updated = True

        value = _pop_string(params, "notes")
        if value is not None:
            place.notes = value
            updated = True

        value = _pop_string(params, "cover_photo")
        if value is not None:
            if value == "":
                place.cover_photo = None
            else:
                value = _decode_object("cover_photo", spud.models.photo, value)
                place.cover_photo = value
            updated = True

        value = _pop_string(params, "parent")
        if value is not None:
            if value == "":
                place.parent_place = None
            else:
                value = _decode_object("parent", spud.models.place, value)
                place.parent_place = value
            updated = True
            updated_parent = True

        check_params_empty(params)

        if updated:
            place.save()

        if updated_parent:
            place.fix_ascendants()

    resp = {
        'type': 'place_get',
        'place': _json_place_detail(request.user, place),
        'session': _json_session(request),
    }
    return HttpResponse(json.dumps(resp), mimetype="application/json")


@check_errors
def person_search_form(request):
    criteria = {}
    params = request.GET.copy()
    _pop_string(params, "_")

    q = _pop_string(params, "q")
    if q is not None:
        criteria['q'] = q

    mode = _pop_string(params, "mode")
    if mode is not None:
        mode = mode.lower()
        criteria['mode'] = mode

    instance = _pop_object(params, "instance", spud.models.person)
    if instance is not None:
        criteria['instance'] = _json_person(request.user, instance)

    root_only = _pop_boolean(params, "root_only")
    if root_only:
        criteria["root_only"] = True

    check_params_empty(params)

    resp = {
        'type': 'person_search_form',
        'criteria': criteria,
        'can_add': request.user.has_perm('spud.add_person'),
        'session': _json_session(request),
    }
    return HttpResponse(json.dumps(resp), mimetype="application/json")


@check_errors
def person_search_results(request):
    params = request.GET.copy()
    _pop_string(params, "_")

    first = _pop_int(params, "first")
    if first is None:
        raise ErrorBadRequest("first is not specified")
    if first < 0:
        raise ErrorBadRequest("first is negative")

    count = _pop_int(params, "count")
    if count is None:
        raise ErrorBadRequest("count is not specified")
    if count < 0:
        raise ErrorBadRequest("count is negative")

    person_list = spud.models.person.objects.all()
    criteria = {}

    q = _pop_string(params, "q")
    if q is not None:
        person_list = person_list.filter(
            Q(first_name__icontains=q) | Q(last_name__icontains=q) |
            Q(middle_name__icontains=q) | Q(called__icontains=q))
        criteria['q'] = q

    mode = _pop_string(params, "mode")
    if mode is not None:
        mode = mode.lower()
        criteria['mode'] = mode

    instance = _pop_object(params, "instance", spud.models.person)
    if instance is not None:
        criteria['instance'] = _json_person(request.user, instance)
        if mode == "children":
            person_list = person_list.filter(
                Q(mother=instance) | Q(father=instance))
        elif mode == "ascendants":
            person_list = person_list.filter(
                descendant_set__descendant=instance,
                descendant_set__position__gt=0)
            person_list = person_list.order_by(
                'descendant_set__position')
        elif mode == "descendants":
            person_list = person_list.filter(
                ascendant_set__ascendant=instance,
                ascendant_set__position__gt=0)
            person_list = person_list.order_by(
                'ascendant_set__position')
        else:
            ErrorBadRequest("Unknown search mode")

    root_only = _pop_boolean(params, "root_only")
    if root_only:
        person_list = person_list.filter(mother=None, father=None)
        criteria["root_only"] = True

    check_params_empty(params)

    number_results = person_list.count()
    person_list = person_list[first:first+count]
    number_returned = len(person_list)

    resp = {
        'type': 'person_search_results',
        'criteria': criteria,
        'persons': [_json_person(request.user, p) for p in person_list],
        'number_results': number_results,
        'first': first,
        'last': first + number_returned - 1,
        'session': _json_session(request),
        'can_add': request.user.has_perm('spud.add_person'),
    }
    return HttpResponse(json.dumps(resp), mimetype="application/json")


@check_errors
def person(request, person_id):
    if request.method == "POST":
        if not request.user.has_perm('spud.change_person'):
            raise ErrorForbidden("No rights to change persons")
    person = get_object_or_404(spud.models.person, pk=person_id)
    return person_finish(request, person)


@check_errors
def person_add(request):
    if request.method != "POST":
        raise ErrorBadRequest("Only POST is supported")
    if request.method == "POST":
        if not request.user.has_perm('spud.add_person'):
            raise ErrorForbidden("No rights to add persons")
    person = spud.models.person()
    return person_finish(request, person)


@check_errors
def person_delete(request, person_id):
    if request.method != "POST":
        raise ErrorBadRequest("Only POST is supported")
    if not request.user.has_perm('spud.delete_person'):
        raise ErrorForbidden("No rights to delete persons")
    person = get_object_or_404(spud.models.person, pk=person_id)

    errors = person.check_delete()
    if len(errors) > 0:
        raise ErrorBadRequest(", ".join(errors))

    person.delete()

    resp = {
        'type': 'person_delete',
        'session': _json_session(request),
    }
    return HttpResponse(json.dumps(resp), mimetype="application/json")


def person_finish(request, person):
    if request.method == "POST":
        params = request.POST.copy()
        _pop_string(params, "_")

        updated = False
        updated_parent = False

        value = _pop_string(params, "first_name")
        if value is not None:
            person.first_name = value
            updated = True

        value = _pop_string(params, "middle_name")
        if value is not None:
            person.middle_name = value
            updated = True

        value = _pop_string(params, "last_name")
        if value is not None:
            person.last_name = value
            updated = True

        value = _pop_string(params, "called")
        if value is not None:
            person.called = value
            updated = True

        value = _pop_string(params, "gender")
        if value is not None:
            if not request.user.is_staff:
                raise ErrorForbidden("No rights to change gender")
            if value != "1" and value != "2":
                raise ErrorBadRequest("Unknown gender")
            person.gender = value
            updated = True

        value = _pop_string(params, "notes")
        if value is not None:
            if not request.user.is_staff:
                raise ErrorForbidden("No rights to change notes")
            person.notes = value
            updated = True

        value = _pop_string(params, "email")
        if value is not None:
            if not request.user.is_staff:
                raise ErrorForbidden("No rights to change email")
            person.email = value
            updated = True

        value = _pop_string(params, "dob")
        if value is not None:
            if not request.user.is_staff:
                raise ErrorForbidden("No rights to change dob")
            if value == "":
                person.dob = None
            else:
                if not re.match("\d\d\d\d-\d\d-\d\d", value):
                    raise ErrorBadRequest("dob needs to be yyyy-mm-dd")
                person.dob = value
            updated = True

        value = _pop_string(params, "dod")
        if value is not None:
            if not request.user.is_staff:
                raise ErrorForbidden("No rights to change dod")
            if value == "":
                person.dod = None
            else:
                if not re.match("\d\d\d\d-\d\d-\d\d", value):
                    raise ErrorBadRequest("dod needs to be yyyy-mm-dd")
                person.dod = value
            updated = True

        value = _pop_string(params, "cover_photo")
        if value is not None:
            if value == "":
                person.cover_photo = None
            else:
                value = _decode_object("cover_photo", spud.models.photo, value)
                person.cover_photo = value
            updated = True

        value = _pop_string(params, "work")
        if value is not None:
            if not request.user.is_staff:
                raise ErrorForbidden("No rights to change work")
            if value == "":
                person.work = None
            else:
                value = _decode_object("work",  spud.models.place, value)
                person.work = value
            updated = True

        value = _pop_string(params, "home")
        if value is not None:
            if not request.user.is_staff:
                raise ErrorForbidden("No rights to change home")
            if value == "":
                person.home = None
            else:
                value = _decode_object("home", spud.models.place, value)
                person.home = value
            updated = True

        value = _pop_string(params, "mother")
        if value is not None:
            if not request.user.is_staff:
                raise ErrorForbidden("No rights to change mother")
            if value == "":
                person.mother = None
            else:
                value = _decode_object("mother", spud.models.person, value)
                person.mother = value
            updated = True
            updated_parent = True

        value = _pop_string(params, "father")
        if value is not None:
            if not request.user.is_staff:
                raise ErrorForbidden("No rights to change father")
            if value == "":
                person.father = None
            else:
                value = _decode_object("father", spud.models.person, value)
                person.father = value
            updated = True
            updated_parent = True

        value = _pop_string(params, "spouse")
        if value is not None:
            if not request.user.is_staff:
                raise ErrorForbidden("No rights to change spouse")
            if value == "":
                person.spouse = None
            else:
                value = _decode_object("spouse", spud.models.person, value)
                person.spouse = value
            updated = True

        check_params_empty(params)

        if updated:
            person.save()

        if updated_parent:
            person.fix_ascendants()

    resp = {
        'type': 'person_get',
        'person': _json_person_detail(request.user, person),
        'session': _json_session(request),
    }
    return HttpResponse(json.dumps(resp), mimetype="application/json")


@check_errors
def photo_relation(request, photo_relation_id):
    if request.method == "POST":
        if not request.user.has_perm('spud.change_relation'):
            raise ErrorForbidden("No rights to change photo_relations")
    photo_relation = get_object_or_404(
        spud.models.photo_relation, pk=photo_relation_id)
    return photo_relation_finish(request, photo_relation)


@check_errors
def photo_relation_add(request):
    if request.method != "POST":
        raise ErrorBadRequest("Only POST is supported")
    if request.method == "POST":
        if not request.user.has_perm('spud.add_relation'):
            raise ErrorForbidden("No rights to add photo_relations")

    if 'photo_1' not in request.POST:
        raise ErrorBadRequest("photo_1 must be given")
    if 'photo_2' not in request.POST:
        raise ErrorBadRequest("photo_2 must be given")
    if 'desc_1' not in request.POST:
        raise ErrorBadRequest("desc_1 must be given")
    if 'desc_2' not in request.POST:
        raise ErrorBadRequest("desc_2 must be given")

    photo_relation = spud.models.photo_relation()
    return photo_relation_finish(request, photo_relation)


@check_errors
def photo_relation_delete(request, photo_relation_id):
    if request.method != "POST":
        raise ErrorBadRequest("Only POST is supported")
    if not request.user.has_perm('spud.delete_relation'):
        raise ErrorForbidden("No rights to delete photo_relations")
    photo_relation = get_object_or_404(
        spud.models.photo_relation, pk=photo_relation_id)

    errors = photo_relation.check_delete()
    if len(errors) > 0:
        raise ErrorBadRequest(", ".join(errors))

    photo_relation.delete()

    resp = {
        'type': 'photo_relation_delete',
        'session': _json_session(request),
    }

    return HttpResponse(json.dumps(resp), mimetype="application/json")


def photo_relation_finish(request, photo_relation):
    if request.method == "POST":
        params = request.POST.copy()
        _pop_string(params, "_")

        updated = False

        value = _pop_string(params, "desc_1")
        if value is not None:
            if value == "":
                raise ErrorBadRequest("desc_1 must be non-empty")
            photo_relation.desc_1 = value
            updated = True

        value = _pop_string(params, "desc_2")
        if value is not None:
            if value == "":
                raise ErrorBadRequest("desc_2 must be non-empty")
            photo_relation.desc_2 = value
            updated = True

        value = _pop_string(params, "photo_1")
        if value is not None:
            if value == "":
                raise ErrorBadRequest("photo_1 must be non-empty")
            value = _decode_object("photo_1", spud.models.photo, value)
            photo_relation.photo_1 = value
            updated = True

        value = _pop_string(params, "photo_2")
        if value is not None:
            if value == "":
                raise ErrorBadRequest("photo_2 must be non-empty")
            value = _decode_object("photo_2", spud.models.photo, value)
            photo_relation.photo_2 = value
            updated = True

        check_params_empty(params)

        if updated:
            photo_relation.save()

    resp = {
        'type': 'photo_relation_get',
        'photo_relation': _json_photo_relation_detail(request.user,
                                                      photo_relation),
        'session': _json_session(request),
    }
    return HttpResponse(json.dumps(resp), mimetype="application/json")


@check_errors
def feedback_search_form(request):
    criteria = {}
    params = request.GET.copy()
    _pop_string(params, "_")

    q = _pop_string(params, "q")
    if q is not None:
        criteria['q'] = q

    mode = _pop_string(params, "mode")
    if mode is not None:
        mode = mode.lower()
        criteria['mode'] = mode

    instance = _pop_object(params, "instance", spud.models.feedback)
    if instance is not None:
        criteria['instance'] = _json_feedback(request.user, instance)

    instance = _pop_object(params, "photo", spud.models.photo)
    if instance is not None:
        criteria['photo'] = _json_photo(request.user, instance)

    root_only = _pop_boolean(params, "root_only")
    if root_only:
        criteria["root_only"] = True

    if request.user.is_staff:
        value = _pop_boolean(params, "is_public")
        if value is not None:
            criteria["is_public"] = value

        value = _pop_boolean(params, "is_removed")
        if value is not None:
            criteria["is_removed"] = value

    check_params_empty(params)

    resp = {
        'type': 'feedback_search_form',
        'criteria': criteria,
        'session': _json_session(request),

        'can_add': request.user.has_perm('spud.add_feedback'),
        'can_moderate': request.user.is_staff,
    }
    return HttpResponse(json.dumps(resp), mimetype="application/json")


@check_errors
def feedback_search_results(request):
    params = request.GET.copy()
    _pop_string(params, "_")

    first = _pop_int(params, "first")
    if first is None:
        raise ErrorBadRequest("first is not specified")
    if first < 0:
        raise ErrorBadRequest("first is negative")

    count = _pop_int(params, "count")
    if count is None:
        raise ErrorBadRequest("count is not specified")
    if count < 0:
        raise ErrorBadRequest("count is negative")

    feedback_list = spud.models.feedback.objects.all()
    criteria = {}

    q = _pop_string(params, "q")
    if q is not None:
        feedback_list = feedback_list.filter(
            Q(title__icontains=q) | Q(address__icontains=q))
        criteria['q'] = q

    mode = _pop_string(params, "mode")
    if mode is not None:
        mode = mode.lower()
        criteria['mode'] = mode

    instance = _pop_object(params, "instance", spud.models.feedback)
    if instance is not None:
        criteria['instance'] = _json_feedback(request.user, instance)
        if mode == "children":
            feedback_list = feedback_list.filter(
                parent=instance)
        elif mode == "ascendants":
            feedback_list = feedback_list.filter(
                descendant_set__descendant=instance,
                descendant_set__position__gt=0)
        elif mode == "descendants":
            feedback_list = feedback_list.filter(
                ascendant_set__ascendant=instance,
                ascendant_set__position__gt=0)
        else:
            ErrorBadRequest("Unknown search mode")

    instance = _pop_object(params, "photo", spud.models.photo)
    if instance is not None:
        feedback_list = feedback_list.filter(photo=instance)
        criteria['photo'] = _json_photo(request.user, instance)

    root_only = _pop_boolean(params, "root_only")
    if root_only:
        feedback_list = feedback_list.filter(parent=None)
        criteria["root_only"] = True

    if request.user.is_staff:
        value = _pop_boolean(params, "is_public")
        if value is not None:
            feedback_list = feedback_list.filter(is_public=value)
            criteria["is_public"] = value

        value = _pop_boolean(params, "is_removed")
        if value is not None:
            feedback_list = feedback_list.filter(is_removed=value)
            criteria["is_removed"] = value

    else:
        feedback_list = feedback_list.filter(is_public=True)

    check_params_empty(params)

    number_results = feedback_list.count()
    feedback_list = feedback_list[first:first+count]
    number_returned = len(feedback_list)

    resp = {
        'type': 'feedback_search_results',
        'criteria': criteria,
        'feedbacks': [
            _json_feedback(request.user, p) for p in feedback_list],
        'number_results': number_results,
        'first': first,
        'last': first + number_returned - 1,
        'session': _json_session(request),
        'can_add': request.user.has_perm('spud.add_feedback'),
        'can_moderate': request.user.is_staff,
    }
    return HttpResponse(json.dumps(resp), mimetype="application/json")


@check_errors
def feedback(request, feedback_id):
    if request.method == "POST":
        if not request.user.has_perm('spud.change_feedback'):
            raise ErrorForbidden("No rights to change feedbacks")
    feedback = get_object_or_404(
        spud.models.feedback, pk=feedback_id)
    return feedback_finish(request, feedback)


@check_errors
def feedback_add(request):
    if request.method != "POST":
        raise ErrorBadRequest("Only POST is supported")
    if request.method == "POST":
        if not request.user.has_perm('spud.add_feedback'):
            raise ErrorForbidden("No rights to add feedbacks")

    if 'photo' not in request.POST or request.POST['photo'] is None:
        raise ErrorBadRequest("Photo must be specified")

    if 'rating' not in request.POST or request.POST['rating'] is None:
        raise ErrorBadRequest("Rating must be specified")

    feedback = spud.models.feedback()
    feedback.user = request.user
    feedback.ip_address = request.META.get("REMOTE_ADDR", None)
    feedback.is_public = False
    feedback.is_removed = False
    return feedback_finish(request, feedback)


@check_errors
def feedback_delete(request, feedback_id):
    if request.method != "POST":
        raise ErrorBadRequest("Only POST is supported")
    if not request.user.has_perm('spud.delete_feedback'):
        raise ErrorForbidden("No rights to delete feedbacks")
    feedback = get_object_or_404(
        spud.models.feedback, pk=feedback_id)

    errors = feedback.check_delete()
    if len(errors) > 0:
        raise ErrorBadRequest(", ".join(errors))

    old_photo = feedback.photo
    feedback.delete()
    old_photo.fix_rating()

    resp = {
        'type': 'feedback_delete',
        'session': _json_session(request),
    }
    return HttpResponse(json.dumps(resp), mimetype="application/json")


def feedback_finish(request, feedback):
    if request.method == "POST":
        params = request.POST.copy()
        _pop_string(params, "_")

        updated = False
        updated_parent = False
        updated_rating = False
        old_photo = None

        value = _pop_object(params, "photo", spud.models.photo)
        if value is not None:
            if feedback.pk is not None:
                old_photo = feedback.photo
            feedback.photo = value
            updated = True

        value = _pop_string(params, "parent")
        if value is not None:
            if value == "":
                feedback.parent = None
            else:
                value = _decode_object("parent", spud.models.feedback, value)
                feedback.parent = value
            updated = True
            updated_parent = True

        value = _pop_int(params, "rating")
        if value is not None:
            if value < 0 or value > 9:
                raise ErrorBadRequest("Invalid rating")
            feedback.rating = value
            updated = True

        value = _pop_string(params, "comment")
        if value is not None:
            feedback.comment = value
            updated = True

        value = _pop_string(params, "user_name")
        if value is not None:
            feedback.user_name = value
            updated = True

        value = _pop_string(params, "user_email")
        if value is not None:
            feedback.user_email = value
            updated = True

        value = _pop_string(params, "user_url")
        if value is not None:
            feedback.user_url = value
            updated = True

        if request.user.is_staff:
            value = _pop_boolean(params, "is_public")
            if value is not None:
                feedback.is_public = value
                updated = True

            value = _pop_boolean(params, "is_removed")
            if value is not None:
                feedback.is_removed = value
                updated = True

        check_params_empty(params)

        if updated:
            feedback.save()

        if updated_parent:
            feedback.fix_ascendants()

        if old_photo is not None:
            old_photo.fix_rating()

        if updated_rating:
            feedback.photo.fix_rating()

    resp = {
        'type': 'feedback_get',
        'feedback': _json_feedback_detail(
            request.user, feedback),
        'session': _json_session(request),
    }
    return HttpResponse(json.dumps(resp), mimetype="application/json")


@check_errors
def photo_search_form(request):
    params = request.GET.copy()
    _pop_string(params, "_")

    photo_list, criteria = _json_search(request.user, params)

    check_params_empty(params)

    resp = {
        'type': 'search_form',
        'criteria': criteria,
        'session': _json_session(request),
    }
    return HttpResponse(json.dumps(resp), mimetype="application/json")


@check_errors
def photo_search_results(request):
    params = request.GET.copy()
    _pop_string(params, "_")

    number = _pop_int(params, "number")
    if number is not None:
        return photo_search_item(request, params, number)

    first = _pop_int(params, "first")
    if first is None:
        raise ErrorBadRequest("first is not specified")
    if first < 0:
        raise ErrorBadRequest("first is negative")

    count = _pop_int(params, "count")
    if count is None:
        raise ErrorBadRequest("count is not specified")
    if count < 0:
        raise ErrorBadRequest("count is negative")

    photo_list, criteria = _json_search(request.user, params)

    check_params_empty(params)

    number_results = photo_list.count()
    photos = photo_list[first:first+count]
    number_returned = len(photos)

    resp = {
        'type': 'photo_search_results',
        'criteria': criteria,
        'photos': [_json_photo(request.user, p) for p in photos],
        'number_results': number_results,
        'first': first,
        'last': first + number_returned - 1,
        'session': _json_session(request),
        'can_add': request.user.has_perm('spud.add_photo'),
        'can_change': request.user.has_perm('spud.change_photo'),
        'can_delete': request.user.has_perm('spud.delete_photo'),
    }
    return HttpResponse(json.dumps(resp), mimetype="application/json")


def photo_search_item(request, params, number):
    photo_list, criteria = _json_search(request.user, params)
    number_results = photo_list.count()

    check_params_empty(params)

    try:
        photo = photo_list[number]
    except IndexError:
        raise ErrorBadRequest("Result %d does not exist" % (number))

    resp = {
        'type': 'photo_search_item',
        'criteria': criteria,
        'photo': _json_photo_detail(request.user, photo),
        'number_results': number_results,
        'session': _json_session(request),
    }

    if number > 1:
        resp['prev_photo'] = _json_photo(request.user, photo_list[number-1])

    try:
        resp['next_photo'] = _json_photo(request.user, photo_list[number+1])
    except IndexError:
        pass

    return HttpResponse(json.dumps(resp), mimetype="application/json")


def _set_persons(photo, pa_list, values):
    pa_list = list(photo.photo_person_set.all())
    position = 1
    for pa, person in zip(pa_list, values):
        if (pa.position != position or
                pa.person.pk != person.pk):
            pa.position = position
            pa.person = person
            pa.save()
        position = position + 1
        del pa
        del person

    # for every value not already in pa_list
    for i in xrange(len(pa_list), len(values)):
        person = values[i]
        spud.models.photo_person.objects.create(
            photo=photo, person=person, position=position)
        position = position + 1
        del i
        del person
    del position

    # for every pa that was not included in values list
    for i in xrange(len(values), len(pa_list)):
        pa_list[i].delete()
        del i


@check_errors
def photo_search_change(request):
    if request.method != "POST":
        raise ErrorBadRequest("Only POST is supported")
    if request.method == "POST":
        if not request.user.has_perm('spud.change_photo'):
            raise ErrorForbidden("No rights to change photos")

    params = request.POST.copy()
    _pop_string(params, "_")

    timezone = django.conf.settings.TIME_ZONE
    timezone = pytz.timezone(timezone)

    expected_results = _pop_int(params, "number_results")
    if expected_results is None:
        raise ErrorBadRequest("didn't get expected number_results")

    photo_list, criteria = _json_search(request.user, params)
    number_results = photo_list.count()

    if number_results != expected_results:
        raise ErrorBadRequest(
            "We expected to change %d photos but would have changed %d photos"
            % (expected_results, number_results))

    for key in params.keys():
        if (not key.startswith("set_") and
           not key.startswith("add_") and
           not key.startswith("del_")):
            raise ErrorBadRequest("We got a bad parameter '%s'" % key)

    print "updating"
    print number_results
    print params
    if request.method == "POST":
        value = _pop_string(params, "set_title")
        if value is not None:
            photo_list.update(title=value)

        value = _pop_string(params, "set_description")
        if value is not None:
            photo_list.update(description=value)

        value = _pop_string(params, "set_view")
        if value is not None:
            photo_list.update(view=value)

        value = _pop_string(params, "set_comment")
        if value is not None:
            if not request.user.is_staff:
                raise ErrorForbidden("No rights to change comment")
            photo_list.update(view=value)

        value = _pop_string(params, "set_datetime")
        if value is not None:
            dt = _decode_datetime("set_datetime", value, timezone)
            utc_offset = dt.utcoffset().total_seconds() / 60
            dt = dt.astimezone(pytz.utc).replace(tzinfo=None)
            photo_list.update(action="M",
                              utc_offset=utc_offset, datetime=dt)
            del utc_offset
            del dt

        value = _pop_string(params, "set_action")
        if value is not None:
            action = value
            found = False
            for a in spud.models.PHOTO_ACTION:
                if a[0] == action:
                    found = True
            if not found:
                raise ErrorBadRequest("Unknown action")
            photo_list.update(action=action)
            del a
            del action
            del found

        value = _pop_string(params, "set_photographer")
        if value is not None:
            if value == "":
                value = None
            else:
                value = _decode_object(
                    "set_photographer", spud.models.person, value)
            photo_list.update(photographer=value)

        value = _pop_string(params, "set_place")
        if value is not None:
            if value == "":
                value = None
            else:
                value = _decode_object("set_place", spud.models.place, value)
            photo_list.update(location=value)

        value = None

        values = _pop_object_array(params, "set_albums", spud.models.album)
        if values is not None:
            for photo in photo_list:
                pa_list = list(photo.photo_album_set.all())
                for pa in pa_list:
                    if pa.album.pk in values:
                        values.remove(pa.album.pk)
                    else:
                        pa.delete()
                    del pa
                for value in values:
                    spud.models.photo_album.objects.create(
                        photo=photo, album=value)
                    del value
                del pa_list
                del photo

        values = _pop_object_array(params, "add_albums", spud.models.album)
        if values is not None:
            for photo in photo_list:
                for value in values:
                    spud.models.photo_album.objects.get_or_create(
                        photo=photo, album=value
                    )
                    del value
                del photo

        values = _pop_object_array(params, "del_albums", spud.models.album)
        if values is not None:
            for photo in photo_list:
                for value in values:
                    spud.models.photo_album.objects.filter(
                        photo=photo, album=album
                    ).delete()
                    del value
                del photo

        values = _pop_object_array(
            params, "set_categorys", spud.models.category)
        if values is not None:
            for photo in photo_list:
                pa_list = list(photo.photo_category_set.all())
                for pa in pa_list:
                    if pa.category.pk in values:
                        values.remove(pa.category.pk)
                    else:
                        pa.delete()
                    del pa
                for value in values:
                    spud.models.photo_category.objects.create(
                        photo=photo, category=value)
                    del value
                del pa_list
                del photo

        values = _pop_object_array(
            params, "add_categorys", spud.models.category)
        if values is not None:
            for photo in photo_list:
                for value in values:
                    spud.models.photo_category.objects.get_or_create(
                        photo=photo, category=value
                    )
                    del value
                del photo

        values = _pop_object_array(
            params, "del_categorys", spud.models.category)
        if values is not None:
            for photo in photo_list:
                for value in values:
                    spud.models.photo_category.objects.filter(
                        photo=photo, category=value
                    ).delete()
                    del value
                del photo

        values = _pop_object_array(params, "set_persons", spud.models.person)
        if values is not None:
            for photo in photo_list:
                pa_list = list(photo.photo_person_set.all())
                _set_persons(photo, pa_list, values)
                del pa_list
                del photo

        values = _pop_object_array(params, "add_persons", spud.models.person)
        if values is not None:
            for photo in photo_list:
                pa_list = list(photo.photo_person_set.all())
                new_values = [pa.person for pa in pa_list]
                for value in values:
                    if value not in new_values:
                        new_values.append(value)
                _set_persons(photo, pa_list, new_values)
                del new_values
                del photo

        values = _pop_object_array(params, "del_persons", spud.models.person)
        if values is not None:
            for photo in photo_list:
                pa_list = list(photo.photo_person_set.all())
                new_values = [pa.person for pa in pa_list]
                for value in values:
                    if value in new_values:
                        new_values.remove(value)
                _set_persons(photo, pa_list, new_values)
                del photo

    check_params_empty(params)

    resp = {
        'type': 'photo_search_change',
        'criteria': criteria,
        'number_results': number_results,
        'session': _json_session(request),
        'can_add': request.user.has_perm('spud.add_photo'),
    }
    return HttpResponse(json.dumps(resp), mimetype="application/json")


def photo(request, photo_id):
    value = get_object_or_404(spud.models.photo, pk=photo_id)
    resp = {
        'type': 'photo_get',
        'photo': _json_photo_detail(request.user, value),
        'session': _json_session(request),
    }
    return HttpResponse(json.dumps(resp), mimetype="application/json")
