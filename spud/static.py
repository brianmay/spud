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

from django.shortcuts import render_to_response
from django.template import RequestContext

import json


def root(request):
    return render_to_response('html/static.html', {
        'title': 'Root',
        'onload': "do_root()"
    }, context_instance=RequestContext(request))


def login(request):
    return render_to_response('html/static.html', {
        'title': 'Login',
        'onload': "do_login()"
    }, context_instance=RequestContext(request))


def logout(request):
    return render_to_response('html/static.html', {
        'title': 'Login',
        'onload': "do_logout()"
    }, context_instance=RequestContext(request))


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
        return render_to_response('html/static.html', {
            'title': 'Photo detail',
            'onload': "do_photo_search_item(%s, %d, %d)" % (js, n, photo_id),
        }, context_instance=RequestContext(request))
    else:
        return render_to_response('html/static.html', {
            'title': 'Photo detail',
            'onload': "do_photo(%d)" % photo_id,
        }, context_instance=RequestContext(request))


def album_search_results(request):
    query = request.GET.copy()
    page = query.pop('page', [0])[-1]
    try:
        page = int(page)
    except ValueError:
        page = 0

    js = json.dumps({'criteria': query})
    return render_to_response('html/static.html', {
        'title': 'Person results',
        'onload': "albums.do_search_results(%s, %d)" % (js, page),
    }, context_instance=RequestContext(request))


def album_detail(request, album_id):
    album_id = int(album_id)
    return render_to_response('html/static.html', {
        'title': 'Album detail',
        'onload': "albums.do(%d)" % album_id,
    }, context_instance=RequestContext(request))


def category_search_results(request):
    query = request.GET.copy()
    page = query.pop('page', [0])[-1]
    try:
        page = int(page)
    except ValueError:
        page = 0

    js = json.dumps({'criteria': query})
    return render_to_response('html/static.html', {
        'title': 'Category results',
        'onload': "categorys.do_search_results(%s, %d)" % (js, page),
    }, context_instance=RequestContext(request))


def category_detail(request, category_id):
    category_id = int(category_id)
    return render_to_response('html/static.html', {
        'title': 'Category detail',
        'onload': "categorys.do(%d)" % category_id,
    }, context_instance=RequestContext(request))


def place_search_results(request):
    query = request.GET.copy()
    page = query.pop('page', [0])[-1]
    try:
        page = int(page)
    except ValueError:
        page = 0

    js = json.dumps({'criteria': query})
    return render_to_response('html/static.html', {
        'title': 'Place results',
        'onload': "places.do_search_results(%s, %d)" % (js, page),
    }, context_instance=RequestContext(request))


def place_detail(request, place_id):
    place_id = int(place_id)
    return render_to_response('html/static.html', {
        'title': 'Place detail',
        'onload': "places.do(%d)" % place_id,
    }, context_instance=RequestContext(request))


def person_search_results(request):
    query = request.GET.copy()
    page = query.pop('page', [0])[-1]
    try:
        page = int(page)
    except ValueError:
        page = 0

    js = json.dumps({'criteria': query})
    return render_to_response('html/static.html', {
        'title': 'Person results',
        'onload': "persons.do_search_results(%s, %d)" % (js, page),
    }, context_instance=RequestContext(request))


def person_detail(request, person_id):
    person_id = int(person_id)
    return render_to_response('html/static.html', {
        'title': 'Person detail',
        'onload': "persons.do(%d)" % person_id,
    }, context_instance=RequestContext(request))


def photo_search_results(request):
    if 'n' in request.GET:
        query = request.GET.copy()
        n = query.pop('n', [0])[-1]
        try:
            n = int(n)
        except ValueError:
            n = 0

        js = json.dumps({'criteria': query})
        return render_to_response('html/static.html', {
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
        return render_to_response('html/static.html', {
            'title': 'Photo search results',
            'onload': "do_photo_search_results(%s, %d)" % (js, page),
        }, context_instance=RequestContext(request))
