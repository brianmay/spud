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

import datetime
import os
import os.path
import shutil

import dateutil.tz
import pytz
from django.conf import settings
from django.db import models
from django.db.models import Q
from django.utils.encoding import iri_to_uri, python_2_unicode_compatible
from django.utils.http import urlquote

from . import managers, media


SEX_CHOICES = (
    ('1', 'male'),
    ('2', 'female'),
)

PHOTO_ACTION = (
    ('D', 'delete'),
    ('R', 'regenerate thumbnails & video'),
    ('M', 'move photo'),
    ('auto', 'rotate automatic'),
    ('90', 'rotate 90 degrees clockwise'),
    ('180', 'rotate 180 degrees clockwise'),
    ('270', 'rotate 270 degrees clockwise'),
)


class PhotoAlreadyExistsError(Exception):
    pass


# db string to something that makes sense to the user
def sex_to_string(sex):
    for s in SEX_CHOICES:
        if s[0] == sex:
            return s[1]

    return "unknown sex"


# db string to something that makes sense to the user. None == no action.
def action_to_string(action):
    if action is None:
        return "no action"

    for a in PHOTO_ACTION:
        if a[0] == action:
            return a[1]

    return "unknown action"


def _swap_extension(filename, new_extension):
    (shortname, extension) = os.path.splitext(filename)
    return f"{shortname}.{new_extension}"


# BASE ABSTRACT MODEL CLASS

class BaseModel(models.Model):

    class Meta:
        abstract = True

    def error_list(self):
        error_list = []
        return error_list

    # are there any reasons why this object should not be deleted?
    def check_delete(self):
        error_list = []
        return error_list


class HierarchyModel(BaseModel):

    class Meta:
        abstract = True

    def get_descendants(self, include_self):
        queryset = self.descendant_set.all()
        queryset = queryset.prefetch_related(
            'descendant__cover_photo__photo_file_set')

        if include_self:
            results = 0

            for i in queryset:
                results = results + 1
                yield i.descendant
            # if descendants list is length 0 it is invalid,
            # should include self
            if results == 0:
                yield self
        else:
            for i in queryset.filter(position__gt=0):
                yield i.descendant

    def get_ascendants(self, include_self):
        queryset = self.ascendant_set.all()
        queryset = queryset.prefetch_related(
            'ascendant__cover_photo__photo_file_set')

        if include_self:
            for i in queryset.all():
                yield i.ascendant
        else:
            for i in queryset.filter(position__gt=0):
                yield i.ascendant

        return

    def list_ascendants(self):
        return self.get_ascendants(False)

    def _ascendants_glue(
            self, instance, position, seen, cache, parent_attributes):
        glue = []
        if instance is None:
            return glue

        if instance.pk in cache:
            # print("<--- getting", instance.pk,
            #     [(i[0], i[1]+position) for i in cache[instance.pk]])
            return [(i[0], i[1]+position) for i in cache[instance.pk]]

        if instance.pk in seen:
            # print "<--- loop detected", instance.pk
            return glue

        glue.append((instance.pk, position))

        seen[instance.pk] = True
        for attr in parent_attributes:
            parent = getattr(instance, attr)
            # if parent is not None:
            #     print("descending", instance.pk, parent.pk)
            new_glue = self._ascendants_glue(
                parent, position+1, seen, cache, parent_attributes)
            # make sure there are no duplicates
            # duplicates can happen if ancestors appear more then once in tree,
            # e.g. if cousins marry.
            for item in new_glue:
                if item not in glue:
                    glue.append(item)

        # print("---> caching", instance.pk,
        #     [(i[0], i[1]-position) for i in glue])
        cache[instance.pk] = [(i[0], i[1]-position) for i in glue]
        return glue

    def _fix_ascendants(
            self, parent_attributes, glue_class, cache, do_descendants):
        if cache is None:
            cache = {}

        if do_descendants:
            instance_list = self.get_descendants(True)
        else:
            instance_list = [self]

        # print(instance_list)

        # print("(((")
        for instance in instance_list:
            # print "----", instance.pk
            new_glue = instance._ascendants_glue(
                instance, 0, {}, cache, parent_attributes)
            # print("----", instance.pk)
            # print(instance, instance.pk)
            # print("ng", [(i[0], i[1]) for i in new_glue])
            # print("cache", cache.keys())

            old_glue = [
                (i.ascendant.pk, i.position)
                for i in instance.ascendant_set.all()]

            # print("og1", old_glue)

            for glue in new_glue:
                if glue in old_glue:
                    # print("nothing", glue)
                    old_glue.remove(glue)
                else:
                    # print("adding", glue)
                    ascendant = type(self).objects.get(pk=glue[0])
                    glue_class.objects.create(
                        ascendant=ascendant, descendant=instance,
                        position=glue[1])

            for glue in old_glue:
                # print("removing", glue)
                glue_class.objects.filter(
                    ascendant__pk=glue[0], descendant=instance,
                    position=glue[1]
                ).delete()
        # print(")))")


