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
from __future__ import absolute_import, print_function, unicode_literals

import base64
import mimetypes
import os
import shutil

import pytz
from django.conf import settings
from django.contrib.auth.models import Group, User
from django.db import transaction
from django.db.models import Max
from rest_framework import exceptions
from rest_framework import fields as f
from rest_framework import serializers
from rest_framework.utils import html

from . import media, models


class BinaryField(serializers.Field):

    def to_internal_value(self, data):
        return base64.decodebytes(data.encode('ASCII'))

    def to_representation(self, value):
        return base64.encodebytes(value)


class CharField(f.CharField):
    default_empty_html = None


class ListSerializer(serializers.ListSerializer):

    def set_request(self, request):
        field = self.child
        if isinstance(field, ModelSerializer):
            field.set_request(request)
        elif isinstance(field, ListSerializer):
            field.set_request(request)


class ModelSerializer(serializers.ModelSerializer):

    def set_request(self, request):
        for key, field in self.fields.items():
            if isinstance(field, ModelSerializer):
                field.set_request(request)
            elif isinstance(field, ListSerializer):
                field.set_request(request)


class PhotoFileSerializer(ModelSerializer):
    url = f.URLField(source="get_url")

    class Meta:
        model = models.photo_file
        fields = ['id', 'url', 'size_key', 'width', 'height', 'mime_type', 'is_video',  'photo']


class PhotoFileListSerializer(ListSerializer):
    child = PhotoFileSerializer()

    def to_representation(self, value):
        result = {}
        for v in value:
            if v.size_key not in result:
                result[v.size_key] = []
            result[v.size_key].append(self.child.to_representation(v))
        return result


class PhotoTitleField(CharField):
    def get_attribute(self, obj):
        value = super(PhotoTitleField, self).get_attribute(obj)
        if not value:
            value = obj.name
        return value


class NestedPhotoPlaceSerializer(ModelSerializer):
    class Meta:
        model = models.place
        fields = [
            'id', 'title',
        ]
        list_serializer_class = ListSerializer


class NestedPhotoSerializer(ModelSerializer):
    title = PhotoTitleField(required=False, allow_null=True)

    place = NestedPhotoPlaceSerializer(read_only=True)

    thumbs = PhotoFileListSerializer(
        source="get_thumbs", read_only=True)

    class Meta:
        model = models.photo
        fields = [
            'id', 'title', 'description', 'datetime', 'utc_offset', 'place',
            'action', 'thumbs',
        ]
        list_serializer_class = ListSerializer


class UserSerializer(ModelSerializer):
    class Meta:
        model = User
        fields = [
            'id', 'username', 'first_name', 'last_name', 'email', 'groups'
        ]
        list_serializer_class = ListSerializer


class GroupSerializer(ModelSerializer):
    class Meta:
        model = Group
        fields = ['id', 'name']
        list_serializer_class = ListSerializer


class NestedAlbumSerializer(ModelSerializer):
    cover_photo = NestedPhotoSerializer(read_only=True)
    cover_photo_pk = serializers.PrimaryKeyRelatedField(
        queryset=models.photo.objects.all(), source="cover_photo",
        required=False, allow_null=True,
        style={'base_template': 'input.html'})

    class Meta:
        model = models.album
        fields = [
            'id', 'title', 'cover_photo', 'cover_photo_pk',
        ]
        list_serializer_class = ListSerializer


class AlbumSerializer(ModelSerializer):
    cover_photo = NestedPhotoSerializer(read_only=True)
    cover_photo_pk = serializers.PrimaryKeyRelatedField(
        queryset=models.photo.objects.all(), source="cover_photo",
        required=False, allow_null=True,
        style={'base_template': 'input.html'})

    ascendants = NestedAlbumSerializer(
        source="list_ascendants", many=True, read_only=True)

    def set_request(self, request):
        super(AlbumSerializer, self).set_request(request)

        if not request.user.is_staff:
            del self.fields['revised']
            del self.fields['revised_utc_offset']

    class Meta:
        model = models.album
        list_serializer_class = ListSerializer
        fields = [
            'id', 'cover_photo', 'cover_photo_pk', 'ascendants', 'title',
            'description', 'sort_name', 'sort_order',
            'revised', 'revised_utc_offset', 'parent',
        ]


