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

import pytz
import os
import shutil
import datetime

from django.db.models import Max
from django.conf import settings
from django.contrib.auth.models import User, Group
from rest_framework import serializers, exceptions
from rest_framework import fields as f

from . import models, media


class CharField(f.CharField):
    default_empty_html = None

# class TimezoneField(CharField):
#     def to_internal_value(self, data):
#         try:
#             timezone = pytz.timezone(data)
#         except pytz.UnknownTimeZoneError:
#             raise exceptions.ValidationError("Unknown timezone '%s'"
#                                              % data)
#         return timezone
#
#     def to_representation(self, value):
#         return str(value)
#
#
# class UtcDateTimeField(f.DateTimeField):
#     def get_attribute(self, instance):
#         source, utc_offset = self.source.split(":")
#         return getattr(instance, source), getattr(instance, utc_offset)
#
#     def to_representation(self, value):
#         dt = value[0]
#         utc_offset = value[1]
#
#         from_tz = pytz.utc
#         to_tz = pytz.FixedOffset(utc_offset)
#         to_offset = datetime.timedelta(minutes=utc_offset)
#         local = from_tz.localize(dt)
#         local = (local + to_offset).replace(tzinfo=to_tz)
#
#         return super(UtcDateTimeField, self).to_representation(local)


class PhotoThumbSerializer(serializers.ModelSerializer):
    url = f.URLField(source="get_url")

    class Meta:
        model = models.photo_thumb


class PhotoThumbListSerializer(serializers.ListSerializer):
    child = PhotoThumbSerializer()

    def to_representation(self, value):
        result = {}
        for v in value:
            result[v.size] = self.child.to_representation(v)
        return result


class PhotoVideoSerializer(serializers.ModelSerializer):
    url = f.URLField(source="get_url")

    class Meta:
        model = models.photo_video


class PhotoVideoListSerializer(serializers.ListSerializer):
    child = PhotoVideoSerializer()

    def to_representation(self, value):
        result = {}
        for v in value:
            if v.size not in result:
                result[v.size] = []
            result[v.size].append(self.child.to_representation(v))
        return result


class NestedPhotoSerializer(serializers.ModelSerializer):
    thumbs = PhotoThumbListSerializer(
        source="get_thumbs", read_only=True)
    videos = PhotoVideoListSerializer(
        source="get_videos", read_only=True)

    class Meta:
        model = models.photo
        fields = (
            'id', 'title', 'description', 'place',
            'thumbs', 'videos',
        )


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = (
            'id', 'username', 'first_name', 'last_name', 'email', 'groups')


class GroupSerializer(serializers.ModelSerializer):
    class Meta:
        model = Group
        fields = ('id', 'name')


class AlbumSerializer(serializers.ModelSerializer):
    cover_photo = NestedPhotoSerializer(read_only=True)
    cover_photo_pk = serializers.PrimaryKeyRelatedField(
        queryset=models.photo.objects.all(), source="cover_photo",
        required=False)

    # def __init__(self, *args, **kwargs):
    #     super(AlbumSerializer, self).__init__(*args, **kwargs)
    #     request = self.context['request']
    #     if not request.user.is_staff:
    #         del self.fields['notes']

    class Meta:
        model = models.album


# class AlbumListSerializer(serializers.ListSerializer):
#     child = serializers.PrimaryKeyRelatedField(
#         queryset=models.album.objects.all())
#
#     def get_value(self, dictionary):
#         return dictionary.getlist(self.field_name)
#
#     def to_internal_value(self, data):
#         r = []
#         for name in data:
#             try:
#                 pk = int(name)
#                 instance = models.album.objects.get(pk=pk)
#             except ValueError:
#                 instance = models.album.objects.get_by_name(name)
#             r.append(instance)
#         return r


class CategorySerializer(serializers.ModelSerializer):
    cover_photo = NestedPhotoSerializer(read_only=True)
    cover_photo_pk = serializers.PrimaryKeyRelatedField(
        queryset=models.photo.objects.all(), source="cover_photo",
        required=False)

    class Meta:
        model = models.category


# class CategoryListSerializer(serializers.ListSerializer):
#     child = CategorySerializer()
#
#     def get_value(self, dictionary):
#         return dictionary.getlist(self.field_name)
#
#     def to_internal_value(self, data):
#         r = []
#         for name in data:
#             try:
#                 pk = int(name)
#                 instance = models.category.objects.get(pk=pk)
#             except ValueError:
#                 instance = models.category.objects.get_by_name(name)
#             r.append(instance)
#         return r


