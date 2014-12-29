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

import datetime
import json

from rest_framework import viewsets, status, exceptions as drf_exceptions
from rest_framework.views import APIView
from rest_framework.permissions import IsAdminUser
from rest_framework.response import Response

from django.utils.dateparse import parse_datetime
import django.contrib.auth
from django.shortcuts import render_to_response
#from django.shortcuts import get_object_or_404
from django.template import RequestContext
from django.http import Http404
#from django.http import HttpResponseRedirect, Http404
#from django.core.urlresolvers import reverse
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
        raise drf_exceptions.ParseError(
            "Cannot find album '%s': %s" % (name, e))


# def _decode_timezone(title, value):
#     if value[0] == "+" or value[0] == "-":
#         sign, offset = (value[0], value[1:])
#         if len(offset) == 2:
#             offset = _decode_int(title, offset) * 60
#         elif len(offset) == 4:
#             offset = (
#                 _decode_int(title, offset[0:2]) * 60 +
#                 _decode_int(title, offset[2:4]))
#         else:
#            raise drf_exceptions.ParseError("%s can't parse timezone" % title)
#         if sign == '-':
#             offset = -offset
#         timezone = pytz.FixedOffset(offset)
#         offset = None
#
#     else:
#         try:
#             timezone = pytz.timezone(value)
#         except pytz.UnknownTimeZoneError:
#             raise drf_exceptions.ParseError("%s unknown timezone" % title)
#
#     return timezone


def _decode_datetime(title, value):
    if value is None:
        return None

    value = parse_datetime(value)
    if value is None:
        raise drf_exceptions.ParseError("%s can't parse date/time" % title)

    return value


def _get_string(params, key, default=None):
    value = params.getlist(key)
    if len(value) < 1:
        return default
    if len(value) > 1:
        raise drf_exceptions.ParseError("%s has >1 values" % key)
    return value[0]


def _get_int(params, key, default=None):
    value = _get_string(params, key)
    if value is None:
        return default
    return _decode_int(key, value)


def _get_boolean(params, key, default=None):
    value = _get_string(params, key)
    if value is None:
        return default
    return _decode_boolean(key, value)


def _get_object(params, key, model):
    return _decode_object(key, model, _get_int(params, key))


def _get_object_array(params, key, model):
    value = params.getlist(key)
    result = []
    for v in value:
        v = [_decode_object(key, model, v)]
        result.extend(v)
    return result


def _get_object_by_name(params, key, model):
    return _decode_object_by_name(key, model, _get_string(params, key))


def _get_datetime(params, key):
    return _decode_datetime(key, _get_string(params, key))


#########################
# Django-Rest-Framework #
#########################
class UserViewSet(viewsets.ModelViewSet):
    permission_classes = (IsAdminUser,)
    """
    API endpoint that allows users to be viewed or edited.
    """
    queryset = User.objects.all()
    serializer_class = serializers.UserSerializer


class GroupViewSet(viewsets.ModelViewSet):
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


class AlbumViewSet(viewsets.ModelViewSet):
    """
    API endpoint that allows groups to be viewed or edited.
    """
    queryset = models.album.objects.all()
    serializer_class = serializers.AlbumSerializer

    def get_queryset(self):
        queryset = models.album.objects.all()
        params = self.request.query_params

        album = _get_object_by_name(params, 'name', models.album)
        if album is not None:
            queryset = queryset.filter(pk=album.pk)

        q = params.getlist('q')
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


class CategoryViewSet(viewsets.ModelViewSet):
    """
    API endpoint that allows groups to be viewed or edited.
    """
    queryset = models.category.objects.all()
    serializer_class = serializers.CategorySerializer

    def get_queryset(self):
        queryset = models.category.objects.all()
        params = self.request.query_params

        category = _get_object_by_name(params, 'name', models.category)
        if category is not None:
            queryset = queryset.filter(pk=category.pk)

        q = params.getlist('q', [])
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