class NestedCategorySerializer(ModelSerializer):
    cover_photo = NestedPhotoSerializer(read_only=True)
    cover_photo_pk = serializers.PrimaryKeyRelatedField(
        queryset=models.photo.objects.all(), source="cover_photo",
        required=False, allow_null=True,
        style={'base_template': 'input.html'})

    class Meta:
        model = models.category
        fields = [
            'id', 'title', 'cover_photo', 'cover_photo_pk',
        ]
        list_serializer_class = ListSerializer


class CategorySerializer(ModelSerializer):
    cover_photo = NestedPhotoSerializer(read_only=True)
    cover_photo_pk = serializers.PrimaryKeyRelatedField(
        queryset=models.photo.objects.all(), source="cover_photo",
        required=False, allow_null=True,
        style={'base_template': 'input.html'})

    ascendants = NestedCategorySerializer(
        source="list_ascendants", many=True, read_only=True)

    class Meta:
        model = models.category
        list_serializer_class = ListSerializer
        fields = [
            'id', 'cover_photo', 'cover_photo_pk', 'ascendants', 'title',
            'description', 'sort_name', 'sort_order', 'parent', 'cover_photo'
        ]


class NestedPlaceSerializer(ModelSerializer):
    cover_photo = NestedPhotoSerializer(read_only=True)
    cover_photo_pk = serializers.PrimaryKeyRelatedField(
        queryset=models.photo.objects.all(), source="cover_photo",
        required=False, allow_null=True,
        style={'base_template': 'input.html'})

    class Meta:
        model = models.place
        fields = [
            'id', 'title', 'cover_photo', 'cover_photo_pk',
        ]
        list_serializer_class = ListSerializer


class PlaceSerializer(ModelSerializer):
    cover_photo = NestedPhotoSerializer(read_only=True)
    cover_photo_pk = serializers.PrimaryKeyRelatedField(
        queryset=models.photo.objects.all(), source="cover_photo",
        required=False, allow_null=True,
        style={'base_template': 'input.html'})

    ascendants = NestedPlaceSerializer(
        source="list_ascendants", many=True, read_only=True)

    def set_request(self, request):
        super(PlaceSerializer, self).set_request(request)

        if not request.user.is_staff:
            del self.fields['address']
            del self.fields['address2']

    class Meta:
        model = models.place
        list_serializer_class = ListSerializer
        fields = [
            'id', 'cover_photo', 'cover_photo_pk', 'ascendants', 'title',
            'address', 'address2', 'city', 'state', 'postcode', 'country',
            'url', 'urldesc', 'notes', 'parent', 'cover_photo', 'description',
        ]


class PersonTitleField(CharField):
    def get_attribute(self, obj):
        return obj

    def to_representation(self, value):
        return "%s" % value


class NestedPersonSerializer(ModelSerializer):
    title = PersonTitleField(read_only=True)
    cover_photo = NestedPhotoSerializer(read_only=True)
    cover_photo_pk = serializers.PrimaryKeyRelatedField(
        queryset=models.photo.objects.all(), source="cover_photo",
        required=False, allow_null=True,
        style={'base_template': 'input.html'})

    class Meta:
        model = models.photo
        fields = [
            'id', 'title', 'cover_photo', 'cover_photo_pk',
        ]
        list_serializer_class = ListSerializer