class PlaceSerializer(serializers.ModelSerializer):
    cover_photo = NestedPhotoSerializer(read_only=True)
    cover_photo_pk = serializers.PrimaryKeyRelatedField(
        queryset=models.photo.objects.all(), source="cover_photo",
        required=False)

    class Meta:
        model = models.place


class PersonTitleField(CharField):
    def get_attribute(self, obj):
        return obj

    def to_representation(self, value):
        return "%s" % value


class NestedPersonSerializer(serializers.ModelSerializer):
    title = PersonTitleField(read_only=True)
    cover_photo = NestedPhotoSerializer(read_only=True)
    cover_photo_pk = serializers.PrimaryKeyRelatedField(
        queryset=models.photo.objects.all(), source="cover_photo",
        required=False)

    class Meta:
        model = models.photo
        fields = (
            'id', 'title', 'cover_photo', 'cover_photo_pk',
        )


class PersonSerializer(serializers.ModelSerializer):
    title = PersonTitleField(read_only=True)
    cover_photo = NestedPhotoSerializer(read_only=True)
    cover_photo_pk = serializers.PrimaryKeyRelatedField(
        queryset=models.photo.objects.all(), source="cover_photo",
        required=False, allow_null=True)

    home = PlaceSerializer(read_only=True)
    home_pk = serializers.PrimaryKeyRelatedField(
        queryset=models.place.objects.all(), source="home",
        required=False, allow_null=True)

    work = PlaceSerializer(read_only=True)
    work_pk = serializers.PrimaryKeyRelatedField(
        queryset=models.place.objects.all(), source="work",
        required=False, allow_null=True)

    mother = None
    mother_pk = serializers.PrimaryKeyRelatedField(
        queryset=models.person.objects.all(), source="mother",
        required=False, allow_null=True)

    father = None
    father_pk = serializers.PrimaryKeyRelatedField(
        queryset=models.person.objects.all(), source="father",
        required=False, allow_null=True)

    spouse = None
    spouse_pk = serializers.PrimaryKeyRelatedField(
        queryset=models.person.objects.all(), source="spouse",
        required=False, allow_null=True)

    spouses = NestedPersonSerializer(many=True, read_only=True)
    grandparents = NestedPersonSerializer(many=True, read_only=True)
    uncles_aunts = NestedPersonSerializer(many=True, read_only=True)
    parents = NestedPersonSerializer(many=True, read_only=True)
    siblings = NestedPersonSerializer(many=True, read_only=True)
    cousins = NestedPersonSerializer(many=True, read_only=True)
    children = NestedPersonSerializer(many=True, read_only=True)
    nephews_nieces = NestedPersonSerializer(many=True, read_only=True)
    grandchildren = NestedPersonSerializer(many=True, read_only=True)

    class Meta:
        model = models.person


class PersonListSerializer(serializers.ListSerializer):
    child = PersonSerializer()

    def get_value(self, dictionary):
        return dictionary.getlist(self.field_name)

    def to_internal_value(self, data):
        raise NotImplemented()

    def to_representation(self, value):
        result = []

        for pp in value.order_by("position"):
            result.append(self.child.to_representation(pp.person))
        return result


class PersonPkListSerializer(serializers.ListSerializer):
    child = serializers.PrimaryKeyRelatedField(
        queryset=models.person.objects.all())

#    def get_value(self, dictionary):
#        print("aaaa", dictionary)
#        return dictionary.getlist(self.field_name)

    def to_internal_value(self, data):
        r = []
        for index, pk in enumerate(data):

            try:
                pk = int(pk)
            except ValueError:
                raise exceptions.ValidationError(
                    "Person '%s' is not integer." % pk)

            try:
                models.person.objects.get(pk=pk)
            except models.person.DoesNotExist:
                raise exceptions.ValidationError(
                    "Person '%s' does not exist." % pk)

            data = {
                'person_id': pk,
                'position': index + 1,
            }
            r.append(data)
        return r

    def to_representation(self, value):
        result = []

        for pp in value.order_by("position"):
            result.append(pp.person_id)
        return result


class FeedbackSerializer(serializers.ModelSerializer):
    title = f.IntegerField(source="id", read_only=True)
    photo = NestedPhotoSerializer(read_only=True)
    photo_pk = serializers.PrimaryKeyRelatedField(
        queryset=models.photo.objects.all(), source="photo")

    class Meta:
        model = models.feedback


# class PhotoPersonSerializer(serializers.ModelSerializer):
#     class Meta:
#         model = models.photo_person
#         fields = ()


