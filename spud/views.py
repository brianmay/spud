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

import json

from rest_framework import viewsets, status, exceptions as drf_exceptions
from rest_framework.views import APIView
from rest_framework.permissions import IsAdminUser
from rest_framework.response import Response
from rest_framework.authtoken.models import Token

import django.contrib.auth
from django.shortcuts import render
from django.shortcuts import get_object_or_404
from django.http import Http404
from django.http.request import QueryDict
from django.http import HttpResponseRedirect
from django.views.decorators.csrf import ensure_csrf_cookie
from django.contrib.auth.models import User, Group

from . import models
from . import serializers


def _decode_int(title, string):
    if string is None:
        return None
    try:
        return int(string)
    except ValueError:
        raise drf_exceptions.ParseError("%s got non-integer" % title)


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


def _get_int(params, key, default=None):
    value = _get_anything(params, key)
    if value is None:
        return default
    if isinstance(value, int):
        return value
    return _decode_int(key, value)


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
        token, __ = Token.objects.get_or_create(user=user)
        data['token'] = token.key

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
        user = self.request.user
        params = self.request.query_params
        queryset = models.album.objects.get_search_queryset(
            user, self.queryset, params)
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
        user = self.request.user
        params = self.request.query_params
        queryset = models.category.objects.get_search_queryset(
            user, self.queryset, params)
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
        user = self.request.user
        params = self.request.query_params
        queryset = models.place.objects.get_search_queryset(
            user, self.queryset, params)
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
        user = self.request.user
        params = self.request.query_params
        queryset = models.person.objects.get_search_queryset(
            user, self.queryset, params, self.action)
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
        user = self.request.user
        params = self.request.query_params
        queryset = models.feedback.objects.get_search_queryset(
            user, self.queryset, params)
        return queryset


class PhotoViewSet(ModelViewSet):
    """
    API endpoint that allows groups to be viewed or edited.
    """
    queryset = models.photo.objects.all()

    def get_queryset(self):
        user = self.request.user
        params = self.request.query_params
        queryset = models.photo.objects.get_search_queryset(
            user, self.queryset, params, self.action)
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
        pk = _get_int(params, "instance", None)
        if pk is not None:
            context['related_photo_pk'] = pk

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
    return render(request, 'spud/static.html', {
        'title': 'Root',
        'onload': "window.do_root(%s, %s)"
                  % (js_session, js_params),
    })


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
    return render(request, 'spud/static.html', {
        'title': 'Object list',
        'onload': "window.do_list(%s, %s, %s)"
                  % (obj_type, js_session, js_params),
    })


@ensure_csrf_cookie
def obj_detail(request, obj_type, obj_id):
    _assert_type(obj_type)
    obj_type = json.dumps(obj_type)
    obj_id = int(obj_id)
    js_session = json.dumps(_get_session(request))
    js_params = json.dumps(request.GET)
    return render(request, 'spud/static.html', {
        'title': 'Object detail',
        'onload': "window.do_detail(%s, %d, %s, %s)"
                  % (obj_type, obj_id, js_session, js_params),
    })