# ---------------------------------------------------------------------------


@python_2_unicode_compatible
class album(HierarchyModel):
    parent = models.ForeignKey(
        'self', related_name='children', null=True, blank=True,
        on_delete=models.PROTECT)
    title = models.CharField(
        max_length=96, null=True, blank=True, db_index=True)
    description = models.TextField(null=True, blank=True)
    cover_photo = models.ForeignKey(
        'photo', related_name='album_cover_of', null=True, blank=True,
        on_delete=models.SET_NULL)
    sort_name = models.CharField(max_length=96, null=True, blank=True)
    sort_order = models.CharField(max_length=96, null=True, blank=True)
    revised = models.DateTimeField(null=True, blank=True)
    revised_utc_offset = models.IntegerField(null=True, blank=True)
    objects = managers.AlbumManager()

    class Meta:
        ordering = ['sort_name', 'sort_order', 'title']

    def __str__(self):
        return self.title

    def fix_ascendants(self, cache=None, do_descendants=True):
        self._fix_ascendants(
            ["parent"], album_ascendant, cache, do_descendants)

    def save(self, *args, **kwargs):
        super(album, self).save(*args, **kwargs)
        self.fix_ascendants()

    def check_delete(self):
        errorlist = []
        if self.photos.all().count() > 0:
            errorlist.append("Cannot delete album with photos")
        if self.children.all().count() > 0:
            errorlist.append("Cannot delete album with children")
        return errorlist

    def get_cover_photo(self):
        cphoto = None
        if self.cover_photo is not None:
            cphoto = self.cover_photo
        else:

            query = photo.objects.filter(albums__ascendant_set__ascendant=self)
            query = query.exclude(action='D').reverse()
            try:
                cphoto = query[0]
            except IndexError:
                pass
        return cphoto


@python_2_unicode_compatible
class category(HierarchyModel):
    parent = models.ForeignKey(
        'self', related_name='children', null=True, blank=True,
        on_delete=models.PROTECT)
    title = models.CharField(max_length=96, db_index=True)
    description = models.TextField(null=True, blank=True)
    cover_photo = models.ForeignKey(
        'photo', related_name='category_cover_of', null=True, blank=True,
        on_delete=models.SET_NULL)
    sort_name = models.CharField(max_length=96, null=True, blank=True)
    sort_order = models.CharField(max_length=96, null=True, blank=True)
    objects = managers.CategoryManager()

    class Meta:
        ordering = ['sort_name', 'sort_order', 'title']

    def __str__(self):
        return self.title

    def fix_ascendants(self, cache=None, do_descendants=True):
        self._fix_ascendants(
            ["parent"], category_ascendant, cache, do_descendants)

    def save(self, *args, **kwargs):
        super(category, self).save(*args, **kwargs)
        self.fix_ascendants()

    def check_delete(self):
        errorlist = []
        if self.photos.all().count() > 0:
            errorlist.append("Cannot delete category with photos")
        if self.children.all().count() > 0:
            errorlist.append("Cannot delete category with children")
        return errorlist

    def get_cover_photo(self):
        cphoto = None
        if self.cover_photo is not None:
            cphoto = self.cover_photo
        else:

            query = photo.objects.filter(
                categorys__ascendant_set__ascendant=self)
            query = query.exclude(action='D').reverse()
            try:
                cphoto = query[0]
            except IndexError:
                pass
        return cphoto