# class PhotoPersonSerializerTmp(serializers.RelatedField):
#     read_only = False
#     many = True
#
#     def field_to_native(self, obj, field_name):
#         if obj is None:
#             return None
#
#         result = []
#         persons = getattr(obj, field_name)
#         for p in persons.order_by("photo_person__position").all():
#             serializer = PersonSerializer(p)
#             result.append(serializer.data)
#         return result
#
#     def field_from_native(self, data, files, field_name, into):
#         try:
#             value = data.getlist(field_name)
#             if value == []:
#                 value = self.get_default_value()
#         except AttributeError:
#             value = data[field_name]
#
#         print value
#
#         pa_list = list(into.photo_person_set.all())
#         position = 1
#         for pa, person in zip(pa_list, value):
#             if (pa.position != position or
#                     pa.person.pk != person.pk):
#                 pa.position = position
#                 pa.person = person
#                 pa.save()
#             position = position + 1
#             del pa
#             del person
#
#         # for every value not already in pa_list
#         for i in xrange(len(pa_list), len(value)):
#             person = value[i]
#             models.photo_person.objects.create(
#                 photo=into, person=person, position=position)
#             position = position + 1
#             del i
#             del person
#         del position
#
#         # for every pa that was not included in values list
#         for i in xrange(len(value), len(pa_list)):
#             pa_list[i].delete()
#             del i


class PhotoRelationSerializer(serializers.ModelSerializer):
    class Meta:
        model = models.photo_relation


# class PhotoRelationListSerializer(serializers.ListSerializer):
#     child = PhotoRelationSerializer()
#
#     def get_attribute(self, obj):
#         return (obj.relations_1,  obj.relations_2)
#
#     def to_internal_value(self, data):
#         raise NotImplemented()
#
#     def to_representation(self, value):
#         result = []
#         relations_1, relations_2 = value
#
#         for pr in relations_1.all():
#             r = {
#                 'id': pr.pk,
#                 'description': pr.desc_2,
#                 'photo': pr.photo_2.pk,
#             }
#             result.append(r)
#
#         for pr in relations_2.all():
#             r = {
#                 'id': pr.pk,
#                 'description': pr.desc_1,
#                 'photo': pr.photo_1.pk,
#             }
#             result.append(r)
#
#         return result


default_timezone = pytz.timezone(settings.TIME_ZONE)


class PhotoListSerializer(serializers.ListSerializer):

    def to_representation(self, data):
        # iterable = data.all() if isinstance(data, models.Manager) else data
        iterable = data

        results = []
        for photo in iterable.all():
            result = self.child.to_representation(photo)

            if 'related_photo' in self.context:
                related_photo = self.context['related_photo']
                try:
                    pr = photo.relations_2.get(photo_1=related_photo)
                    result['relation'] = pr.desc_2
                except models.photo_relation.DoesNotExist:
                    pass

                try:
                    pr = photo.relations_1.get(photo_2=related_photo)
                    result['relation'] = pr.desc_1
                except models.photo_relation.DoesNotExist:
                    pass

            results.append(result)

        return results


class PhotoTitleField(CharField):
    def get_attribute(self, obj):
        value = super(PhotoTitleField, self).get_attribute(obj)
        if not value:
            value = obj.name
        return value


class PhotoSerializer(serializers.ModelSerializer):
    # albums = AlbumListSerializer()
    # categorys = CategoryListSerializer()

    title = PhotoTitleField(required=False, allow_null=True)

    albums = AlbumSerializer(many=True, read_only=True)
    albums_pk = serializers.PrimaryKeyRelatedField(
        queryset=models.album.objects.all(), source="albums",
        many=True, required=False)
    add_albums_pk = serializers.PrimaryKeyRelatedField(
        queryset=models.album.objects.all(), write_only=True,
        many=True, required=False)
    rem_albums_pk = serializers.PrimaryKeyRelatedField(
        queryset=models.album.objects.all(), write_only=True,
        many=True, required=False)

    categorys = CategorySerializer(many=True, read_only=True)
    categorys_pk = serializers.PrimaryKeyRelatedField(
        queryset=models.category.objects.all(), source="categorys",
        many=True, required=False)
    add_categorys_pk = serializers.PrimaryKeyRelatedField(
        queryset=models.category.objects.all(), write_only=True,
        many=True, required=False)
    rem_categorys_pk = serializers.PrimaryKeyRelatedField(
        queryset=models.category.objects.all(), write_only=True,
        many=True, required=False)

    # albums = AlbumSerializer(many=True, read_only=True)
    # albums_pk = AlbumListSerializer(source="albums", required=False)

    # categorys = CategoryListSerializer(many=True, read_only=True)
    # categorys_pk = CategoryListSerializer(source="categorys", required=False)

    place = PlaceSerializer(read_only=True)
    place_pk = serializers.PrimaryKeyRelatedField(
        queryset=models.place.objects.all(), source="place",
        required=False, allow_null=True)

    persons = PersonListSerializer(
        child=NestedPersonSerializer(),
        source="photo_person_set", read_only=True)
    persons_pk = PersonPkListSerializer(
        source="photo_person_set", required=False)
    add_persons_pk = PersonPkListSerializer(
        required=False, write_only=True)
    rem_persons_pk = PersonPkListSerializer(
        required=False, write_only=True)

    photographer = NestedPersonSerializer(read_only=True)
    photographer_pk = serializers.PrimaryKeyRelatedField(
        queryset=models.person.objects.all(), source="photographer",
        required=False, allow_null=True)

    feedbacks = FeedbackSerializer(many=True, read_only=True)