class PersonSerializer(ModelSerializer):
    title = PersonTitleField(read_only=True)
    cover_photo = NestedPhotoSerializer(read_only=True)
    cover_photo_pk = serializers.PrimaryKeyRelatedField(
        queryset=models.photo.objects.all(), source="cover_photo",
        required=False, allow_null=True,
        style={'base_template': 'input.html'})

    home = PlaceSerializer(read_only=True)
    home_pk = serializers.PrimaryKeyRelatedField(
        queryset=models.place.objects.all(), source="home",
        required=False, allow_null=True)

    work = PlaceSerializer(read_only=True)
    work_pk = serializers.PrimaryKeyRelatedField(
        queryset=models.place.objects.all(), source="work",
        required=False, allow_null=True)

    mother = NestedPersonSerializer(read_only=True)
    mother_pk = serializers.PrimaryKeyRelatedField(
        queryset=models.person.objects.all(), source="mother",
        required=False, allow_null=True)

    father = NestedPersonSerializer(read_only=True)
    father_pk = serializers.PrimaryKeyRelatedField(
        queryset=models.person.objects.all(), source="father",
        required=False, allow_null=True)

    spouse = NestedPersonSerializer(read_only=True)
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

    ascendants = NestedPersonSerializer(
        source="list_ascendants", many=True, read_only=True)

    def set_request(self, request):
        super(PersonSerializer, self).set_request(request)

        if not request.user.is_staff:
            del self.fields['sex']
            del self.fields['dob']
            del self.fields['dod']
            del self.fields['home']
            del self.fields['home_pk']
            del self.fields['work']
            del self.fields['work_pk']
            del self.fields['father']
            del self.fields['father_pk']
            del self.fields['mother']
            del self.fields['mother_pk']
            del self.fields['spouse']
            del self.fields['spouse_pk']
            del self.fields['spouses']
            del self.fields['grandparents']
            del self.fields['uncles_aunts']
            del self.fields['parents']
            del self.fields['siblings']
            del self.fields['cousins']
            del self.fields['children']
            del self.fields['nephews_nieces']
            del self.fields['grandchildren']
            del self.fields['notes']
            del self.fields['email']
            del self.fields['ascendants']

    class Meta:
        model = models.person
        list_serializer_class = ListSerializer
        fields = [
            'id', 'title', 'description',
            'cover_photo', 'cover_photo_pk',
            'home', 'home_pk',
            'work', 'work_pk',
            'mother', 'mother_pk',
            'father', 'father_pk',
            'spouse', 'spouse_pk', 'spouses',
            'grandparents',
            'uncles_aunts',
            'parents',
            'siblings',
            'cousins',
            'children',
            'nephews_nieces',
            'grandchildren',
            'ascendants',
            'first_name', 'last_name', 'middle_name',
            'called', 'sex', 'dob', 'dod', 'notes', 'email',
            'cover_photo'
        ]


class PersonListSerializer(ListSerializer):
    child = PersonSerializer()

    def get_value(self, dictionary):
        if html.is_html_input(dictionary):
            return dictionary.getlist(self.field_name)
        return dictionary.get(self.field_name, None)

    def to_internal_value(self, data):
        raise NotImplementedError()

    def to_representation(self, value):
        result = []

        for pp in value.all():
            result.append(self.child.to_representation(pp.person))
        return result


class PersonPkListSerializer(ListSerializer):
    child = serializers.PrimaryKeyRelatedField(
        queryset=models.person.objects.all())

    def get_value(self, dictionary):
        if html.is_html_input(dictionary):
            return dictionary.getlist(self.field_name)
        return dictionary.get(self.field_name, None)

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

            data_entry = {
                'person_id': pk,
                'position': index + 1,
            }
            r.append(data_entry)
        return r

    def to_representation(self, value):
        result = []

        for pp in value.all():
            result.append(pp.person_id)
        return result


class NestedFeedbackSerializer(ModelSerializer):
    cover_photo = NestedPhotoSerializer(read_only=True)
    cover_photo_pk = serializers.PrimaryKeyRelatedField(
        queryset=models.photo.objects.all(), source="cover_photo",
        allow_null=True,
        style={'base_template': 'input.html'})

    class Meta:
        model = models.feedback
        fields = [
            'id', 'cover_photo', 'cover_photo_pk', 'rating', 'comment',
            'user_name', 'user_email', 'user_url',
            'submit_datetime', 'utc_offset',
            'ip_address', 'is_public', 'is_removed',
            'user',
        ]
        list_serializer_class = ListSerializer


