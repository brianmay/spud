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
from django.contrib.auth.models import User, Group
from rest_framework import serializers
from rest_framework import fields as f

from . import models


class UserSerializer(serializers.HyperlinkedModelSerializer):
    class Meta:
        model = User
        fields = ('url', 'username', 'email', 'groups')


class GroupSerializer(serializers.HyperlinkedModelSerializer):
    class Meta:
        model = Group
        fields = ('url', 'name')


class PlaceSerializer(serializers.HyperlinkedModelSerializer):
    class Meta:
        model = models.place


class AlbumSerializer(serializers.HyperlinkedModelSerializer):
    class Meta:
        model = models.album


class CategorySerializer(serializers.HyperlinkedModelSerializer):
    class Meta:
        model = models.category


class PersonSerializer(serializers.HyperlinkedModelSerializer):
    class Meta:
        model = models.person


class FeedbackSerializer(serializers.HyperlinkedModelSerializer):
    class Meta:
        model = models.feedback


class PhotoThumbSerializer(serializers.HyperlinkedModelSerializer):
    file_url = f.Field(source="get_url")

    class Meta:
        model = models.photo_thumb


class PhotoVideoSerializer(serializers.HyperlinkedModelSerializer):
    file_url = f.Field(source="get_url")

    class Meta:
        model = models.photo_video


class PhotoPersonSerializer(serializers.HyperlinkedModelSerializer):
    class Meta:
        model = models.photo_person
        fields = ()


class PhotoPersonSerializerTmp(serializers.RelatedField):
    read_only = False
    many = True

    def field_to_native(self, obj, field_name):
        if obj is None:
            return None

        result = []
        persons = getattr(obj, field_name)
        for p in persons.order_by("photo_person__position").all():
            serializer = PersonSerializer(p)
            result.append(serializer.data)
        return result

    def field_from_native(self, data, files, field_name, into):
        print data, files, "field_name", field_name, "into", into
        try:
            value = data.getlist(field_name)
            if value == []:
                value = self.get_default_value()
        except AttributeError:
            value = data[field_name]

        print value

        pa_list = list(into.photo_person_set.all())
        position = 1
        for pa, person in zip(pa_list, value):
            if (pa.position != position or
                    pa.person.pk != person.pk):
                pa.position = position
                pa.person = person
                pa.save()
            position = position + 1
            del pa
            del person

        # for every value not already in pa_list
        for i in xrange(len(pa_list), len(value)):
            person = value[i]
            models.photo_person.objects.create(
                photo=into, person=person, position=position)
            position = position + 1
            del i
            del person
        del position

        # for every pa that was not included in values list
        for i in xrange(len(value), len(pa_list)):
            pa_list[i].delete()
            del i


class PhotoSerializer(serializers.HyperlinkedModelSerializer):
    thumbs = PhotoThumbSerializer(
        source="get_thumbs", many=True)
    videos = PhotoThumbSerializer(
        source="get_videos", many=True)
    photo_person_set = PhotoPersonSerializer(many=True)
    persons = serializers.HyperlinkedRelatedField(view_name="person-detail", read_only=True, many=True)
    albums = AlbumSerializer(many=True, read_only=True)
    categorys = CategorySerializer(many=True, read_only=True)

    class Meta:
        model = models.photo


class PhotoAlbumSerializer(serializers.HyperlinkedModelSerializer):
    class Meta:
        model = models.photo_album


class PhotoCategorySerializer(serializers.HyperlinkedModelSerializer):
    class Meta:
        model = models.photo_category


class PhotoPersonSerializer(serializers.HyperlinkedModelSerializer):
    class Meta:
        model = models.photo_person


class PhotoRelationSerializer(serializers.HyperlinkedModelSerializer):
    class Meta:
        model = models.photo_relation
