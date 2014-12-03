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
from rest_framework import viewsets, exceptions, parsers, negotiation

from django.shortcuts import render_to_response
from django.shortcuts import get_object_or_404
from django.template import RequestContext
from django.http import HttpResponseRedirect, Http404
from django.core.urlresolvers import reverse
from django.views.decorators.csrf import ensure_csrf_cookie
from django.contrib.auth.models import User, Group
from django.db.models import Q, Count

from . import models
from . import serializers


#########################
# Django-Rest-Framework #
#########################
class UserViewSet(viewsets.ModelViewSet):
    """
    API endpoint that allows users to be viewed or edited.
    """
    queryset = User.objects.all()
    serializer_class = serializers.UserSerializer


class GroupViewSet(viewsets.ModelViewSet):
    """
    API endpoint that allows groups to be viewed or edited.
    """
    queryset = Group.objects.all()
    serializer_class = serializers.GroupSerializer


class PlaceViewSet(viewsets.ModelViewSet):
    """
    API endpoint that allows groups to be viewed or edited.
    """
    queryset = models.place.objects.all()
    serializer_class = serializers.PlaceSerializer


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
            split = name.split("/")

            qtmp = models.album.objects.all()
            first = split.pop(0)

            if first == "":
                qtmp = qtmp.filter(parent__isnull=True)
                first = split.pop(0)
            try:
                album = qtmp.get(title=first)
            except models.album.DoesNotExist:
                raise exceptions.ParseError(
                    "Cannot find album '%s'" % first)
            except models.album.MultipleObjectsReturned:
                raise exceptions.ParseError(
                    "Multiple results returned for album '%s'" % first)

            for search in split:
                try:
                    album = models.album.objects.get(
                        parent=album,
                        title=search)
                except models.album.DoesNotExist:
                    raise exceptions.ParseError(
                        "Cannot find album '%s'" % search)
                except models.album.MultipleObjectsReturned:
                    raise exceptions.ParseError(
                        "Multiple results returned for album '%s'" % search)

            queryset = queryset.filter(pk=album.pk)

        q = params.get('q', None)
        if q is not None:
            queryset = queryset.filter(
                Q(title__icontains=q) | Q(description__icontains=q))

        mode = params.get('mode', 'children')
        mode = mode.lower()

        try:
            instance = params.get('instance')
            if instance is not None:
                instance = int(instance)
                instance = models.album.objects.get(pk=instance)
        except ValueError:
            instance = None
        except models.album.DoesNotExist:
            instance = None

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


class CategoryViewSet(viewsets.ModelViewSet):
    """
    API endpoint that allows groups to be viewed or edited.
    """
    queryset = models.category.objects.all()
    serializer_class = serializers.CategorySerializer


class PersonViewSet(viewsets.ModelViewSet):
    """
    API endpoint that allows groups to be viewed or edited.
    """
    queryset = models.person.objects.all()
    serializer_class = serializers.PersonSerializer


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


class PhotoThumbViewSet(viewsets.ModelViewSet):
    """
    API endpoint that allows groups to be viewed or edited.
    """
    queryset = models.photo_thumb.objects.all()
    serializer_class = serializers.PhotoThumbSerializer


class PhotoVideoViewSet(viewsets.ModelViewSet):
    """
    API endpoint that allows groups to be viewed or edited.
    """
    queryset = models.photo_video.objects.all()
    serializer_class = serializers.PhotoVideoSerializer


class PhotoAlbumViewSet(viewsets.ModelViewSet):
    """
    API endpoint that allows groups to be viewed or edited.
    """
    queryset = models.photo_album.objects.all()
    serializer_class = serializers.PhotoAlbumSerializer


class PhotoCategoryViewSet(viewsets.ModelViewSet):
    """
    API endpoint that allows groups to be viewed or edited.
    """
    queryset = models.photo_category.objects.all()
    serializer_class = serializers.PhotoCategorySerializer


class PhotoPersonViewSet(viewsets.ModelViewSet):
    """
    API endpoint that allows groups to be viewed or edited.
    """
    queryset = models.photo_person.objects.all()
    serializer_class = serializers.PhotoPersonSerializer


class PhotoRelationViewSet(viewsets.ModelViewSet):
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


def old_photo_detail(request, object_id, size):
    instance = get_object_or_404(models.photo, pk=object_id)

    try:
        instance.photo_thumb_set.get(size=size)
    except models.photo_thumb.DoesNotExist:
        raise Http404("Thumb for size '%s' does not exist" % (size))

    url = reverse("photo_detail", kwargs={'photo_id': object_id})
    return HttpResponseRedirect(url)


@ensure_csrf_cookie
def root(request):
    return render_to_response('spud/static.html', {
        'title': 'Root',
        'onload': "do_root()"
    }, context_instance=RequestContext(request))


@ensure_csrf_cookie
def login(request):
    return render_to_response('spud/static.html', {
        'title': 'Login',
        'onload': "do_login()"
    }, context_instance=RequestContext(request))


@ensure_csrf_cookie
def logout(request):
    return render_to_response('spud/static.html', {
        'title': 'Login',
        'onload': "do_logout()"
    }, context_instance=RequestContext(request))


