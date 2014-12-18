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
from rest_framework.decorators import api_view
from rest_framework.permissions import IsAdminUser
from rest_framework.response import Response

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

    data = {
        'perms': {
            'can_create': user.is_authenticated(),
            'can_change': user.is_authenticated(),
            'can_delete': user.is_authenticated(),
        },
    }

    if user.is_authenticated():
        serializer = serializers.UserSerializer(
            user, context={'request': request})
        data['user'] = serializer.data

    return data


@api_view(['GET'])
def session_detail(request):
    data = _get_session(request)
    return Response(data)


@api_view(['POST'])
def login(request):
    username = request.POST.get("username", None)
    password = request.POST.get("password", None)

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


@api_view(['POST'])
def logout(request):
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
        params = self.request.QUERY_PARAMS

        name = params.get('name', None)
        if name is not None:
            try:
                album = models.album.objects.get_by_name(name)
            except exceptions.NameDoesNotExist as e:
                raise drf_exceptions.ParseError(
                    "Cannot find album '%s': %s" % (name, e))

            queryset = queryset.filter(pk=album.pk)

        q = params.getlist('q')
        for r in q:
            queryset = queryset.filter(
                Q(title__icontains=r) | Q(description__icontains=r))

        mode = params.get('mode', 'children')
        mode = mode.lower()

        try:
            instance = params.get('instance')
            if instance is not None:
                instance = int(instance)
                instance = models.album.objects.get(pk=instance)
        except ValueError:
            raise drf_exceptions.ParseError(
                "Album not integer '%s'" % instance)
        except models.album.DoesNotExist as e:
            raise drf_exceptions.ParseError(
                "Cannot find album '%s': %s" % (instance, e))

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

        root_only = params.get('root_only', False)
        if root_only:
            queryset = queryset.filter(parent=None)

        if self.request.user.is_staff:
            needs_revision = params.get('needs_revision', False)
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
        params = self.request.QUERY_PARAMS

        name = params.get('name', None)
        if name is not None:
            try:
                category = models.category.objects.get_by_name(name)
            except exceptions.NameDoesNotExist as e:
                raise drf_exceptions.ParseError(
                    "Cannot find category '%s': %s" % (name, e))

            queryset = queryset.filter(pk=category.pk)

        q = params.getlist('q', [])
        for r in q:
            queryset = queryset.filter(
                Q(title__icontains=r) | Q(description__icontains=r))

        mode = params.get('mode', 'children')
        mode = mode.lower()

        try:
            instance = params.get('instance')
            if instance is not None:
                instance = int(instance)
                instance = models.category.objects.get(pk=instance)
        except ValueError:
            raise drf_exceptions.ParseError(
                "Category not integer '%s'" % instance)
        except models.album.DoesNotExist as e:
            raise drf_exceptions.ParseError(
                "Cannot find category '%s': %s" % (instance, e))

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

        root_only = params.get('root_only', False)
        if root_only:
            queryset = queryset.filter(parent=None)

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
        params = self.request.QUERY_PARAMS

        name = params.get('name', None)
        if name is not None:
            try:
                place = models.place.objects.get_by_name(name)
            except exceptions.NameDoesNotExist as e:
                raise drf_exceptions.ParseError(
                    "Cannot find place '%s': %s" % (name, e))

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

        mode = params.get('mode', 'children')
        mode = mode.lower()

        try:
            instance = params.get('instance')
            if instance is not None:
                instance = int(instance)
                instance = models.place.objects.get(pk=instance)
        except ValueError:
            raise drf_exceptions.ParseError(
                "Place not integer '%s'" % instance)
        except models.album.DoesNotExist as e:
            raise drf_exceptions.ParseError(
                "Cannot find place '%s': %s" % (instance, e))

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

        root_only = params.get('root_only', False)
        if root_only:
            queryset = queryset.filter(parent=None)

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
        params = self.request.QUERY_PARAMS

        q = params.getlist('q', [])
        for r in q:
            queryset = queryset.filter(
                Q(first_name__icontains=r) |
                Q(middle_name__icontains=r) |
                Q(last_name__icontains=r) |
                Q(called__icontains=r))

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


class PhotoViewSet(viewsets.ModelViewSet):
    """
    API endpoint that allows groups to be viewed or edited.
    """
    queryset = models.photo.objects.all()
    serializer_class = serializers.PhotoSerializer

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
