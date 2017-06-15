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
from __future__ import print_function

from django.db import models
from django.db.models import Q, Count
from django.http import Http404
from django.http.request import QueryDict
from django.utils.dateparse import parse_datetime

import datetime
import six
from rest_framework import exceptions as drf_exceptions

from . import exceptions


def _decode_int(title, string):
    if string is None:
        return None
    try:
        return int(string)
    except ValueError:
        raise drf_exceptions.ParseError("%s got non-integer" % title)


def _decode_boolean(title, string):
    if string is None:
        return None
    elif string.lower() == "true":
        return True
    elif string.lower() == "false":
        return False
    else:
        raise drf_exceptions.ParseError("%s got non-boolean" % title)


def _decode_object(title, model, pk):
    if pk is None:
        return pk
    try:
        return model.objects.get(pk=pk)
    except model.DoesNotExist:
        raise drf_exceptions.ParseError("%s does not exist" % title)


def _decode_object_by_name(title, model, name):
    if name is None:
        return None

    try:
        return model.objects.get_by_name(name)
    except exceptions.NameDoesNotExist as e:
        raise Http404(
            "Cannot find %s '%s': %s" % (model.__name__, name, e))


def _decode_datetime(title, value):
    if value is None:
        return None

    value = parse_datetime(value)
    if value is None:
        raise drf_exceptions.ParseError("%s can't parse date/time" % title)

    return value


def _get_anything(params, key, default=None):
    if isinstance(params, QueryDict):
        value = params.getlist(key)
        if len(value) < 1:
            return default
        if len(value) > 1:
            raise drf_exceptions.ParseError("%s has >1 values" % key)
        return value[0]
    else:
        value = params.get(key, default)
        return value


def _get_string(params, key, default=None):
    value = _get_anything(params, key, default)
    if value is not None and not isinstance(value, six.string_types):
        raise drf_exceptions.ParseError(
            "%s value %s is not None or a string" % (key, value))
    return value


def _get_int(params, key, default=None):
    value = _get_anything(params, key)
    if value is None:
        return default
    if isinstance(value, int):
        return value
    return _decode_int(key, value)


def _get_boolean(params, key, default=None):
    value = _get_anything(params, key)
    if value is None:
        return default
    if isinstance(value, bool):
        return value
    return _decode_boolean(key, value)


def _get_object(params, key, model):
    return _decode_object(key, model, _get_int(params, key))


def _get_list(params, key):
    if isinstance(params, QueryDict):
        if key in params:
            value = params.getlist(key)
        else:
            value = params.getlist(key + "[]")
    else:
        value = params.get(key, [])
        if not isinstance(value, list):
            raise drf_exceptions.ParseError("%s is not a list" % key)

    return value


def _get_object_array(params, key, model):
    mylist = _get_list(params, key)

    result = []
    for v in mylist:
        v = [_decode_object(key, model, v)]
        result.extend(v)
    return result


def _get_object_by_name(params, key, model):
    return _decode_object_by_name(key, model, _get_string(params, key))


def _get_datetime(params, key):
    return _decode_datetime(key, _get_string(params, key))