@python_2_unicode_compatible
class place(HierarchyModel):
    parent = models.ForeignKey(
        'self', related_name='children', null=True, blank=True,
        on_delete=models.PROTECT)
    description = models.TextField(null=True, blank=True)
    title = models.CharField(max_length=192, db_index=True)
    address = models.CharField(max_length=192, null=True,  blank=True)
    address2 = models.CharField(max_length=192, null=True, blank=True)
    city = models.CharField(max_length=96, null=True, blank=True)
    state = models.CharField(max_length=96, null=True, blank=True)
    postcode = models.CharField(max_length=30, null=True, blank=True)
    country = models.CharField(max_length=96, null=True, blank=True)
    url = models.CharField(max_length=3072, null=True, blank=True)
    urldesc = models.CharField(max_length=96, null=True, blank=True)
    cover_photo = models.ForeignKey(
        'photo', related_name='place_cover_of', null=True, blank=True,
        on_delete=models.SET_NULL)
    notes = models.TextField(null=True, blank=True)
    objects = managers.PlaceManager()

    class Meta:
        ordering = ['title']

    def __str__(self):
        return self.title

    def fix_ascendants(self, cache=None, do_descendants=True):
        self._fix_ascendants(
            ["parent"], place_ascendant, cache, do_descendants)

    def save(self, *args, **kwargs):
        super(place, self).save(*args, **kwargs)
        self.fix_ascendants()

    def check_delete(self):
        errorlist = []
        if self.photos.all().count() > 0:
            errorlist.append("Cannot delete place with photos")
        if self.children.all().count() > 0:
            errorlist.append("Cannot delete place with children")
        if self.work_of.all().count() > 0:
            errorlist.append("Cannot delete work")
        if self.home_of.all().count() > 0:
            errorlist.append("Cannot delete home")
        return errorlist

    def get_cover_photo(self):
        cphoto = None
        if self.cover_photo is not None:
            cphoto = self.cover_photo
        else:

            query = photo.objects.filter(place__ascendant_set__ascendant=self)
            query = query.exclude(action='D').reverse()
            try:
                cphoto = query[0]
            except IndexError:
                pass
        return cphoto


@python_2_unicode_compatible
class person(HierarchyModel):
    description = models.TextField(null=True, blank=True)
    first_name = models.CharField(max_length=96, db_index=True)
    last_name = models.CharField(
        max_length=96, null=True, blank=True, db_index=True)
    middle_name = models.CharField(max_length=96, null=True, blank=True)
    called = models.CharField(max_length=48, null=True, blank=True)
    sex = models.CharField(
        max_length=1, null=True, blank=True, choices=SEX_CHOICES)
    dob = models.DateField(null=True, blank=True)
    dod = models.DateField(null=True, blank=True)
    home = models.ForeignKey(
        place, null=True, blank=True, related_name="home_of",
        on_delete=models.SET_NULL)
    work = models.ForeignKey(
        place, null=True, blank=True, related_name="work_of",
        on_delete=models.SET_NULL)
    father = models.ForeignKey(
        'self', null=True, blank=True, related_name='father_of',
        on_delete=models.SET_NULL)
    mother = models.ForeignKey(
        'self', null=True, blank=True, related_name='mother_of',
        on_delete=models.SET_NULL)
    spouse = models.ForeignKey(
        'self', null=True, blank=True, related_name='reverse_spouses',
        on_delete=models.SET_NULL)
    notes = models.TextField(null=True, blank=True)
    cover_photo = models.ForeignKey(
        'photo', related_name='person_cover_of', null=True, blank=True,
        on_delete=models.SET_NULL)
    email = models.CharField(max_length=192, null=True, blank=True)
    objects = managers.PersonManager()

    class Meta:
        ordering = ['last_name', 'first_name']

    def __str__(self):
        result = "%s" % (self.first_name)
        if self.middle_name is not None and self.middle_name:
            result += " %s" % (self.middle_name)
        if self.called is not None and self.called:
            result += " (%s)" % (self.called)
        if self.last_name is not None and self.last_name:
            result += " %s" % (self.last_name)
        return result

    def check_delete(self):
        errorlist = []
        if self.photos.all().count() > 0:
            errorlist.append("Cannot delete person with photos")
        if self.father_of.all().count() > 0:
            errorlist.append("Cannot delete person that is a father")
        if self.mother_of.all().count() > 0:
            errorlist.append("Cannot delete person that is a mother")
        if self.reverse_spouses.all().count() > 0:
            errorlist.append("Cannot delete person that is a spouse")
        if self.photographed.all().count() > 0:
            errorlist.append("Cannot delete person that is a photographer")
        return errorlist

    def fix_ascendants(self, cache=None, do_descendants=True):
        self._fix_ascendants(
            ["mother", "father"], person_ascendant, cache, do_descendants)

    def save(self, *args, **kwargs):
        super(person, self).save(*args, **kwargs)
        self.fix_ascendants()

    def _queryset(self):
        queryset = person.objects.all()
        queryset = queryset.select_related(
            'cover_photo', 'mother', 'father', 'spouse', 'home', 'work')
        queryset = queryset.prefetch_related('cover_photo__photo_file_set')
        return queryset

    # spouses

    def spouses(self):
        return self._queryset().filter(
            Q(pk=self.spouse_id) |
            Q(spouse__id=self.pk)
        )

    # grand parents generation

    def grandparents(self):
        parents = self.parents()
        return self._queryset().filter(
            Q(father_of__in=parents) |
            Q(mother_of__in=parents))

    # parents generation

    def uncles_aunts(self):
        parents = [i.pk for i in self.parents()]
        grandparents = self.grandparents()
        return self._queryset().filter(
            Q(father__in=grandparents) |
            Q(mother__in=grandparents)).exclude(pk__in=parents)

    def parents(self):
        results = []
        if self.father is not None:
            results.append(self.father)
        if self.mother is not None:
            results.append(self.mother)
        return results

    # this generation

    def siblings(self):
        parents = self.parents()
        return self._queryset().filter(
            Q(father__in=parents) | Q(mother__in=parents)).exclude(pk=self.pk)

    def cousins(self):
        parents = self.uncles_aunts()
        return self._queryset().filter(
            Q(father__in=parents) | Q(mother__in=parents))

    # next generation

    def children(self):
        return self._queryset().filter(Q(father=self) | Q(mother=self))

    def nephews_nieces(self):
        parents = self.siblings()
        return self._queryset().filter(
            Q(father__in=parents) | Q(mother__in=parents))

    # grand children generation

    def grandchildren(self):
        children = self.children()
        return self._queryset().filter(
            Q(father__in=children) | Q(mother__in=children))

    def get_cover_photo(self):
        photo = None
        if self.cover_photo is not None:
            photo = self.cover_photo
        else:
            try:
                photo = self.photos.exclude(action='D').reverse()[0]
            except IndexError:
                pass
        return photo