class FeedbackSerializer(ModelSerializer):
    cover_photo = NestedPhotoSerializer(read_only=True)
    cover_photo_pk = serializers.PrimaryKeyRelatedField(
        queryset=models.photo.objects.all(), source="cover_photo",
        allow_null=True,
        style={'base_template': 'input.html'})

    ascendants = NestedFeedbackSerializer(
        source="list_ascendants", many=True, read_only=True)

    class Meta:
        model = models.feedback
        list_serializer_class = ListSerializer
        extra_kwargs = {
            'submit_datetime': {'read_only': True},
            'utc_offset': {'read_only': True},
        }
        fields = [
            'id', 'cover_photo', 'cover_photo_pk', 'ascendants',
            'rating', 'comment', 'user_name', 'user_email', 'user_url',
            'submit_datetime', 'utc_offset', 'ip_address', 'is_public',
            'is_removed', 'cover_photo', 'parent', 'user'
        ]


class PhotoRelationSerializer(ModelSerializer):
    class Meta:
        model = models.photo_relation
        list_serializer_class = ListSerializer
        fields = [
            'id',
            'photo_1', 'photo_1_pk', 'desc_1',
            'photo_2', 'photo_2_pk', 'desc_2',
        ]

    photo_1 = NestedPhotoSerializer(read_only=True)
    photo_1_pk = serializers.PrimaryKeyRelatedField(
        queryset=models.photo.objects.all(), source="photo_1",
        allow_null=True,
        style={'base_template': 'input.html'})

    photo_2 = NestedPhotoSerializer(read_only=True)
    photo_2_pk = serializers.PrimaryKeyRelatedField(
        queryset=models.photo.objects.all(), source="photo_2",
        allow_null=True,
        style={'base_template': 'input.html'})


default_timezone = pytz.timezone(settings.TIME_ZONE)


class PhotoListSerializer(ListSerializer):

    def to_representation(self, data):
        # iterable = data.all() if isinstance(data, models.Manager) else data
        iterable = data

        results = []
        for photo in iterable.all():
            result = self.child.to_representation(photo)

            if 'related_photo_pk' in self.context:
                related_photo_pk = self.context['related_photo_pk']
                try:
                    pr = photo.relations_2.get(photo_1__id=related_photo_pk)
                    result['relation'] = pr.desc_2
                except models.photo_relation.DoesNotExist:
                    pass

                try:
                    pr = photo.relations_1.get(photo_2__id=related_photo_pk)
                    result['relation'] = pr.desc_1
                except models.photo_relation.DoesNotExist:
                    pass

            results.append(result)

        return results