class PlaceViewSet(viewsets.ModelViewSet):
    """
    API endpoint that allows groups to be viewed or edited.
    """
    queryset = models.place.objects.all()
    serializer_class = serializers.PlaceSerializer

    def get_queryset(self):
        queryset = models.place.objects.all()
        params = self.request.query_params

        place = _get_object_by_name(params, 'name', models.place)
        if place is not None:
            queryset = queryset.filter(pk=place.pk)

        q = params.getlist('q', [])
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


class PersonViewSet(viewsets.ModelViewSet):
    """
    API endpoint that allows groups to be viewed or edited.
    """
    queryset = models.person.objects.all()
    serializer_class = serializers.PersonSerializer

    def get_queryset(self):
        queryset = models.person.objects.all()
        params = self.request.query_params

        person = _get_object_by_name(params, 'name', models.person)
        if person is not None:
            queryset = queryset.filter(pk=person.pk)

        q = params.getlist('q', [])
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


class FeedbackViewSet(viewsets.ModelViewSet):
    """
    API endpoint that allows groups to be viewed or edited.
    """
    queryset = models.feedback.objects.all()
    serializer_class = serializers.FeedbackSerializer

    def get_queryset(self):
        queryset = models.feedback.objects.all()
        params = self.request.query_params

        q = params.getlist('q', [])
        for r in q:
            queryset = queryset.filter(
                Q(comment__icontains=r)
                | Q(user__name__icontains=r)
                | Q(username__icontains=r))

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


def _get_photo_search(user, params):
    search = Q()
    photo_list = models.photo.objects.all()

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
            photo_list = photo_list.filter(
                persons__ascendant_set__ascendant=value)
        else:
            photo_list = photo_list.filter(persons=value)

    value = _get_object(params, "album", models.album)
    if value is not None:
        if ad:
            photo_list = photo_list.filter(
                albums__ascendant_set__ascendant=value)
        else:
            photo_list = photo_list.filter(albums=value)

    value = _get_object(params, "category", models.category)
    if value is not None:
        if cd:
            photo_list = photo_list.filter(
                categorys__ascendant_set__ascendant=value)
        else:
            photo_list = photo_list.filter(categorys=value)

    values = _get_object_array(params, "photos", models.photo)
    if values is not None:
        q = Q()
        for value in values:
            q = q | Q(pk=value.pk)
        photo_list = photo_list.filter(q)

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
    if value is not None:
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

    if not user.is_staff:
        search = search & Q(action__isnull=True)

    queryset = photo_list.filter(search)

    photo = _get_object_by_name(params, 'name', models.photo)
    if photo is not None:
        queryset = queryset.filter(pk=photo.pk)

    q = params.getlist('q')
    for r in q:
        queryset = queryset.filter(
            Q(name__icontains=r) | Q(title__icontains=r)
            | Q(description__icontains=r))

    instance = _get_object(params, "instance", models.photo)
    if instance is not None:
        queryset = queryset.filter(
            Q(relations_1__photo_2=instance) |
            Q(relations_2__photo_1=instance)).distinct()

    return queryset


class PhotoViewSet(viewsets.ModelViewSet):
    """
    API endpoint that allows groups to be viewed or edited.
    """
    queryset = models.photo.objects.all()
    serializer_class = serializers.PhotoSerializer

    def get_queryset(self):
        params = self.request.query_params
        queryset = _get_photo_search(self.request.user, params)
        return queryset

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


#class PhotoThumbViewSet(viewsets.ModelViewSet):
#    """
#    API endpoint that allows groups to be viewed or edited.
#    """
#    queryset = models.photo_thumb.objects.all()
#    serializer_class = serializers.PhotoThumbSerializer
#
#
#class PhotoVideoViewSet(viewsets.ModelViewSet):
#    """
#    API endpoint that allows groups to be viewed or edited.
#    """
#    queryset = models.photo_video.objects.all()
#    serializer_class = serializers.PhotoVideoSerializer
#
#
#class PhotoAlbumViewSet(viewsets.ModelViewSet):
#    """
#    API endpoint that allows groups to be viewed or edited.
#    """
#    queryset = models.photo_album.objects.all()
#    serializer_class = serializers.PhotoAlbumSerializer
#
#
#class PhotoCategoryViewSet(viewsets.ModelViewSet):
#    """
#    API endpoint that allows groups to be viewed or edited.
#    """
#    queryset = models.photo_category.objects.all()
#    serializer_class = serializers.PhotoCategorySerializer
#
#
#class PhotoPersonViewSet(viewsets.ModelViewSet):
#    """
#    API endpoint that allows groups to be viewed or edited.
#    """
#    queryset = models.photo_person.objects.all()
#    serializer_class = serializers.PhotoPersonSerializer