class feedback(HierarchyModel):
    cover_photo = models.ForeignKey(
        'photo', related_name="feedbacks",
        on_delete=models.CASCADE)
    parent = models.ForeignKey(
        'self', related_name='children', null=True, blank=True,
        on_delete=models.CASCADE)
    rating = models.IntegerField()
    comment = models.TextField(null=True, blank=True)
    objects = managers.FeedbackManager()

    # Information about the user leaving the comment
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        blank=True, null=True, related_name="photos_feedbacks",
        on_delete=models.SET_NULL)
    user_name = models.CharField(max_length=50, null=True, blank=True)
    user_email = models.EmailField(null=True, blank=True)
    user_url = models.URLField(null=True, blank=True)

    # Metadata about the comment
    submit_datetime = models.DateTimeField()
    utc_offset = models.IntegerField()
    ip_address = models.GenericIPAddressField(
        blank=True, null=True, unpack_ipv4=True)
    is_public = models.BooleanField(default=True)
    is_removed = models.BooleanField(default=False)

    class Meta:
        ordering = ('submit_datetime',)
        permissions = (
            ("can_moderate", "Can moderate"),
        )

    def save(self, *args, **kwargs):
        if self.submit_datetime is None:
            value = datetime.datetime.now(dateutil.tz.tzlocal())
            self.submit_datetime = value.astimezone(pytz.utc) \
                .replace(tzinfo=None)
            self.utc_offset = value.utcoffset().seconds / 60
        super(feedback, self).save(*args, **kwargs)
        self.fix_ascendants()

    def fix_ascendants(self, cache=None, do_descendants=True):
        self._fix_ascendants(
            ["parent"], feedback_ascendant, cache, do_descendants)


# ---------------------------------------------------------------------------


