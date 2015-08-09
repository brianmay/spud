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
from django.db.models import Q

from . import exceptions


class HierarchyManager(models.Manager):

    def get_by_name(self, name):
        split = name.split("/")
        type_name = self.model._meta.verbose_name.title()

        qtmp = self.get_queryset()
        first = split.pop(0)

        if first == "":
            qtmp = qtmp.filter(parent__isnull=True)
            first = split.pop(0)
        try:
            instance = qtmp.get(title=first)
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
                instance = qtmp.get(
                    parent=instance,
                    title=search)
            except self.model.DoesNotExist:
                raise exceptions.NameDoesNotExist(
                    "%s '%s' does not exist"
                    % (type_name, search))
            except self.model.MultipleObjectsReturned:
                raise exceptions.NameDoesNotExist(
                    "Multiple results returned for %s '%s'"
                    % (type_name, search))

        return instance


class PersonManager(models.Manager):

    def get_by_name(self, name):
        type_name = self.model._meta.verbose_name.title()

        qtmp = self.get_queryset()
        for val in name.split(" "):
            qtmp = qtmp.filter(
                Q(first_name__iexact=val) |
                Q(middle_name__iexact=val) |
                Q(last_name__iexact=val) |
                Q(called__iexact=val)
            )

        try:
            instance = qtmp.get()
        except self.model.DoesNotExist:
            raise exceptions.NameDoesNotExist(
                "%s '%s' does not exist"
                % (type_name, name))
        except self.model.MultipleObjectsReturned:
            raise exceptions.NameDoesNotExist(
                "Multiple results returned for %s '%s'"
                % (type_name, name))

        return instance


class PhotoManager(models.Manager):

    def get_by_name(self, name):
        type_name = self.model._meta.verbose_name.title()

        qtmp = self.get_queryset()

        try:
            instance = qtmp.get(name=name)
        except self.model.DoesNotExist:
            raise exceptions.NameDoesNotExist(
                "%s '%s' does not exist"
                % (type_name, name))
        except self.model.MultipleObjectsReturned:
            raise exceptions.NameDoesNotExist(
                "Multiple results returned for %s '%s'"
                % (type_name, name))

        return instance