class PhotoRelationViewSet(viewsets.ModelViewSet):
    """
    API endpoint that allows groups to be viewed or edited.
    """
    queryset = models.photo_relation.objects.all()
    serializer_class = serializers.PhotoRelationSerializer


#########
# PHOTO #
#########

# def photo_orig_redirect(request, object_id):
#     instance = get_object_or_404(models.photo, pk=object_id)
#     url = instance.get_orig_url()
#     return HttpResponseRedirect(url)
#
#
# def photo_thumb_redirect(request, object_id, size):
#     instance = get_object_or_404(models.photo, pk=object_id)
#
#     try:
#         thumb = instance.photo_thumb_set.get(size=size)
#     except models.photo_thumb.DoesNotExist:
#         raise Http404("Thumb for size '%s' does not exist" % (size))
#
#     url = thumb.get_url()
#     return HttpResponseRedirect(url)
#
#
# def old_photo_detail(request, object_id, size):
#     instance = get_object_or_404(models.photo, pk=object_id)
#
#     try:
#         instance.photo_thumb_set.get(size=size)
#     except models.photo_thumb.DoesNotExist:
#         raise Http404("Thumb for size '%s' does not exist" % (size))
#
#     url = reverse("photo_detail", kwargs={'photo_id': object_id})
#     return HttpResponseRedirect(url)


@ensure_csrf_cookie
def root(request):
    js_session = json.dumps(_get_session(request))
    js_params = json.dumps(request.GET)
    return render_to_response('spud/static.html', {
        'title': 'Root',
        'onload': "do_root(%s, %s)"
                  % (js_session, js_params),
    }, context_instance=RequestContext(request))


# @ensure_csrf_cookie
# def login(request):
#     return render_to_response('spud/static.html', {
#         'title': 'Login',
#         'onload': "do_login()"
#     }, context_instance=RequestContext(request))
#
#
# @ensure_csrf_cookie
# def logout(request):
#     return render_to_response('spud/static.html', {
#         'title': 'Login',
#         'onload': "do_logout()"
#     }, context_instance=RequestContext(request))
#
#
# @ensure_csrf_cookie
# def photo_detail(request, photo_id):
#     photo_id = int(photo_id)
#     if 'n' in request.GET:
#         query = request.GET.copy()
#         n = query.pop('n', [0])[-1]
#         try:
#             n = int(n)
#         except ValueError:
#             n = 0
#
#         js = json.dumps({'criteria': query})
#         return render_to_response('spud/static.html', {
#             'title': 'Photo detail',
#             'onload': "do_photo_search_item(%s, %d, %d)" % (js, n, photo_id),
#         }, context_instance=RequestContext(request))
#     else:
#         js = json.dumps({'criteria': request.GET})
#         return render_to_response('spud/static.html', {
#             'title': 'Photo detail',
#             'onload': "do_photo(%d,%s)" % (photo_id, js),
#         }, context_instance=RequestContext(request))


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
        'onload': "do_list(%s, %s, %s)"
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
        'onload': "do_detail(%s, %d, %s, %s)"
                  % (obj_type, obj_id, js_session, js_params),
    }, context_instance=RequestContext(request))


