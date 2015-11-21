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

import six
import datetime
import json

from rest_framework import viewsets, status, exceptions as drf_exceptions
from rest_framework.views import APIView
from rest_framework.permissions import IsAdminUser
from rest_framework.response import Response

from django.utils.dateparse import parse_datetime
import django.contrib.auth
from django.shortcuts import render_to_response
from django.shortcuts import get_object_or_404
from django.template import RequestContext
from django.http import Http404
from django.http.request import QueryDict
from django.http import HttpResponseRedirect
from django.views.decorators.csrf import ensure_csrf_cookie
from django.contrib.auth.models import User, Group
from django.db.models import Q, Count

from . import models
from . import serializers
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


class ModelViewSet(viewsets.ModelViewSet):

    def get_serializer(self, *args, **kwargs):
        serializer = super(ModelViewSet, self).get_serializer(*args, **kwargs)
        serializer.set_request(serializer.context['request'])
        return serializer


#########################
# Django-Rest-Framework #
#########################
class UserViewSet(ModelViewSet):
    permission_classes = (IsAdminUser,)
    """
    API endpoint that allows users to be viewed or edited.
    """
    queryset = User.objects.all()
    serializer_class = serializers.UserSerializer


class GroupViewSet(ModelViewSet):
    permission_classes = (IsAdminUser,)
    """
    API endpoint that allows groups to be viewed or edited.
    """
    queryset = Group.objects.all()
    serializer_class = serializers.GroupSerializer


def _get_session(request):
    user = request.user

    perms = {}

    data = {
        'perms': perms
    }

    if user.is_authenticated():
        serializer = serializers.UserSerializer(
            user, context={'request': request})
        data['user'] = serializer.data

        for t in ['album', 'category', 'place', 'person', 'photo', 'feedback']:
            t_plural = t + "s"

            perms[t_plural] = {
                'can_create': user.has_perm('spud.add_' + t),
                'can_change': user.has_perm('spud.change_' + t),
                'can_delete': user.has_perm('spud.delete_' + t),
            }

    return data


class SessionDetail(APIView):
    permission_classes = ()

    def get(self, request):
        data = _get_session(request)
        return Response(data)


class Login(APIView):
    permission_classes = ()

    def post(self, request):
        username = request.data.get("username", None)
        password = request.data.get("password", None)

        if username is None:
            raise drf_exceptions.PermissionDenied("username not supplied")
        if password is None:
            raise drf_exceptions.PermissionDenied("password not supplied")

        user = django.contrib.auth.authenticate(
            username=username, password=password)
        if user is not None:
            if user.is_active:
                django.contrib.auth.login(request, user)
            else:
                raise drf_exceptions.PermissionDenied("Account is disabled")
        else:
            raise drf_exceptions.PermissionDenied("Invalid login")

        data = _get_session(request)
        return Response(data)


class Logout(APIView):
    permission_classes = ()

    def post(self, request):
        django.contrib.auth.logout(request)
        data = _get_session(request)
        return Response(data)


class AlbumViewSet(ModelViewSet):
    """
    API endpoint that allows groups to be viewed or edited.
    """
    queryset = models.album.objects.all()
    serializer_class = serializers.AlbumSerializer

    def get_queryset(self):
        queryset = self.queryset
        queryset = queryset.select_related('cover_photo')
        queryset = queryset.prefetch_related('cover_photo__photo_thumb_set')
        queryset = queryset.prefetch_related('cover_photo__photo_video_set')

        params = self.request.query_params

        album = _get_object_by_name(params, 'obj', models.album)
        if album is not None:
            queryset = queryset.filter(pk=album.pk)

        q = _get_list(params, 'q')
        for r in q:
            queryset = queryset.filter(
                Q(title__icontains=r) | Q(description__icontains=r))

        mode = _get_string(params, 'mode', 'children')
        mode = mode.lower()

        instance = _get_object(params, "instance", models.album)
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

        if self.request.user.is_staff:
            needs_revision = _get_boolean(params, 'needs_revision', False)
            if needs_revision:
                dt = datetime.datetime.utcnow()-datetime.timedelta(days=365)
                queryset = queryset.filter(
                    Q(revised__lt=dt) | Q(revised__isnull=True))
                queryset = queryset \
                    .annotate(null_revised=Count('revised')) \
                    .order_by('null_revised', 'revised', '-pk')

        return queryset

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        errors = instance.check_delete()
        if len(errors) > 0:
            raise drf_exceptions.PermissionDenied(", ".join(errors))
        self.perform_destroy(instance)
        return Response(status=status.HTTP_204_NO_CONTENT)