#    relations = PhotoRelationListSerializer(read_only=True)

    thumbs = PhotoThumbListSerializer(
        source="get_thumbs", read_only=True)
    videos = PhotoVideoListSerializer(
        source="get_videos", read_only=True)

#    datetime = UtcDateTimeField(
#        required=False,
#        source="datetime:utc_offset")

    def validate(self, attrs):
        if 'photo' not in self.initial_data:
            return attrs

        # settings for the file upload
        #   you can define other parameters here
        #   and check validity late in the code
        options = {
            # the maximum file size (must be in bytes)
            "maxfilesize": 1000 * 2 ** 20,  # 1000 Mb
            # the minimum file size (must be in bytes)
            "minfilesize": 1 * 2 ** 10,  # 1 Kb
            # the file types which are going to be allowed for upload
            #   must be a content_type
            "acceptedformats": (
                "image/jpeg",
                "image/png",
                "video/mp4",
                "video/ogg",
                "video/webm",
                "video/quicktime",
            )
        }

        file_obj = self.initial_data['photo']

        if settings.IMAGE_PATH is None:
            raise exceptions.PermissionDenied(
                'This site does not support uploads.')

        if file_obj.size > options["maxfilesize"]:
            raise exceptions.ValidationError('Maximum file size exceeded.')

        if file_obj.size < options["minfilesize"]:
            raise exceptions.ValidationError('Minimum file size exceeded.')

        try:
            media.get_media(file_obj.name, file_obj)
        except media.UnknownMediaType:
            raise exceptions.ValidationError('File type not supported.')

        raise exceptions.ValidationError('I dont like cats.')
        return attrs

    def create(self, validated_attrs):
        assert 'photo' in self.initial_data

        file_obj = self.initial_data['photo']

        from_tz = pytz.utc
        to_tz = pytz.FixedOffset(validated_attrs['utc_offset'])
        to_offset = datetime.timedelta(minutes=validated_attrs['utc_offset'])
        local = from_tz.localize(validated_attrs['datetime'])
        local = (local + to_offset).replace(tzinfo=to_tz)

        path = "%04d/%02d/%02d" % (local.year, local.month, local.day)
        name = file_obj.name

        validated_attrs['path'] = path
        validated_attrs['name'] = name
        validated_attrs['size'] = file_obj.size
        validated_attrs['action'] = 'V'

        dst = os.path.join(settings.IMAGE_PATH, "orig", path, name)

        # Go ahead and do stuff
        print("importing to %s" % dst)

        umask = os.umask(0o022)
        try:
            if not os.path.lexists(os.path.dirname(dst)):
                os.makedirs(os.path.dirname(dst), 0o755)
            with open(dst, "w") as dst_file_obj:
                file_obj.seek(0)
                shutil.copyfileobj(file_obj, dst_file_obj)
        finally:
            os.umask(umask)

        # FIXME rotate???

        m2m_attrs = self._pop_m2m_attrs(validated_attrs)

        m = media.get_media(self.get_orig_path())
        (validated_attrs['width'], validated_attrs['height']) = m.get_size()
        validated_attrs['size'] = file_obj.size

        exif = m.get_normalized_exif()
        assert 'datetime' not in exif
        exif.update(validated_attrs)
        validated_attrs = exif

        instance = models.photo.objects.create(**validated_attrs)

        self._process_m2m(instance, m2m_attrs)

        # instance.generate_thumbnails(overwrite=False)

        print("imported  %s/%s as %d" % (path, name, instance.pk))

        return instance

    def update(self, instance, validated_attrs):
        m2m_attrs = self._pop_m2m_attrs(validated_attrs)

        for attr, value in validated_attrs.items():
            setattr(instance, attr, value)
        instance.save()

        self._process_m2m(instance, m2m_attrs)
        return instance

    def _pop_m2m_attrs(self, validated_attrs):
        return {
            'albums': validated_attrs.pop("albums", None),
            'add_albums': validated_attrs.pop("add_albums_pk", None),
            'rem_albums': validated_attrs.pop("rem_albums_pk", None),

            'categorys': validated_attrs.pop("categorys", None),
            'add_categorys': validated_attrs.pop("add_categorys_pk", None),
            'rem_categorys': validated_attrs.pop("rem_categorys_pk", None),

            'persons': validated_attrs.pop("photo_person_set", None),
            'add_persons': validated_attrs.pop("add_persons_pk", None),
            'rem_persons': validated_attrs.pop("rem_persons_pk", None),
        }

    def _process_m2m(self, instance, m2m_attrs):
        albums = m2m_attrs["albums"]
        add_albums = m2m_attrs["add_albums"]
        rem_albums = m2m_attrs["rem_albums"]

        categorys = m2m_attrs["categorys"]
        add_categorys = m2m_attrs["add_categorys"]
        rem_categorys = m2m_attrs["rem_categorys"]

        persons = m2m_attrs["persons"]
        add_persons = m2m_attrs["add_persons"]
        rem_persons = m2m_attrs["rem_persons"]

        print("albums", albums, add_albums, rem_albums)
        print("categorys", categorys, add_categorys, rem_categorys)
        print("persons", persons, add_persons, rem_persons)

        if albums is not None:
            pa_list = list(instance.photo_album_set.all())
            for pa in pa_list:
                if pa.album in albums:
                    albums.remove(pa.album)
                else:
                    pa.delete()
                del pa
            for value in albums:
                models.photo_album.objects.create(
                    photo=instance, album=value)
                del value
            del pa_list

        if rem_albums is not None:
            for album in rem_albums:
                models.photo_album.objects.filter(
                    photo=instance, album=album).delete()

        if add_albums is not None:
            for album in add_albums:
                models.photo_album.objects.get_or_create(
                    photo=instance, album=album)

        if categorys is not None:
            pc_list = list(instance.photo_category_set.all())
            for pc in pc_list:
                if pc.category in categorys:
                    categorys.remove(pc.category)
                else:
                    pc.delete()
                del pc
            for value in categorys:
                models.photo_category.objects.create(
                    photo=instance, category=value)
                del value
            del pc_list

        if rem_categorys is not None:
            for category in rem_categorys:
                models.photo_category.objects.filter(
                    photo=instance, category=category).delete()

        if add_categorys is not None:
            for category in add_categorys:
                models.photo_category.objects.get_or_create(
                    photo=instance, category=category)

        if persons is not None:
            pp_list = list(instance.photo_person_set.all())

            for pp in pp_list:
                found = None
                for index, person in enumerate(persons):
                    if pp.position == person['position'] and \
                            pp.person_id == person['person_id']:
                        found = index
                    print(index, person, found)
                if found is not None:
                    del persons[found]
                else:
                    pp.delete()

            for person in persons:
                models.photo_person.objects.create(
                    photo=instance, **person)
                del person

            del pp_list

        if rem_persons is not None:
            for person in rem_persons:
                person_id = person['person_id']
                models.photo_person.objects.filter(
                    photo=instance, person_id=person_id).delete()

        if add_persons is not None:

            for person in add_persons:
                result = models.photo_person.objects\
                    .filter(photo=instance)\
                    .aggregate(Max('position'))
                position_max = result['position__max'] or 0

                person_id = person['person_id']
                position = position_max + 1
                models.photo_person.objects.get_or_create(
                    photo=instance, person_id=person_id,
                    defaults={position: position})

        return instance

    class Meta:
        model = models.photo
        extra_kwargs = {
            'size': {'read_only': True},
            'path': {'read_only': True},
            'name': {'read_only': True},
            'utc_offset': {'read_only': True},
            'timestamp': {'read_only': True},

            'action': {'required': False},
            'datetime': {'required': False},
        }
        list_serializer_class = PhotoListSerializer


# class PhotoAlbumSerializer(serializers.ModelSerializer):
#     class Meta:
#         model = models.photo_album
#
#
# class PhotoCategorySerializer(serializers.ModelSerializer):
#     class Meta:
#         model = models.photo_category
#
#
# class PhotoPersonSerializer(serializers.ModelSerializer):
#     class Meta:
#         model = models.photo_person
