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

from ajax_select import LookupChannel
from django.db.models import Q
from django.utils.html import escape
from django.conf import settings
from spud import models


class LookupChannel(LookupChannel):
    # anyone can use these lookup methods
    def check_auth(self, request):
        return


def format_match(object, photo=None, description=None):
    result = []

    if photo is None:
        photo = object.cover_photo

    thumb = None
    if photo is not None:
        thumb = photo.get_thumb(settings.DEFAULT_LIST_SIZE)

    if thumb is not None:
        result.append(u"<img src='%s' alt=''/>" % thumb.get_url())

    result.append(u"<div class='title'>%s</div>" % (escape(object)))

    if description:
        result.append(u"<div class='desc'>%s</div>" % (escape(description)))

    result.append(u"<div class='clear'/>")
    return "".join(result)


class person_lookup(LookupChannel):

    def get_query(self, q, request):
        """ return a query set.  you also have access to request.user if needed
        """
        return models.person.objects.filter(
            Q(first_name__istartswith=q) | Q(last_name__istartswith=q))

    def format_item_display(self, object):
        """ simple display of an object when it is displayed in the list of
        selected objects """
        return escape(unicode(object))

    def format_match(self, object):
        """ (HTML) formatted item for display in the dropdown """
        return format_match(object)

    def get_objects(self, ids):
        """ given a list of ids, return the objects ordered as you would like
        them on the admin page.  this is for displaying the currently selected
        items (in the case of a ManyToMany field) """
        result = []
        for id in ids:
                result.append(models.person.objects.get(pk=id))
        return result


class place_lookup(LookupChannel):

    def get_query(self, q, request):
        """ return a query set.  you also have access to request.user if needed
        """
        return models.place.objects.filter(Q(title__istartswith=q))

    def format_item_display(self, object):
        """ simple display of an object when it is displayed in the list of
        selected objects """
        return escape(unicode(object))

    def format_match(self, object):
        """ (HTML) formatted item for display in the dropdown """
        description = []
        if object.city:
            description.append(object.city)
        if object.state:
            description.append(object.state)
        if object.country:
            description.append(object.country)

        if len(description) == 0:
            description = None
        else:
            description = ", ".join(description)

        return format_match(object, description=description)

    def get_objects(self, ids):
        """ given a list of ids, return the objects ordered as you would like
        them on the admin page.  this is for displaying the currently selected
        items (in the case of a ManyToMany field) """
        return models.place.objects.filter(pk__in=ids)


class album_lookup(LookupChannel):

    def get_query(self, q, request):
        """ return a query set.  you also have access to request.user if needed
        """
        return models.album.objects.filter(Q(title__istartswith=q))

    def format_item_display(self, object):
        """ simple display of an object when it is displayed in the list of
        selected objects """
        return escape(unicode(object))

    def format_match(self, object):
        """ (HTML) formatted item for display in the dropdown """
        return format_match(object, description=object.description)

    def get_objects(self, ids):
        """ given a list of ids, return the objects ordered as you would like
        them on the admin page.  this is for displaying the currently selected
        items (in the case of a ManyToMany field) """
        return models.album.objects.filter(pk__in=ids)


class category_lookup(LookupChannel):

    def get_query(self, q, request):
        """ return a query set.  you also have access to request.user if needed
        """
        return models.category.objects.filter(Q(title__istartswith=q))

    def format_item_display(self, object):
        """ simple display of an object when it is displayed in the list of
        selected objects """
        return escape(unicode(object))

    def format_match(self, object):
        """ (HTML) formatted item for display in the dropdown """
        return format_match(object, description=object.description)

    def get_objects(self, ids):
        """ given a list of ids, return the objects ordered as you would like
        them on the admin page.  this is for displaying the currently selected
        items (in the case of a ManyToMany field) """
        return models.category.objects.filter(pk__in=ids)


class feedback_lookup(LookupChannel):

    def get_query(self, q, request):
        """ return a query set.  you also have access to request.user if needed
        """
        return models.feedback.objects.filter(Q(comment__icontains=q))

    def format_item_display(self, object):
        """ simple display of an object when it is displayed in the list of
        selected objects """
        return escape(unicode(object))

    def format_match(self, object):
        """ (HTML) formatted item for display in the dropdown """
        return format_match(
            object, photo=object.photo, description=object.comment)

    def get_objects(self, ids):
        """ given a list of ids, return the objects ordered as you would like
        them on the admin page.  this is for displaying the currently selected
        items (in the case of a ManyToMany field) """
        return models.feedback.objects.filter(pk__in=ids)


class photo_lookup(LookupChannel):

    def get_query(self, q, request):
        """ return a query set.  you also have access to request.user if needed
        """
        return models.photo.objects.filter(
            Q(title__istartswith=q) | Q(name__istartswith=q))[0:10]

    def format_item_display(self, object):
        """ simple display of an object when it is displayed in the list of
        selected objects """
        return escape(unicode(object))

    def format_match(self, object):
        """ (HTML) formatted item for display in the dropdown """
        return format_match(
            object, photo=object, description=object.description)

    def get_objects(self, ids):
        """ given a list of ids, return the objects ordered as you would like
        them on the admin page.  this is for displaying the currently selected
        items (in the case of a ManyToMany field) """
        return models.photo.objects.filter(pk__in=ids).order_by()