class CategoryViewSet(ModelViewSet):
    """
    API endpoint that allows groups to be viewed or edited.
    """
    queryset = models.category.objects.all()
    serializer_class = serializers.CategorySerializer

    def get_queryset(self):
        queryset = self.queryset
        queryset = queryset.select_related('cover_photo')
        queryset = queryset.prefetch_related('cover_photo__photo_thumb_set')
        queryset = queryset.prefetch_related('cover_photo__photo_video_set')

        params = self.request.query_params

        category = _get_object_by_name(params, 'obj', models.category)
        if category is not None:
            queryset = queryset.filter(pk=category.pk)

        q = _get_list(params, 'q')
        for r in q:
            queryset = queryset.filter(
                Q(title__icontains=r) | Q(description__icontains=r))

        mode = _get_string(params, 'mode', 'children')
        mode = mode.lower()

        instance = _get_object(params, "instance", models.category)
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

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        errors = instance.check_delete()
        if len(errors) > 0:
            raise drf_exceptions.PermissionDenied(", ".join(errors))
        self.perform_destroy(instance)
        return Response(status=status.HTTP_204_NO_CONTENT)


class PlaceViewSet(ModelViewSet):
    """
    API endpoint that allows groups to be viewed or edited.
    """
    queryset = models.place.objects.all()
    serializer_class = serializers.PlaceSerializer

    def get_queryset(self):
        queryset = self.queryset
        queryset = queryset.select_related('cover_photo')
        queryset = queryset.prefetch_related('cover_photo__photo_thumb_set')
        queryset = queryset.prefetch_related('cover_photo__photo_video_set')

        params = self.request.query_params

        place = _get_object_by_name(params, 'obj', models.place)
        if place is not None:
            queryset = queryset.filter(pk=place.pk)

        q = _get_list(params, 'q')
        for r in q:
            queryset = queryset.filter(
                Q(title__icontains=r) |
                Q(address__icontains=r) |
                Q(address2__icontains=r) |
                Q(city__icontains=r) |
                Q(state__icontains=r) |
                Q(country__icontains=r))

        mode = _get_string(params, 'mode', 'children')
        mode = mode.lower()

        instance = _get_object(params, "instance", models.place)
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

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        errors = instance.check_delete()
        if len(errors) > 0:
            raise drf_exceptions.PermissionDenied(", ".join(errors))
        self.perform_destroy(instance)
        return Response(status=status.HTTP_204_NO_CONTENT)


class PersonViewSet(ModelViewSet):
    """
    API endpoint that allows groups to be viewed or edited.
    """
    queryset = models.person.objects.all()

    def get_serializer_class(self):
        if self.action == 'list':
            # PersonSerializer too slow for lists
            return serializers.NestedPersonSerializer
        else:
            return serializers.PersonSerializer

    def get_queryset(self):
        queryset = self.queryset
        queryset = queryset.select_related('cover_photo')
        queryset = queryset.prefetch_related('cover_photo__photo_thumb_set')
        queryset = queryset.prefetch_related('cover_photo__photo_video_set')

        if self.action != 'list':
            queryset = queryset.select_related(
                'mother', 'father', 'spouse', 'home', 'work')

        params = self.request.query_params

        person = _get_object_by_name(params, 'obj', models.person)
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

        instance = _get_object(params, "instance", models.person)
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

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        errors = instance.check_delete()
        if len(errors) > 0:
            raise drf_exceptions.PermissionDenied(", ".join(errors))
        self.perform_destroy(instance)
        return Response(status=status.HTTP_204_NO_CONTENT)


class FeedbackViewSet(ModelViewSet):
    """
    API endpoint that allows groups to be viewed or edited.
    """
    queryset = models.feedback.objects.all()
    serializer_class = serializers.FeedbackSerializer

    def get_queryset(self):
        queryset = models.feedback.objects.all()
        params = self.request.query_params

        q = _get_list(params, 'q')
        for r in q:
            queryset = queryset.filter(
                Q(comment__icontains=r) |
                Q(user__username__icontains=r) |
                Q(user_name__icontains=r))

        mode = _get_string(params, 'mode', 'children')
        mode = mode.lower()

        instance = _get_object(params, "instance", models.feedback)
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