@python_2_unicode_compatible
class photo(BaseModel):
    name = models.CharField(max_length=128, db_index=True)
    path = models.CharField(max_length=255, db_index=True)
    size = models.IntegerField(null=True, blank=True)
    title = models.CharField(
        max_length=64, null=True, blank=True, db_index=True)
    photographer = models.ForeignKey(
        person, null=True, blank=True, related_name='photographed',
        on_delete=models.SET_NULL)
    place = models.ForeignKey(
        place, null=True, blank=True, related_name='photos',
        on_delete=models.SET_NULL)
    view = models.CharField(max_length=64, null=True, blank=True)
    rating = models.FloatField(null=True, blank=True, db_index=True)
    description = models.TextField(null=True, blank=True)
    utc_offset = models.IntegerField()
    datetime = models.DateTimeField(db_index=True)
    camera_make = models.CharField(max_length=32, null=True, blank=True)
    camera_model = models.CharField(max_length=32, null=True, blank=True)
    flash_used = models.CharField(max_length=1, null=True, blank=True)
    focal_length = models.CharField(max_length=64, null=True, blank=True)
    exposure = models.CharField(max_length=64, null=True, blank=True)
    compression = models.CharField(max_length=64, null=True, blank=True)
    aperture = models.CharField(max_length=16, null=True, blank=True)
    level = models.IntegerField()
    iso_equiv = models.CharField(max_length=8, null=True, blank=True)
    metering_mode = models.CharField(max_length=32, null=True, blank=True)
    focus_dist = models.CharField(max_length=20, null=True, blank=True)
    ccd_width = models.CharField(max_length=16, null=True, blank=True)
    comment = models.TextField(null=True, blank=True)
    action = models.CharField(
        max_length=4, null=True, blank=True,
        choices=PHOTO_ACTION, db_index=True)
    timestamp = models.DateTimeField(auto_now_add=True)

    albums = models.ManyToManyField(
        album, through='photo_album', related_name='photos')
    categorys = models.ManyToManyField(
        category, through='photo_category', related_name='photos')
    persons = models.ManyToManyField(
        person, through='photo_person', related_name='photos')
    relations = models.ManyToManyField(
        'self', through='photo_relation', symmetrical=False)

    objects = managers.PhotoManager()

    class Meta:
        ordering = ['datetime', 'id']

    def __str__(self):
        if self.title is None or self.title == "":
            return self.name
        else:
            return self.title

    @property
    def timezone(self):
        return pytz.FixedOffset(self.utc_offset)

    def fix_rating(self):
        feedbacks = self.feedbacks.filter(is_removed=False)
        if len(feedbacks) == 0:
            self.rating = None
            self.save()
            return

        rating = 0
        n = 0
        for feedback in feedbacks:
            n = n + 1
            rating = rating + feedback.rating

        self.rating = rating / n
        self.save()

    # Internal functions for creating new photos

    @classmethod
    def build_photo_dir(cls, utc_datetime, utc_offset):
        to_tz = pytz.FixedOffset(utc_offset)
        to_offset = datetime.timedelta(minutes=utc_offset)
        local = utc_datetime
        local = (local + to_offset).replace(tzinfo=to_tz)
        return "%04d/%02d/%02d" % (local.year, local.month, local.day)

    # Public methods

    def get_orig(self):
        return self.photo_file_set.get(size_key='orig')

    def get_thumb(self, size_key, mime_type):
        try:
            return self.photo_file_set.get(size_key=size_key, mime_type=mime_type, is_video=False)
        except photo_file.DoesNotExist:
            return None

    def get_thumbs(self):
        return list(self.photo_file_set.filter(is_video=False))

    def get_video(self, size_key, mime_type):
        try:
            return self.photo_file_set.get(size_key=size_key, mime_type=mime_type, is_video=True)
        except photo_file.DoesNotExist:
            return None

    def get_videos(self):
        return list(self.photo_file_set.filter(is_video=True))

    def check_files(self):
        errors = []

        for pt in self.photo_file_set.all():
            errors.extend(pt.check_file())

        return errors

    # Other stuff
    def check_delete(self):
        errorlist = []
        return errorlist

    def delete(self):
        self.check_files()
        for pt in self.photo_file_set.all():
            pt.delete()
        super(photo, self).delete()
    delete.alters_data = True

    def rotate_orig(self, amount):
        self.check_files()
        pt = self.get_orig()
        pt.rotate(amount)
        return
    rotate_orig.alters_data = True

    def rotate_all(self, amount):
        self.check_files()
        for pt in self.photo_file_set.all():
            pt.rotate(amount)
        return
    rotate_all.alters_data = True

    def generate_thumbnails(self, overwrite):
        self.check_files()

        orig = self.get_orig()
        m = media.get_media(orig.get_path())
        umask = os.umask(0o022)

        for size_key, s in settings.IMAGE_SIZES.items():
            try:
                pt = photo_file.objects.get(photo=self, size_key=size_key, mime_type="image/jpeg")
            except photo_file.DoesNotExist:
                photo_dir = self.path
                pt = photo_file(photo=self, size_key=size_key, mime_type="image/jpeg")
                pt.dir = photo_file.build_dir(False, size_key, photo_dir)
                pt.name = _swap_extension(self.name, 'jpg')
                photo_file.check_filename_free(pt.dir, pt.name)

            dst = pt.get_path()

            if not os.path.lexists(os.path.dirname(dst)):
                os.makedirs(os.path.dirname(dst), 0o755)
            if overwrite or not os.path.lexists(dst):
                m.create_thumbnail(dst, s)

            mt = media.get_media(dst)
            xy_size = mt.get_size()

            pt.is_video = False
            pt.sha256_hash = mt.get_sha256_hash()
            pt.num_bytes = mt.get_num_bytes()
            pt.width = xy_size[0]
            pt.height = xy_size[1]
            pt.save()

        os.umask(umask)
        return
    generate_thumbnails.alters_data = True

    def generate_videos(self, overwrite):
        self.check_files()

        orig = self.get_orig()
        m = media.get_media(orig.get_path())
        umask = os.umask(0o022)

        if orig.is_video and m.is_video():
            for size_key, s in settings.VIDEO_SIZES.items():
                for mime_type, f in settings.VIDEO_FORMATS.items():
                    try:
                        pt = photo_file.objects.get(photo=self, size_key=size_key, mime_type=mime_type)
                    except photo_file.DoesNotExist:
                        photo_dir = self.path
                        pt = photo_file(photo=self, size_key=size_key, mime_type=mime_type)
                        pt.dir = photo_file.build_dir(True, size_key, photo_dir)
                        pt.name = _swap_extension(self.name, f['extension'])
                        photo_file.check_filename_free(pt.dir, pt.name)

                    dst = pt.get_path()

                    if not os.path.lexists(os.path.dirname(dst)):
                        os.makedirs(os.path.dirname(dst), 0o755)
                    if overwrite or not os.path.lexists(dst):
                        m.create_video(dst, s, mime_type)

                    mt = media.get_media(dst)
                    xy_size = mt.get_size()

                    pt.is_video = True
                    pt.sha256_hash = mt.get_sha256_hash()
                    pt.num_bytes = mt.get_num_bytes()
                    pt.width = xy_size[0]
                    pt.height = xy_size[1]
                    pt.save()

        os.umask(umask)
        return
    generate_videos.alters_data = True

    def update_size(self):
        for pt in self.photo_file_set.all():
            pt.update_size()
        return
    update_size.alters_data = True

    def move(self, new_name=None):
        self.check_files()

        if new_name is None:
            new_name = self.name

        new_dir = self.build_photo_dir(self.datetime, self.utc_offset)

        for pt in self.photo_file_set.all():
            pt.move(new_dir, new_name)

        # Hurry! Save the new name before we forgot
        self.name = new_name
        self.path = new_dir
        # ... err what did we just do?
        self.save()
        return
    move.alters_data = True