class CreatePhotoSerializer(ModelSerializer):
    orig_url = f.URLField(source="get_orig_url", read_only=True)

    title = PhotoTitleField(required=False, allow_null=True)

    albums_pk = serializers.PrimaryKeyRelatedField(
        queryset=models.album.objects.all(), source="albums",
        many=True, required=False,
        style={'base_template': 'input.html'})

    categorys_pk = serializers.PrimaryKeyRelatedField(
        queryset=models.category.objects.all(), source="categorys",
        many=True, required=False,
        style={'base_template': 'input.html'})

    place_pk = serializers.PrimaryKeyRelatedField(
        queryset=models.place.objects.all(), source="place",
        required=False, allow_null=True,
        style={'base_template': 'input.html'})

    persons_pk = PersonPkListSerializer(
        source="photo_person_set", required=False, allow_null=True)

    photographer_pk = serializers.PrimaryKeyRelatedField(
        queryset=models.person.objects.all(), source="photographer",
        required=False, allow_null=True,
        style={'base_template': 'input.html'})

    sha256_hash = BinaryField(write_only=True)

    def validate(self, attrs):
        if 'photo' not in self.initial_data:
            raise exceptions.ValidationError('Photo was not supplied.')

        file_obj = self.initial_data['photo']

        if settings.IMAGE_PATH is None:
            raise exceptions.PermissionDenied(
                'This site does not support uploads.')

        # if file_obj.size > options["maxfilesize"]:
        #     raise exceptions.ValidationError('Maximum file size exceeded.')

        try:
            m = media.get_media(file_obj.name, file_obj)
        except media.UnknownMediaType:
            raise exceptions.ValidationError('File type not supported.')

        width, height = m.get_size()
        photo_dir = models.photo.build_photo_dir(attrs['datetime'], attrs['utc_offset'])
        new_name = file_obj.name
        sha256_hash = m.get_sha256_hash()
        mime_type, _ = mimetypes.guess_type(new_name)
        is_video = m.is_video()
        size_key = "orig"

        if attrs['sha256_hash'] != sha256_hash:
            raise exceptions.ValidationError(
                "File received with incorrect sha256 hash")
        del attrs['sha256_hash']

        dups = models.photo_file.get_conflicts(dir, new_name, size_key, sha256_hash)
        if dups.count() > 0:
            raise exceptions.ValidationError(
                'File already exists in db at %s.'
                % ",".join([str(d.id) for d in dups]))

        new_dir = models.photo_file.build_dir(is_video, size_key, photo_dir)
        models.photo_file.check_filename_free(new_dir, new_name)

        pf = {
            'size_key': size_key,
            'width': width,
            'height': height,
            'mime_type':  mime_type,
            'dir': new_dir,
            'name': new_name,
            'is_video': is_video,
            'sha256_hash': sha256_hash,
            'num_bytes': file_obj.size,
        }
        attrs['photo_file_set'] = [pf]
        attrs['name'] = new_name

        return attrs

    def create(self, validated_attrs):
        if 'photo' not in self.initial_data:
            raise exceptions.ValidationError('Photo file not supplied')

        file_obj = self.initial_data['photo']

        validated_attrs['action'] = 'R'

        pf = validated_attrs['photo_file_set'][0]
        dir = pf['dir']
        name = pf['name']
        dst = os.path.join(settings.IMAGE_PATH, dir, name)

        # Go ahead and do stuff
        print("importing to %s" % dst)

        umask = os.umask(0o022)
        try:
            if not os.path.lexists(os.path.dirname(dst)):
                os.makedirs(os.path.dirname(dst), 0o755)
            with open(dst, "wb") as dst_file_obj:
                file_obj.seek(0)
                shutil.copyfileobj(file_obj, dst_file_obj)
        finally:
            os.umask(umask)

        try:
            m = media.get_media(dst)
            exif = m.get_normalized_exif()
            assert 'datetime' not in exif
            exif.update(validated_attrs)
            validated_attrs = exif

            with transaction.atomic():
                m2m_attrs = self._pop_m2m_attrs(validated_attrs)
                print(validated_attrs)
                instance = models.photo.objects.create(**validated_attrs)
                self._process_m2m(instance, m2m_attrs)

            print("imported  %s/%s as %d" % (dir, name, instance.pk))
            return instance
        except Exception:
            print("deleting failed import %s" % dst)
            os.remove(dst)
            raise

    def _pop_m2m_attrs(self, validated_attrs):
        return {
            'albums': validated_attrs.pop("albums", None),
            'categorys': validated_attrs.pop("categorys", None),
            'persons': validated_attrs.pop("photo_person_set", None),
            'photo_file_set': validated_attrs.pop("photo_file_set", []),
        }

    def _process_m2m(self, instance, m2m_attrs):
        albums = m2m_attrs["albums"]
        categorys = m2m_attrs["categorys"]
        persons = m2m_attrs["persons"]
        photo_file_set = m2m_attrs["photo_file_set"]

        print("albums", albums)
        print("categorys", categorys)
        print("persons", persons)
        print("photo_file_set", photo_file_set)

        if albums is not None:
            for value in albums:
                models.photo_album.objects.create(
                    photo=instance, album=value)
                del value

        if categorys is not None:
            for value in categorys:
                models.photo_category.objects.create(
                    photo=instance, category=value)
                del value

        if persons is not None:
            for person in persons:
                models.photo_person.objects.create(
                    photo=instance, **person)
                del person

        for pf in photo_file_set:
            instance.photo_file_set.create(**pf)

        return instance

    class Meta:
        model = models.photo
        list_serializer_class = PhotoListSerializer
        fields = [
            'id', 'orig_url', 'sha256_hash', 'title',
            'albums_pk', 'categorys_pk', 'persons_pk',
            'place_pk', 'photographer_pk',
            'title', 'view', 'rating',
            'description', 'utc_offset', 'datetime', 'camera_make',
            'camera_model', 'flash_used', 'focal_length', 'exposure',
            'compression', 'aperture', 'level', 'iso_equiv', 'metering_mode',
            'focus_dist', 'ccd_width', 'comment',
            'photographer',
            'relations'
        ]