class HierarchyManager(models.Manager):

    def get_by_name(self, name):
        split = name.split("/")
        type_name = self.model._meta.verbose_name.title()

        qtmp = self.get_queryset()
        first = split.pop(0)

        if first == "":
            qtmp = self.get_parent_queryset(qtmp, None)
            first = split.pop(0)
        try:
            qtmp = self.get_name_queryset(qtmp, first)
            instance = qtmp.get()
        except self.model.DoesNotExist:
            raise exceptions.NameDoesNotExist(
                "%s '%s' does not exist"
                % (type_name, first))
        except self.model.MultipleObjectsReturned:
            raise exceptions.NameDoesNotExist(
                "Multiple results returned for %s '%s'"
                % (type_name, first))

        qtmp = self.get_queryset()
        for search in split:
            try:
                qtmp = self.get_parent_queryset(qtmp, instance)
                qtmp = self.get_name_queryset(qtmp, search)
                instance = qtmp.get()
            except self.model.DoesNotExist:
                raise exceptions.NameDoesNotExist(
                    "%s '%s' does not exist"
                    % (type_name, search))
            except self.model.MultipleObjectsReturned:
                raise exceptions.NameDoesNotExist(
                    "Multiple results returned for %s '%s'"
                    % (type_name, search))

        return instance

    def get_q_queryset(self, queryset, q):
        for r in q:
            queryset = queryset.filter(Q(title__icontains=r))
        return queryset

    def get_name_queryset(self, queryset, name):
        queryset = queryset.filter(title__iexact=name)
        return queryset

    def get_parent_queryset(self, queryset, parent):
        if parent is None:
            return queryset.filter(parent__isnull=True)
        else:
            return queryset.filter(parent=parent)

    def get_search_queryset(self, user, queryset, params):
        queryset = queryset.select_related('cover_photo')
        queryset = queryset.prefetch_related('cover_photo__photo_thumb_set')
        queryset = queryset.prefetch_related('cover_photo__photo_video_set')

        album = _get_object_by_name(params, 'obj', self.model)
        if album is not None:
            queryset = queryset.filter(pk=album.pk)

        queryset = self.get_q_queryset(queryset, _get_list(params, 'q'))

        mode = _get_string(params, 'mode', 'children')
        mode = mode.lower()

        instance = _get_object(params, "instance", self.model)
        if instance is not None:
            if mode == "children":
                queryset = queryset.filter(parent=instance)
            elif mode == "ascendants":
                queryset = queryset.filter(
                    descendant_set__descendant=instance,
                    descendant_set__position__gt=0)
            elif mode == "descendants":
                queryset = queryset.filter(
                    ascendant_set__ascendant=instance,
                    ascendant_set__position__gt=0)
            else:
                instance = None

        root_only = _get_boolean(params, 'root_only', False)
        if root_only:
            queryset = queryset.filter(parent__isnull=True)

        return queryset


class AlbumManager(HierarchyManager):

    def get_q_queryset(self, queryset, q):
        for r in q:
            queryset = queryset.filter(
                Q(title__icontains=r) | Q(description__icontains=r))
        return queryset

    def get_search_queryset(self, user, queryset, params):
        queryset = super(AlbumManager, self).get_search_queryset(
            user, queryset, params)

        if user.is_staff:
            needs_revision = _get_boolean(params, 'needs_revision', False)
            if needs_revision:
                dt = datetime.datetime.utcnow()-datetime.timedelta(days=365)
                queryset = (
                    queryset
                    .filter(Q(revised__lt=dt) | Q(revised__isnull=True))
                    .annotate(null_revised=Count('revised'))
                    .order_by('null_revised', 'revised', '-pk')
                )

        return queryset


class CategoryManager(HierarchyManager):

    def get_q_queryset(self, queryset, q):
        for r in q:
            queryset = queryset.filter(
                Q(title__icontains=r) | Q(description__icontains=r))
        return queryset


class PlaceManager(HierarchyManager):

    def get_q_queryset(self, queryset, q):
        for r in q:
            queryset = queryset.filter(
                Q(title__icontains=r) |
                Q(address__icontains=r) |
                Q(address2__icontains=r) |
                Q(city__icontains=r) |
                Q(state__icontains=r) |
                Q(country__icontains=r))
        return queryset