# ---------------------------------------------------------------------------


class photo_file(BaseModel):
    photo = models.ForeignKey(photo, on_delete=models.CASCADE)
    size_key = models.CharField(max_length=10)
    width = models.IntegerField()
    height = models.IntegerField()
    mime_type = models.CharField(max_length=20)
    dir = models.CharField(max_length=128)
    name = models.CharField(max_length=128)
    is_video = models.BooleanField()
    sha256_hash = models.BinaryField(max_length=32)
    num_bytes = models.IntegerField()

    class Meta:
        unique_together = (
            ("photo", "size_key", "mime_type"),
            ("dir", "name"),
        )
        indexes = [
            models.Index(fields=['size_key', 'sha256_hash']),
        ]

    def get_path(self):
        return os.path.join(
            settings.IMAGE_PATH,
            self.dir,
            self.name,
        )

    def get_url(self):
        return iri_to_uri(os.path.join(
            settings.IMAGE_URL,
            urlquote(self.dir),
            urlquote(self.name),
        ))

    def delete(self):
        path = self.get_path()
        if os.path.lexists(path):
            os.unlink(path)
        super(photo_file, self).delete()
    delete.alters_data = True

    def rotate(self, amount):
        m = media.get_media(self.get_path())
        m.rotate(amount)
        self.update_size()
        return
    rotate.alters_data = True

    def move(self, new_photo_dir, new_photo_name):
        old_path = self.get_path()

        # Ensure new_name has correct extension
        _, extension = os.path.splitext(self.name)
        new_short_name, _ = os.path.splitext(new_photo_name)
        new_name = f"{new_short_name}{extension}"

        # Get full file path
        new_dir = self.build_dir(self.is_video, self.size_key, new_photo_dir)
        self.dir = new_dir
        self.name = new_name
        new_path = self.get_path()

        if old_path != new_path:
            # generate new non-conflicting name
            new_dir, new_name = self.get_new_name(new_dir, new_name)

            # Get revised full file path
            self.dir = new_dir
            self.name = new_name
            new_path = self.get_path()

            full_old_path = os.path.join(settings.IMAGE_PATH, old_path)
            full_new_path = os.path.join(settings.IMAGE_PATH, new_path)

            # Actually move the file
            print(f"Moving '{full_old_path}' to '{full_new_path}'.")
            if not os.path.lexists(os.path.dirname(full_new_path)):
                os.makedirs(os.path.dirname(full_new_path), 0o755)
            shutil.move(full_old_path, full_new_path)

            self.save()
    move.alters_data = True

    def update_size(self):
        dst = self.get_path()
        mt = media.get_media(dst)
        width, height = mt.get_size()
        self.width = width
        self.height = height
        self.sha256_hash = mt.get_sha256_hash()
        self.num_bytes = mt.get_num_bytes()
        self.save()
    update_size.alters_data = True

    @classmethod
    def check_all_files(cls):
        errors = []

        for pt in photo_file.objects.all():
            errors.extend(pt.check_file())

        return errors

    def check_file(self):
        errors = []
        dst = self.get_path()
        full_dst = os.path.join(settings.IMAGE_PATH, dst)

        # Duplicates should never happen due to unique constraint.
        duplicates = photo_file.objects.filter(
            dir=self.dir, name=self.name).exclude(pk=self.pk)
        if duplicates.count() > 0:
            errors.append(f"{dst}: path is duplicated")

        if os.path.lexists(full_dst):
            mt = media.get_media(dst)
            width, height = mt.get_size()

            if self.width != width:
                errors.append(f"{dst}: has incorrect width.")

            if self.height != height:
                errors.append(f"{dst}: has incorrect height.")

            if bytes(self.sha256_hash) != mt.get_sha256_hash():
                errors.append(f"{dst}: has incorrect sha256 hash.")

            if self.num_bytes != mt.get_num_bytes():
                errors.append(f"{dst}: has incorrect num bytes.")
        else:
            errors.append(f"{dst}: File is missing")

        return errors

    @classmethod
    def get_conflicts(cls, new_dir, new_name, size_key, sha256_hash):
        # check for conflicts or errors
        (short_name, extension) = os.path.splitext(new_name)
        dups = photo_file.objects.filter(
            Q(dir=new_dir, name__startswith=f"{short_name}.")
            | Q(size_key=size_key, sha256_hash=sha256_hash)
        )
        return dups

    @classmethod
    def get_conflicting_names(cls, new_dir, new_name):
        # check for conflicts or errors
        (short_name, extension) = os.path.splitext(new_name)
        dups = photo_file.objects.filter(
            Q(dir=new_dir, name__startswith=f"{short_name}.")
        )
        return dups

    @classmethod
    def check_filename_free(cls, new_dir, new_name):
        full_path = os.path.join(settings.IMAGE_PATH, new_dir, new_name)
        if os.path.lexists(full_path):
            raise RuntimeError(
                "file already exists at %s but has no db entry" % full_path)

    @classmethod
    def get_new_name(cls, new_dir, new_name):
        append = ['', 'a', 'b', 'c', 'd']

        for a in append:
            (short_name, extension) = os.path.splitext(new_name)
            tmp_name = short_name + a + extension
            dups = cls.get_conflicting_names(new_dir, tmp_name)
            count = dups.count()
            if count == 0:
                cls.check_filename_free(new_dir, tmp_name)
                return new_dir, tmp_name

        raise RuntimeError(
            "Cannot get non-conflicting filename for %s/%s" %
            (new_dir, new_name))

    @classmethod
    def build_dir(cls, is_video, size_key, photo_dir):
        if size_key == "orig":
            return os.path.join("orig", photo_dir)
        elif not is_video and size_key in settings.IMAGE_SIZES:
            return os.path.join("thumb", size_key, photo_dir)
        elif is_video and size_key in settings.VIDEO_SIZES:
            return os.path.join("video", size_key, photo_dir)
        else:
            raise RuntimeError(f"Unknown image size '{size_key}'")


