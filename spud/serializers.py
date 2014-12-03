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
import tempfile
import pytz
import datetime
import os
import shutil

from django.conf import settings
from django.contrib.auth.models import User, Group
from rest_framework import serializers, exceptions
from rest_framework import fields as f

from . import models, media


class TimezoneField(f.CharField):
    def to_internal_value(self, data):
        try:
            timezone = pytz.timezone(data)
        except pytz.UnknownTimeZoneError:
            raise exceptions.ValidationError("Unknown timezone '%s'"
                                             % data)
        return timezone

    def to_representation(self, value):
        return str(value)


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ('url', 'username', 'email', 'groups')


class GroupSerializer(serializers.ModelSerializer):
    class Meta:
        model = Group
        fields = ('url', 'name')


class PlaceSerializer(serializers.ModelSerializer):
    class Meta:
        model = models.place


class AlbumSerializer(serializers.ModelSerializer):
    class Meta:
        model = models.album


class AlbumListSerializer(serializers.ListSerializer):
    child = AlbumSerializer()

    def get_value(self, dictionary):
        return dictionary.getlist(self.field_name)

    def to_internal_value(self, data):
        r = []
        for pk in data:
            instance = models.album.objects.get(pk=pk)
            r.append(instance)
        return r


class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = models.category


class PersonSerializer(serializers.ModelSerializer):
    class Meta:
        model = models.person


class FeedbackSerializer(serializers.ModelSerializer):
    class Meta:
        model = models.feedback


class PhotoThumbSerializer(serializers.ModelSerializer):
    file_url = f.URLField(source="get_url")

    class Meta:
        model = models.photo_thumb


class PhotoVideoSerializer(serializers.ModelSerializer):
    file_url = f.URLField(source="get_url")

    class Meta:
        model = models.photo_video


class PhotoPersonSerializer(serializers.ModelSerializer):
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


default_timezone = pytz.timezone(settings.TIME_ZONE)


class PhotoSerializer(serializers.ModelSerializer):
    # FIXME fields
    thumbs = PhotoThumbSerializer(
        source="get_thumbs", read_only=True, many=True)
    videos = PhotoVideoSerializer(
        source="get_videos", read_only=True, many=True)
    photo_person_set = PhotoPersonSerializer(read_only=True, many=True)
    persons = serializers.RelatedField(read_only=True, many=True)

    albums = AlbumListSerializer(read_only=False, many=False)
    categorys = CategorySerializer(many=True)

    def validate(self, attrs):
        if 'photo' not in self._initial_data:
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

        file_obj = self._initial_data['photo']

        if settings.IMAGE_PATH is None:
            raise exceptions.PermissionDenied(
                'This site does not support uploads.')

        if file_obj.size > options["maxfilesize"]:
            raise exceptions.ValidationError('Maximum file size exceeded.')

        if file_obj.size < options["minfilesize"]:
            raise exceptions.ValidationError('Minimum file size exceeded.')

# FIXME
#        print (type(file_obj), file_obj.content_type)
#        if file_obj.content_type not in options["acceptedformats"]:
#            raise exceptions.ParseError(
#                'File type not supported.')

        with tempfile.NamedTemporaryFile() as tmp_file:
            for chunk in file_obj.chunks():
                tmp_file.write(chunk)
            del chunk

            tmp_file.flush()
            tmp_filename = tmp_file.name

            # check source file
            name = os.path.basename(file_obj.name)

            # get time
            if 'datetime' in attrs:
                dt = attrs['datetime']
            else:
                m = media.get_media(tmp_filename, name)
                dt = m.get_datetime()
            print(dt)

            src_timezone = attrs.pop('src_timezone')
            dst_timezone = attrs.pop('timezone')

            dt = src_timezone.localize(dt)
            print(dt)
            dt = dt.astimezone(dst_timezone)
            print(dt)

            # add manual offsets
            offset = attrs.pop('offset')
            dt += datetime.timedelta(seconds=offset)
            print(dt)

            # save the time
            attrs['utc_offset'] = dt.utcoffset().total_seconds() / 60
            attrs['datetime'] = dt.astimezone(pytz.utc).replace(tzinfo=None)

            # determine the destination path
            path = "%04d/%02d/%02d" % (dt.year, dt.month, dt.day)
            try:
                path, name \
                    = models.photo.get_new_name(tmp_filename, path, name)
            except RuntimeError as err:
                raise exceptions.ValidationError(err.message)
            except models.photo_already_exists_error as err:
                raise exceptions.ValidationError(err.message)

        attrs['path'] = path
        attrs['name'] = name
        attrs['size'] = file_obj.size
#        dst = os.path.join(settings.IMAGE_PATH, "orig", path, name)

        return attrs

    def create(self, validated_attrs):
        fields = validated_attrs

        assert 'photo' in self._initial_data

        file_obj = self._initial_data['photo']

        path = fields['path']
        name = fields['name']
        dst = os.path.join(settings.IMAGE_PATH, "orig", path, name)

        # Go ahead and do stuff
        print("importing to %s/%s" % (path, name))

        umask = os.umask(0o022)
        try:
            if not os.path.lexists(os.path.dirname(dst)):
                os.makedirs(os.path.dirname(dst), 0o755)
            with open(dst, "w") as dst_file_obj:
                file_obj.seek(0)
                shutil.copyfileobj(file_obj, dst_file_obj)
        finally:
            os.umask(umask)

        print("imported  %s/%s" % (path, name))

        categorys = validated_attrs.pop("categorys")
        albums = validated_attrs.pop("albums")

        instance = models.photo.objects.create(**validated_attrs)

        for category in categorys:
            models.photo_category.objects.create(
                photo=instance, category=category)

        for album in albums:
            models.photo_album.objects.create(
                photo=instance, album=album)

        instance.update_from_source()
        instance.generate_thumbnails(overwrite=False)
        return instance

    def update(self, instance, validated_attrs):
        categorys = validated_attrs.pop("categorys", None)
        albums = validated_attrs.pop("albums", None)

        for attr, value in validated_attrs.items():
            setattr(instance, attr, value)
        instance.save()

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

        return instance

    class Meta:
        model = models.photo
        extra_kwargs = {
            'size': {'read_only': True},
            'path': {'read_only': True},
            'name': {'read_only': True},
            'utc_offset': {'read_only': True},
            'timestamp': {'read_only': True},
            'offset': {'read_only': True},

            'src_timezone': {'write_only': True},
            'timezone': {'write_only': True},

            'action': {'required': False},
            'datetime': {'required': False},
        }


class PhotoAlbumSerializer(serializers.ModelSerializer):
    class Meta:
        model = models.photo_album


class PhotoCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = models.photo_category


class PhotoPersonSerializer(serializers.ModelSerializer):
    class Meta:
        model = models.photo_person


class PhotoRelationSerializer(serializers.ModelSerializer):
    class Meta:
        model = models.photo_relation