# @ensure_csrf_cookie
# def album_detail(request, album_id):
#     album_id = int(album_id)
#     return render_to_response('spud/static.html', {
#         'title': 'Album detail',
#         'onload': "albums.do(%d)" % album_id,
#     }, context_instance=RequestContext(request))
#
#
# @ensure_csrf_cookie
# def category_search_results(request):
#     query = request.GET.copy()
#     page = query.pop('page', [0])[-1]
#     try:
#         page = int(page)
#     except ValueError:
#         page = 0
#
#     js = json.dumps({'criteria': query})
#     return render_to_response('spud/static.html', {
#         'title': 'Category results',
#         'onload': "categorys.do_search_results(%s, %d)" % (js, page),
#     }, context_instance=RequestContext(request))
#
#
# @ensure_csrf_cookie
# def category_detail(request, category_id):
#     category_id = int(category_id)
#     return render_to_response('spud/static.html', {
#         'title': 'Category detail',
#         'onload': "categorys.do(%d)" % category_id,
#     }, context_instance=RequestContext(request))
#
#
# @ensure_csrf_cookie
# def place_search_results(request):
#     query = request.GET.copy()
#     page = query.pop('page', [0])[-1]
#     try:
#         page = int(page)
#     except ValueError:
#         page = 0
#
#     js = json.dumps({'criteria': query})
#     return render_to_response('spud/static.html', {
#         'title': 'Place results',
#         'onload': "places.do_search_results(%s, %d)" % (js, page),
#     }, context_instance=RequestContext(request))
#
#
# @ensure_csrf_cookie
# def place_detail(request, place_id):
#     place_id = int(place_id)
#     return render_to_response('spud/static.html', {
#         'title': 'Place detail',
#         'onload': "places.do(%d)" % place_id,
#     }, context_instance=RequestContext(request))
#
#
# @ensure_csrf_cookie
# def person_search_results(request):
#     query = request.GET.copy()
#     page = query.pop('page', [0])[-1]
#     try:
#         page = int(page)
#     except ValueError:
#         page = 0
#
#     js = json.dumps({'criteria': query})
#     return render_to_response('spud/static.html', {
#         'title': 'Person results',
#         'onload': "persons.do_search_results(%s, %d)" % (js, page),
#     }, context_instance=RequestContext(request))
#
#
# @ensure_csrf_cookie
# def person_detail(request, person_id):
#     person_id = int(person_id)
#     return render_to_response('spud/static.html', {
#         'title': 'Person detail',
#         'onload': "persons.do(%d)" % person_id,
#     }, context_instance=RequestContext(request))
#
#
# @ensure_csrf_cookie
# def feedback_search_results(request):
#     query = request.GET.copy()
#     page = query.pop('page', [0])[-1]
#     try:
#         page = int(page)
#     except ValueError:
#         page = 0
#
#     js = json.dumps({'criteria': query})
#     return render_to_response('spud/static.html', {
#         'title': 'Feedback results',
#         'onload': "feedbacks.do_search_results(%s, %d)" % (js, page),
#     }, context_instance=RequestContext(request))
#
#
# @ensure_csrf_cookie
# def feedback_detail(request, feedback_id):
#     feedback_id = int(feedback_id)
#     return render_to_response('spud/static.html', {
#         'title': 'Feedback detail',
#         'onload': "feedbacks.do(%d)" % feedback_id,
#     }, context_instance=RequestContext(request))
#
#
# @ensure_csrf_cookie
# def photo_search_results(request):
#     if 'n' in request.GET:
#         query = request.GET.copy()
#         n = query.pop('n', [0])[-1]
#         try:
#             n = int(n)
#         except ValueError:
#             n = 0
#
#         js = json.dumps({'criteria': query})
#         return render_to_response('spud/static.html', {
#             'title': 'Photo detail',
#             'onload': "do_photo_search_item(%s, %d, %s)" % (js, n, "null"),
#         }, context_instance=RequestContext(request))
#     else:
#         query = request.GET.copy()
#         page = query.pop('page', [0])[-1]
#         try:
#             page = int(page)
#         except ValueError:
#             page = 0
#
#         js = json.dumps({'criteria': query})
#         return render_to_response('spud/static.html', {
#             'title': 'Photo search results',
#             'onload': "do_photo_search_results(%s, %d)" % (js, page),
#         }, context_instance=RequestContext(request))