class photo_thumb(BaseModel):
    photo = models.ForeignKey(photo, on_delete=models.CASCADE)
    size = models.CharField(max_length=10, db_index=True)
    width = models.IntegerField(null=True, blank=True)
    height = models.IntegerField(null=True, blank=True)


class photo_video(BaseModel):
    photo = models.ForeignKey(photo, on_delete=models.CASCADE)
    size = models.CharField(max_length=10, db_index=True)
    width = models.IntegerField(null=True, blank=True)
    height = models.IntegerField(null=True, blank=True)
    format = models.CharField(max_length=20)
    extension = models.CharField(max_length=4)


class photo_album(BaseModel):
    photo = models.ForeignKey(photo, on_delete=models.CASCADE)
    album = models.ForeignKey(album, on_delete=models.CASCADE)


class photo_category(BaseModel):
    photo = models.ForeignKey(photo, on_delete=models.CASCADE)
    category = models.ForeignKey(category, on_delete=models.CASCADE)


class photo_person(BaseModel):
    photo = models.ForeignKey(photo, on_delete=models.CASCADE)
    person = models.ForeignKey(person, on_delete=models.CASCADE)
    position = models.IntegerField(null=True, blank=True)

    class Meta:
        ordering = ['position']


@python_2_unicode_compatible
class photo_relation(BaseModel):
    photo_1 = models.ForeignKey(
        photo, db_column="photo_id_1", related_name="relations_1",
        on_delete=models.CASCADE)
    photo_2 = models.ForeignKey(
        photo, db_column="photo_id_2", related_name="relations_2",
        on_delete=models.CASCADE)
    desc_1 = models.CharField(max_length=384)
    desc_2 = models.CharField(max_length=384)

    class Meta:
        unique_together = ('photo_1', 'photo_2')
        ordering = ['photo_1', 'photo_2']

    def __str__(self):
        return "relationship '%s' to '%s'" % (self.photo_1, self.photo_2)