class PhotoSerializer(ModelSerializer):
    orig_url = f.URLField(source="get_orig_url", read_only=True)

    title = PhotoTitleField(required=False, allow_null=True)

    albums = AlbumSerializer(many=True, read_only=True)
    albums_pk = serializers.PrimaryKeyRelatedField(
        queryset=models.album.objects.all(), source="albums",
        many=True, required=False,
        style={'base_template': 'input.html'})
    add_albums_pk = serializers.PrimaryKeyRelatedField(
        queryset=models.album.objects.all(), write_only=True,
        many=True, required=False,
        style={'base_template': 'input.html'})
    rem_albums_pk = serializers.PrimaryKeyRelatedField(
        queryset=models.album.objects.all(), write_only=True,
        many=True, required=False,
        style={'base_template': 'input.html'})

    categorys = CategorySerializer(many=True, read_only=True)
    categorys_pk = serializers.PrimaryKeyRelatedField(
        queryset=models.category.objects.all(), source="categorys",
        many=True, required=False,
        style={'base_template': 'input.html'})
    add_categorys_pk = serializers.PrimaryKeyRelatedField(
        queryset=models.category.objects.all(), write_only=True,
        many=True, required=False,
        style={'base_template': 'input.html'})
    rem_categorys_pk = serializers.PrimaryKeyRelatedField(
        queryset=models.category.objects.all(), write_only=True,
        many=True, required=False,
        style={'base_template': 'input.html'})

    place = PlaceSerializer(read_only=True)
    place_pk = serializers.PrimaryKeyRelatedField(
        queryset=models.place.objects.all(), source="place",
        required=False, allow_null=True,
        style={'base_template': 'input.html'})

    persons = PersonListSerializer(
        child=NestedPersonSerializer(),
        source="photo_person_set", read_only=True)
    persons_pk = PersonPkListSerializer(
        source="photo_person_set", required=False, allow_null=True)
    add_persons_pk = PersonPkListSerializer(
        required=False, write_only=True, allow_null=True)
    rem_persons_pk = PersonPkListSerializer(
        required=False, write_only=True, allow_null=True)

    photographer = NestedPersonSerializer(read_only=True)
    photographer_pk = serializers.PrimaryKeyRelatedField(
        queryset=models.person.objects.all(), source="photographer",
        required=False, allow_null=True,
        style={'base_template': 'input.html'})

    feedbacks = FeedbackSerializer(many=True, read_only=True)

    thumbs = PhotoFileListSerializer(
        source="get_thumbs", read_only=True)
    videos = PhotoFileListSerializer(
        source="get_videos", read_only=True)

    def update(self, instance, validated_attrs):
        m2m_attrs = self._pop_m2m_attrs(validated_attrs)

        for attr, value in validated_attrs.items():
            setattr(instance, attr, value)
        instance.save()

        self._process_m2m(instance, m2m_attrs)

        # we need to get new object to ensure m2m attributes not cached
        instance = models.photo.objects.get(pk=instance.pk)
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
                    defaults={'position': position})

        return instance

    def set_request(self, request):
        super(PhotoSerializer, self).set_request(request)

        if not request.user.is_staff:
            del self.fields['orig_url']

    class Meta:
        model = models.photo
        extra_kwargs = {
            'name': {'read_only': True},
            'timestamp': {'read_only': True},
            'action': {'required': False},
        }
        list_serializer_class = PhotoListSerializer
        fields = [
            'id', 'orig_url', 'title',
            'albums', 'albums_pk', 'add_albums_pk', 'rem_albums_pk',
            'categorys',
            'categorys_pk', 'add_categorys_pk', 'rem_categorys_pk',
            'place', 'place_pk',
            'persons', 'persons_pk',
            'add_persons_pk', 'rem_persons_pk',
            'photographer', 'photographer_pk',
            'feedbacks', 'thumbs', 'videos',
            'name', 'title', 'view', 'rating',
            'description', 'utc_offset', 'datetime', 'camera_make',
            'camera_model', 'flash_used', 'focal_length', 'exposure',
            'compression', 'aperture', 'level', 'iso_equiv', 'metering_mode',
            'focus_dist', 'ccd_width', 'comment', 'action', 'timestamp',
            'photographer',
            'relations'
        ]