class PhotoViewSet(ModelViewSet):
    """
    API endpoint that allows groups to be viewed or edited.
    """
    queryset = models.photo.objects.all()

    def _get_photo_search(self, user, params):
        search = Q()

        queryset = self.queryset

        queryset = queryset.select_related('place')

        queryset = queryset.prefetch_related('photo_thumb_set')
        queryset = queryset.prefetch_related('photo_video_set')

        queryset = queryset.prefetch_related('place__cover_photo')
        queryset = queryset.prefetch_related(
            'place__cover_photo__photo_thumb_set')
        queryset = queryset.prefetch_related(
            'place__cover_photo__photo_video_set')

        if self.action != 'list':
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
                search = search & Q(place__ascendant_set__ascendant=value)
            else:
                search = search & Q(place=value)

        del value

        value = _get_object(params, "person", models.person)
        if value is not None:
            if pd:
                queryset = queryset.filter(
                    persons__ascendant_set__ascendant=value)
            else:
                queryset = queryset.filter(persons=value)

        value = _get_object(params, "album", models.album)
        if value is not None:
            if ad:
                queryset = queryset.filter(
                    albums__ascendant_set__ascendant=value)
            else:
                queryset = queryset.filter(albums=value)

        value = _get_object(params, "category", models.category)
        if value is not None:
            if cd:
                queryset = queryset.filter(
                    categorys__ascendant_set__ascendant=value)
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

        photo = _get_object_by_name(params, 'obj', models.photo)
        if photo is not None:
            queryset = queryset.filter(pk=photo.pk)

        q = _get_list(params, 'q')
        for r in q:
            queryset = queryset.filter(
                Q(name__icontains=r) | Q(title__icontains=r) |
                Q(description__icontains=r))

        instance = _get_object(params, "instance", models.photo)
        if instance is not None:
            queryset = queryset.filter(
                Q(relations_1__photo_2=instance) |
                Q(relations_2__photo_1=instance)).distinct()

        return queryset

    def get_queryset(self):
        params = self.request.query_params
        queryset = self._get_photo_search(self.request.user, params)
        return queryset

    def get_serializer_class(self):
        if self.action == 'list':
            # PhotoSerializer too slow for lists
            return serializers.NestedPhotoSerializer
        else:
            return serializers.PhotoSerializer

    def get_serializer_context(self):
        context = super(PhotoViewSet, self).get_serializer_context()

        params = self.request.query_params
        instance = _get_object(params, "instance", models.photo)
        if instance is not None:
            context['related_photo'] = instance

        return context

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        errors = instance.check_delete()
        if len(errors) > 0:
            raise drf_exceptions.PermissionDenied(", ".join(errors))
        self.perform_destroy(instance)
        return Response(status=status.HTTP_204_NO_CONTENT)

    def bulk_update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)

        criteria = request.data['criteria']
        values = request.data['values']

        queryset = self._get_photo_search(self.request.user, criteria)
        count = 0

        for instance in queryset:
            serializer = self.get_serializer(
                instance, data=values, partial=partial)
            serializer.is_valid(raise_exception=True)
            serializer.save()
            count = count + 1
        return Response({'count': count})

    def patch(self, request, *args, **kwargs):
        if 'pk' not in kwargs:
            kwargs['partial'] = True
            return self.bulk_update(request, *args, **kwargs)
        else:
            return super(PhotoViewSet, self).patch(request, *args, **kwargs)


class PhotoRelationViewSet(ModelViewSet):
    """
    API endpoint that allows groups to be viewed or edited.
    """
    queryset = models.photo_relation.objects.all()
    serializer_class = serializers.PhotoRelationSerializer


#########
# PHOTO #
#########

def photo_orig_redirect(request, object_id):
    instance = get_object_or_404(models.photo, pk=object_id)
    url = instance.get_orig_url()
    return HttpResponseRedirect(url)


def photo_thumb_redirect(request, object_id, size):
    instance = get_object_or_404(models.photo, pk=object_id)

    try:
        thumb = instance.photo_thumb_set.get(size=size)
    except models.photo_thumb.DoesNotExist:
        raise Http404("Thumb for size '%s' does not exist" % (size))

    url = thumb.get_url()
    return HttpResponseRedirect(url)


@ensure_csrf_cookie
def root(request):
    js_session = json.dumps(_get_session(request))
    js_params = json.dumps(request.GET)
    return render_to_response('spud/static.html', {
        'title': 'Root',
        'onload': "window.do_root(%s, %s)"
                  % (js_session, js_params),
    }, context_instance=RequestContext(request))


_types = {
    'albums',
    'categorys',
    'places',
    'persons',
    'photos',
    'feedbacks',
}


def _assert_type(obj_type):
    if obj_type not in _types:
        raise Http404("Unknown type '%s'" % obj_type)


@ensure_csrf_cookie
def obj_list(request, obj_type):
    _assert_type(obj_type)
    obj_type = json.dumps(obj_type)
    js_session = json.dumps(_get_session(request))
    js_params = json.dumps(request.GET)
    return render_to_response('spud/static.html', {
        'title': 'Object list',
        'onload': "window.do_list(%s, %s, %s)"
                  % (obj_type, js_session, js_params),
    }, context_instance=RequestContext(request))


@ensure_csrf_cookie
def obj_detail(request, obj_type, obj_id):
    _assert_type(obj_type)
    obj_type = json.dumps(obj_type)
    obj_id = int(obj_id)
    js_session = json.dumps(_get_session(request))
    js_params = json.dumps(request.GET)
    return render_to_response('spud/static.html', {
        'title': 'Object detail',
        'onload': "window.do_detail(%s, %d, %s, %s)"
                  % (obj_type, obj_id, js_session, js_params),
    }, context_instance=RequestContext(request))