# ---------------------------------------------------------------------------


class album_ascendant(BaseModel):
    ascendant = models.ForeignKey(album, related_name='descendant_set',
                                  on_delete=models.CASCADE)
    descendant = models.ForeignKey(album, related_name='ascendant_set',
                                   on_delete=models.CASCADE)
    position = models.IntegerField()

    class Meta:
        ordering = ['position']


class category_ascendant(BaseModel):
    ascendant = models.ForeignKey(category, related_name='descendant_set',
                                  on_delete=models.CASCADE)
    descendant = models.ForeignKey(category, related_name='ascendant_set',
                                   on_delete=models.CASCADE)
    position = models.IntegerField()

    class Meta:
        ordering = ['position']


class place_ascendant(BaseModel):
    ascendant = models.ForeignKey(place, related_name='descendant_set',
                                  on_delete=models.CASCADE)
    descendant = models.ForeignKey(place, related_name='ascendant_set',
                                   on_delete=models.CASCADE)
    position = models.IntegerField()

    class Meta:
        ordering = ['position']


class person_ascendant(BaseModel):
    ascendant = models.ForeignKey(person, related_name='descendant_set',
                                  on_delete=models.CASCADE)
    descendant = models.ForeignKey(person, related_name='ascendant_set',
                                   on_delete=models.CASCADE)
    position = models.IntegerField()

    class Meta:
        ordering = ['position']


class feedback_ascendant(BaseModel):
    ascendant = models.ForeignKey(feedback, related_name='descendant_set',
                                  on_delete=models.CASCADE)
    descendant = models.ForeignKey(feedback, related_name='ascendant_set',
                                   on_delete=models.CASCADE)
    position = models.IntegerField()

    class Meta:
        ordering = ['position']