class PersonManager(HierarchyManager):

    def get_name_queryset(self, queryset, name):
        for val in name.split(" "):
            queryset = queryset.filter(
                Q(first_name__iexact=val) |
                Q(middle_name__iexact=val) |
                Q(last_name__iexact=val) |
                Q(called__iexact=val)
            )
        return queryset

    def get_parent_queryset(self, queryset, parent):
        if parent is None:
            return queryset.filter(mother__isnull=True, father__isnull=True)
        else:
            return queryset.filter(Q(mother=parent) | Q(father=parent))

    def get_search_queryset(self, user, queryset, params, action):
        queryset = queryset.select_related('cover_photo')
        queryset = queryset.prefetch_related('cover_photo__photo_thumb_set')
        queryset = queryset.prefetch_related('cover_photo__photo_video_set')

        if action != 'list':
            queryset = queryset.select_related(
                'mother', 'father', 'spouse', 'home', 'work')

        person = _get_object_by_name(params, 'obj', self.model)
        if person is not None:
            queryset = queryset.filter(pk=person.pk)

        q = _get_list(params, 'q')
        for r in q:
            queryset = queryset.filter(
                Q(first_name__icontains=r) |
                Q(middle_name__icontains=r) |
                Q(last_name__icontains=r) |
                Q(called__icontains=r))

        mode = _get_string(params, 'mode', 'children')
        mode = mode.lower()

        instance = _get_object(params, "instance", self.model)
        if instance is not None:
            if mode == "children":
                queryset = queryset.filter(
                    Q(mother=instance) | Q(father=instance))
            elif mode == "ascendants":
                queryset = queryset.filter(
                    descendant_set__descendant=instance,
                    descendant_set__position__gt=0)
            elif mode == "descendants":
                queryset = queryset.filter(
                    ascendant_set__ascendant=instance,
                    ascendant_set__position__gt=0)
            else:
                instance = None

        root_only = _get_boolean(params, 'root_only', False)
        if root_only:
            queryset = queryset.filter(mother__isnull=True,
                                       father__isnull=True)

        return queryset