@ensure_csrf_cookie
def photo_detail(request, photo_id):
    photo_id = int(photo_id)
    if 'n' in request.GET:
        query = request.GET.copy()
        n = query.pop('n', [0])[-1]
        try:
            n = int(n)
        except ValueError:
            n = 0

        js = json.dumps({'criteria': query})
        return render_to_response('spud/static.html', {
            'title': 'Photo detail',
            'onload': "do_photo_search_item(%s, %d, %d)" % (js, n, photo_id),
        }, context_instance=RequestContext(request))
    else:
        js = json.dumps({'criteria': request.GET})
        return render_to_response('spud/static.html', {
            'title': 'Photo detail',
            'onload': "do_photo(%d,%s)" % (photo_id, js),
        }, context_instance=RequestContext(request))


@ensure_csrf_cookie
def album_search_results(request):
    query = request.GET.copy()
    page = query.pop('page', [0])[-1]
    try:
        page = int(page)
    except ValueError:
        page = 0

    js = json.dumps({'criteria': query})
    return render_to_response('spud/static.html', {
        'title': 'Person results',
        'onload': "albums.do_search_results(%s, %d)" % (js, page),
    }, context_instance=RequestContext(request))


@ensure_csrf_cookie
def album_detail(request, album_id):
    album_id = int(album_id)
    return render_to_response('spud/static.html', {
        'title': 'Album detail',
        'onload': "albums.do(%d)" % album_id,
    }, context_instance=RequestContext(request))


@ensure_csrf_cookie
def category_search_results(request):
    query = request.GET.copy()
    page = query.pop('page', [0])[-1]
    try:
        page = int(page)
    except ValueError:
        page = 0

    js = json.dumps({'criteria': query})
    return render_to_response('spud/static.html', {
        'title': 'Category results',
        'onload': "categorys.do_search_results(%s, %d)" % (js, page),
    }, context_instance=RequestContext(request))


@ensure_csrf_cookie
def category_detail(request, category_id):
    category_id = int(category_id)
    return render_to_response('spud/static.html', {
        'title': 'Category detail',
        'onload': "categorys.do(%d)" % category_id,
    }, context_instance=RequestContext(request))


@ensure_csrf_cookie
def place_search_results(request):
    query = request.GET.copy()
    page = query.pop('page', [0])[-1]
    try:
        page = int(page)
    except ValueError:
        page = 0

    js = json.dumps({'criteria': query})
    return render_to_response('spud/static.html', {
        'title': 'Place results',
        'onload': "places.do_search_results(%s, %d)" % (js, page),
    }, context_instance=RequestContext(request))


@ensure_csrf_cookie
def place_detail(request, place_id):
    place_id = int(place_id)
    return render_to_response('spud/static.html', {
        'title': 'Place detail',
        'onload': "places.do(%d)" % place_id,
    }, context_instance=RequestContext(request))


@ensure_csrf_cookie
def person_search_results(request):
    query = request.GET.copy()
    page = query.pop('page', [0])[-1]
    try:
        page = int(page)
    except ValueError:
        page = 0

    js = json.dumps({'criteria': query})
    return render_to_response('spud/static.html', {
        'title': 'Person results',
        'onload': "persons.do_search_results(%s, %d)" % (js, page),
    }, context_instance=RequestContext(request))


@ensure_csrf_cookie
def person_detail(request, person_id):
    person_id = int(person_id)
    return render_to_response('spud/static.html', {
        'title': 'Person detail',
        'onload': "persons.do(%d)" % person_id,
    }, context_instance=RequestContext(request))


@ensure_csrf_cookie
def feedback_search_results(request):
    query = request.GET.copy()
    page = query.pop('page', [0])[-1]
    try:
        page = int(page)
    except ValueError:
        page = 0

    js = json.dumps({'criteria': query})
    return render_to_response('spud/static.html', {
        'title': 'Feedback results',
        'onload': "feedbacks.do_search_results(%s, %d)" % (js, page),
    }, context_instance=RequestContext(request))


@ensure_csrf_cookie
def feedback_detail(request, feedback_id):
    feedback_id = int(feedback_id)
    return render_to_response('spud/static.html', {
        'title': 'Feedback detail',
        'onload': "feedbacks.do(%d)" % feedback_id,
    }, context_instance=RequestContext(request))


@ensure_csrf_cookie
def photo_search_results(request):
    if 'n' in request.GET:
        query = request.GET.copy()
        n = query.pop('n', [0])[-1]
        try:
            n = int(n)
        except ValueError:
            n = 0

        js = json.dumps({'criteria': query})
        return render_to_response('spud/static.html', {
            'title': 'Photo detail',
            'onload': "do_photo_search_item(%s, %d, %s)" % (js, n, "null"),
        }, context_instance=RequestContext(request))
    else:
        query = request.GET.copy()
        page = query.pop('page', [0])[-1]
        try:
            page = int(page)
        except ValueError:
            page = 0

        js = json.dumps({'criteria': query})
        return render_to_response('spud/static.html', {
            'title': 'Photo search results',
            'onload': "do_photo_search_results(%s, %d)" % (js, page),
        }, context_instance=RequestContext(request))