class PhotoManager(models.Manager):

    def get_by_name(self, name):
        type_name = self.model._meta.verbose_name.title()

        qtmp = self.get_queryset()

        try:
            instance = qtmp.get(title=name)
        except self.model.DoesNotExist:
            raise exceptions.NameDoesNotExist(
                "%s '%s' does not exist"
                % (type_name, name))
        except self.model.MultipleObjectsReturned:
            raise exceptions.NameDoesNotExist(
                "Multiple results returned for %s '%s'"
                % (type_name, name))

        return instance

    def get_search_queryset(self, user, queryset, params, action):
        from . import models

        search = Q()

        queryset = queryset.select_related('place')

        queryset = queryset.prefetch_related('photo_thumb_set')
        queryset = queryset.prefetch_related('photo_video_set')

        queryset = queryset.prefetch_related('place__cover_photo')
        queryset = queryset.prefetch_related(
            'place__cover_photo__photo_thumb_set')
        queryset = queryset.prefetch_related(
            'place__cover_photo__photo_video_set')

        if action != 'list':
            queryset = queryset.prefetch_related('feedbacks')

            queryset = queryset.prefetch_related('albums')
            queryset = queryset.prefetch_related('albums__cover_photo')
            queryset = queryset.prefetch_related(
                'albums__cover_photo__photo_thumb_set')
            queryset = queryset.prefetch_related(
                'albums__cover_photo__photo_video_set')

            queryset = queryset.prefetch_related('categorys')
            queryset = queryset.prefetch_related('categorys__cover_photo')
            queryset = queryset.prefetch_related(
                'categorys__cover_photo__photo_thumb_set')
            queryset = queryset.prefetch_related(
                'categorys__cover_photo__photo_video_set')

            queryset = queryset.prefetch_related('photo_person_set')
            queryset = queryset.prefetch_related('photo_person_set__person')
            queryset = queryset.prefetch_related(
                'photo_person_set__person__cover_photo')
            queryset = queryset.prefetch_related(
                'photo_person_set__person__cover_photo__photo_thumb_set')
            queryset = queryset.prefetch_related(
                'photo_person_set__person__cover_photo__photo_video_set')

        pd = _get_boolean(params, "person_descendants", False)
        ld = _get_boolean(params, "place_descendants", False)
        ad = _get_boolean(params, "album_descendants", False)
        cd = _get_boolean(params, "category_descendants", False)

        value = _get_string(params, "description")

        value = _get_int(params, "first_id")
        if value is not None:
            search = search & Q(pk__gte=value)

        value = _get_int(params, "last_id")
        if value is not None:
            search = search & Q(pk__lt=value)

        value = _get_datetime(params, "first_datetime")
        if value is not None:
            search = search & Q(datetime__gte=value)

        value = _get_datetime(params, "last_datetime")
        if value is not None:
            search = search & Q(datetime__lt=value)

        value = _get_int(params, "lower_rating")
        if value is not None:
            search = search & Q(rating__gte=value)

        value = _get_int(params, "upper_rating")
        if value is not None:
            search = search & Q(rating__lte=value)

        value = _get_string(params, "title")
        if value is not None:
            search = search & Q(title__icontains=value)

        value = _get_string(params, "camera_make")
        if value is not None:
            search = search & Q(camera_make__icontains=value)

        value = _get_string(params, "camera_model")
        if value is not None:
            search = search & Q(camera_model__icontains=value)

        value = _get_object(params, "photographer", models.person)
        if value is not None:
            search = search & Q(photographer=value)

        value = _get_object(params, "place", models.place)
        if value is not None:
            if ld:
                queryset = queryset.filter(
                    place__ascendant_set__ascendant=value).distinct()
            else:
                queryset = queryset.filter(persons=value)

        del value

        value = _get_object(params, "person", models.person)
        if value is not None:
            if pd:
                queryset = queryset.filter(
                    persons__ascendant_set__ascendant=value).distinct()
            else:
                queryset = queryset.filter(persons=value)

        value = _get_object(params, "album", models.album)
        if value is not None:
            if ad:
                queryset = queryset.filter(
                    albums__ascendant_set__ascendant=value).distinct()
            else:
                queryset = queryset.filter(albums=value)

        value = _get_object(params, "category", models.category)
        if value is not None:
            if cd:
                queryset = queryset.filter(
                    categorys__ascendant_set__ascendant=value).distinct()
            else:
                queryset = queryset.filter(categorys=value)

        values = _get_list(params, "photos")
        if values is not None:
            q = Q()
            for value in values:
                q = q | Q(pk=value)
            queryset = queryset.filter(q)

        del values

        value = _get_boolean(params, "place_none")
        if value is not None:
            if value:
                search = search & Q(place=None)

        value = _get_boolean(params, "person_none")
        if value is not None:
            if value:
                search = search & Q(persons=None)

        value = _get_boolean(params, "album_none")
        if value is not None:
            if value:
                search = search & Q(albums=None)

        value = _get_boolean(params, "category_none")
        if value is not None:
            if value:
                search = search & Q(categorys=None)

        value = _get_string(params, "action")
        if not user.is_staff:
            search = search & Q(action__isnull=True)
        elif value is not None:
            if value == "none":
                search = search & Q(action__isnull=True)
            elif value == "set":
                search = search & Q(action__isnull=False)
            else:
                search = search & Q(action=value)

        value = _get_string(params, "path")
        if value is not None:
            search = search & Q(path=value)

        value = _get_string(params, "name")
        if value is not None:
            search = search & Q(name=value)

        queryset = queryset.filter(search)

        photo = _get_object_by_name(params, 'obj', self.model)
        if photo is not None:
            queryset = queryset.filter(pk=photo.pk)

        q = _get_list(params, 'q')
        for r in q:
            queryset = queryset.filter(
                Q(name__icontains=r) | Q(title__icontains=r) |
                Q(description__icontains=r))

        instance = _get_object(params, "instance", self.model)
        if instance is not None:
            queryset = queryset.filter(
                Q(relations_1__photo_2=instance) |
                Q(relations_2__photo_1=instance)).distinct()

        return queryset


class FeedbackManager(models.Manager):
    def get_search_queryset(self, user, queryset, params):
        queryset = queryset.select_related('cover_photo')
        queryset = queryset.prefetch_related('cover_photo__photo_thumb_set')
        queryset = queryset.prefetch_related('cover_photo__photo_video_set')

        q = _get_list(params, 'q')
        for r in q:
            queryset = queryset.filter(
                Q(comment__icontains=r) |
                Q(user__username__icontains=r) |
                Q(user_name__icontains=r))

        mode = _get_string(params, 'mode', 'children')
        mode = mode.lower()

        instance = _get_object(params, "instance", self.model)
        if instance is not None:
            if mode == "children":
                queryset = queryset.filter(parent=instance)
            elif mode == "ascendants":
                queryset = queryset.filter(
                    descendant_set__descendant=instance,
                    descendant_set__position__gt=0)
            elif mode == "descendants":
                queryset = queryset.filter(
                    ascendant_set__ascendant=instance,
                    ascendant_set__position__gt=0)
            else:
                instance = None

        root_only = _get_boolean(params, 'root_only', False)
        if root_only:
            queryset = queryset.filter(parent__isnull=True)

        return queryset
