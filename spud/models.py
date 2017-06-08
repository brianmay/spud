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

from django.conf import settings
from django.db import models
from django.db.models import Q
from django.utils.encoding import iri_to_uri
from django.utils.http import urlquote
from django.utils.encoding import python_2_unicode_compatible

import dateutil.tz
import os
import os.path
import datetime
import pytz
import shutil
import filecmp

from . import media
from . import managers

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
            'descendant__cover_photo__photo_thumb_set')
        queryset = queryset.prefetch_related(
            'descendant__cover_photo__photo_video_set')

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
            'ascendant__cover_photo__photo_thumb_set')
        queryset = queryset.prefetch_related(
            'ascendant__cover_photo__photo_video_set')

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
        queryset = queryset.prefetch_related('cover_photo__photo_thumb_set')
        queryset = queryset.prefetch_related('cover_photo__photo_video_set')
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
    focus_dist = models.CharField(max_length=16, null=True, blank=True)
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
    def _get_thumb_path(cls, size, path, name):
        if size in settings.IMAGE_SIZES:
            (shortname, _) = os.path.splitext(name)
            return os.path.join(
                settings.IMAGE_PATH, "thumb",
                size, path, shortname + ".jpg")
        else:
            raise RuntimeError("unknown image size %s" % (size))

    @classmethod
    def _get_video_path(cls, size, path, name, extension):
        if size in settings.VIDEO_SIZES:
            (shortname, _) = os.path.splitext(name)
            return os.path.join(
                settings.IMAGE_PATH, "video",
                size, path, shortname + "." + extension)
        else:
            raise RuntimeError("unknown image size %s" % (size))

    @classmethod
    def _get_orig_path(cls, path, name):
        return os.path.join(settings.IMAGE_PATH, "orig", path, name)

    # Public methods

    def get_orig_path(self):
        return self._get_orig_path(self.path, self.name)

    def get_orig_url(self):
        return iri_to_uri(os.path.join(
            settings.IMAGE_URL, "orig",
            urlquote(self.path), urlquote(self.name)))

    def get_thumb(self, size):
        try:
            return self.photo_thumb_set.get(size=size)
        except photo_thumb.DoesNotExist:
            return None

    def get_thumbs(self):
        return list(self.photo_thumb_set.all())

    def get_video(self, size, format):
        try:
            return self.photo_video_set.get(size=size, format=format)
        except photo_thumb.DoesNotExist:
            return None

    def get_videos(self):
        return list(self.photo_video_set.all())

    # Other stuff
    def check_delete(self):
        errorlist = []
        return errorlist

    def delete(self):
        if self.name:
            path = self.get_orig_path()
            if os.path.lexists(path):
                os.unlink(path)
        for pt in self.photo_thumb_set.all():
            path = pt.get_path()
            if os.path.lexists(path):
                os.unlink(path)
        for pt in self.photo_video_set.all():
            path = pt.get_path()
            if os.path.lexists(path):
                os.unlink(path)
        super(photo, self).delete()
    delete.alters_data = True

    def rotate(self, amount):
        m = media.get_media(self.get_orig_path())
        m.rotate(amount)

        (width, height) = m.get_size()
        self.size = os.path.getsize(self.get_orig_path())

        self.width = width
        self.height = height
        return
    rotate.alters_data = True

    def generate_thumbnails(self, overwrite):
        m = media.get_media(self.get_orig_path())
        umask = os.umask(0o022)

        for size, s in settings.IMAGE_SIZES.items():
            dst = self._get_thumb_path(size, self.path, self.name)
            if not os.path.lexists(os.path.dirname(dst)):
                os.makedirs(os.path.dirname(dst), 0o755)
            if overwrite or not os.path.lexists(dst):
                xysize = m.create_thumbnail(dst, s)
            else:
                mt = media.get_media(dst)
                xysize = mt.get_size()
            pt, _ = photo_thumb.objects.get_or_create(photo=self, size=size)
            pt.width = xysize[0]
            pt.height = xysize[1]
            pt.save()

        os.umask(umask)
        return
    generate_thumbnails.alters_data = True

    def generate_videos(self, overwrite):
        m = media.get_media(self.get_orig_path())
        umask = os.umask(0o022)

        if m.is_video():
            for size, s in settings.VIDEO_SIZES.items():
                for format, f in settings.VIDEO_FORMATS.items():
                    dst = self._get_video_path(
                        size, self.path, self.name, f['extension'])
                    if not os.path.lexists(os.path.dirname(dst)):
                        os.makedirs(os.path.dirname(dst), 0o755)
                    if overwrite or not os.path.lexists(dst):
                        xysize = m.create_video(dst, s, format)
                    else:
                        mt = media.get_media(dst)
                        xysize = mt.get_size()
                    if xysize is not None:
                        pt, _ = photo_video.objects.get_or_create(
                            photo=self, size=size, format=format)
                        pt.extension = f['extension']
                        pt.width = xysize[0]
                        pt.height = xysize[1]
                        pt.save()

        os.umask(umask)
        return
    generate_videos.alters_data = True

    def update_size(self):
        for pt in self.photo_thumb_set.all():
            dst = pt.get_path()
            mt = media.get_media(dst)
            xysize = mt.get_size()
            pt.width = xysize[0]
            pt.height = xysize[1]
            pt.save()
        for pt in self.photo_video_set.all():
            dst = pt.get_path()
            mt = media.get_media(dst)
            xysize = mt.get_size()
            pt.width = xysize[0]
            pt.height = xysize[1]
            pt.save()
        return
    update_size.alters_data = True

    @classmethod
    def get_conflicts(cls, new_path, new_name):
        # check for conflicts or errors
        (shortname, extension) = os.path.splitext(new_name)
        dups = photo.objects.filter(
            path=new_path, name__startswith="%s." % (shortname))
        count = dups.count()
        if count > 0:
            return dups, count

        full_path = cls._get_orig_path(new_path, new_name)
        if os.path.lexists(full_path):
            raise RuntimeError(
                "file already exists at %s but has no db entry" % full_path)

        for size in settings.IMAGE_SIZES:
            full_path = cls._get_thumb_path(size, new_path, new_name)
            if os.path.lexists(full_path):
                raise RuntimeError(
                    "file already exists at %s but has no db entry" %
                    full_path)

        return [], 0

    @classmethod
    def get_new_name(cls, old_file, new_path, new_name):
        append = ['', 'a', 'b', 'c', 'd']

        for a in append:
            (shortname, extension) = os.path.splitext(new_name)
            tmp_name = shortname + a + extension
            dups, count = cls.get_conflicts(new_path, tmp_name)
            if count == 0:
                return new_path, tmp_name
            elif count > 1:
                raise RuntimeError(
                    "Multiple DB entries exist for %s/%s" %
                    (new_path, tmp_name))

            dupfile = dups[0].get_orig_path()
            if filecmp.cmp(old_file, dupfile):
                raise PhotoAlreadyExistsError(
                    "same photo %d already exists at %s/%s as %s/%s" %
                    (dups[0].pk, new_path, new_name,
                        dups[0].path, dups[0].name))

        raise RuntimeError(
            "Cannot get non-conflicting filename for %s/%s" %
            (new_path, new_name))

    def move(self, new_name=None):
        move_list = []

        # get current path
        old_orig_path = self.get_orig_path()
        if not os.path.lexists(old_orig_path):
            raise RuntimeError(
                "Source '%s' not already exists" % (old_orig_path))

        # Work out new path
        from_tz = pytz.utc
        to_tz = pytz.FixedOffset(self.utc_offset)
        to_offset = datetime.timedelta(minutes=self.utc_offset)
        local = from_tz.localize(self.datetime)
        local = (local + to_offset).replace(tzinfo=to_tz)
        if new_name is None:
            new_name = self.name
        new_path = "%04d/%02d/%02d" % (local.year, local.month, local.day)

        # Check that something has changed
        if self.path == new_path and self.name == new_name:
            # nothing to do, good bye cruel world
            return

        # generate new non-conflicting name
        new_path, new_name = photo.get_new_name(
            old_orig_path, new_path, new_name)

        # create move list
        move_list.append(
            (old_orig_path, self._get_orig_path(new_path, new_name))
        )
        for pt in self.photo_thumb_set.all():
            src = pt.get_path()
            if not os.path.lexists(src):
                raise RuntimeError("Source '%s' not already exists" % (src))
            move_list.append(
                (src, self._get_thumb_path(pt.size, new_path, new_name))
            )
        for pt in self.photo_video_set.all():
            src = pt.get_path()
            if not os.path.lexists(src):
                raise RuntimeError("Source '%s' not already exists" % (src))
            move_list.append(
                (src, self._get_video_path(
                    pt.size, new_path, new_name, pt.extension))
            )

        # move the files
        for src, dst in move_list:
            if src != dst:
                print("Moving '%s' to '%s'" % (src, dst))
                if not os.path.lexists(os.path.dirname(dst)):
                    os.makedirs(os.path.dirname(dst), 0o755)
                shutil.move(src, dst)

        # Hurry! Save the new path and name before we forgot
        self.path = new_path
        self.name = new_name
        # ... err what did we just do?
        self.save()
        return
    move.alters_data = True

    def error_list(self):
        error_list = []

        if settings.IMAGE_CHECK_EXISTS:
            dst = self.get_orig_path()
            if not os.path.lexists(dst):
                error_list.append("Original file '%s' is missing" % (dst))

            for pt in self.photo_thumb_set.all():
                dst = pt.get_path()
                if not os.path.lexists(dst):
                    error_list.append(
                        "Thumb file '%s' for size '%s' is missing" %
                        (dst, pt.size))

            for pt in self.photo_video_set.all():
                dst = pt.get_path()
                if not os.path.lexists(dst):
                    error_list.append(
                        "Video file '%s' for size '%s' is missing" %
                        (dst, pt.size))

        duplicates = photo.objects.filter(
            path=self.path, name=self.name).exclude(pk=self.pk)
        if duplicates.count() > 0:
            error_list.append(
                "photo path %s/%s is duplicated" % (self.path, self.name))

        return error_list


# ---------------------------------------------------------------------------


class photo_thumb(BaseModel):
    photo = models.ForeignKey(photo, on_delete=models.CASCADE)
    size = models.CharField(max_length=10, db_index=True)
    width = models.IntegerField(null=True, blank=True)
    height = models.IntegerField(null=True, blank=True)

    def get_path(self):
        photo = self.photo
        (shortname, _) = os.path.splitext(photo.name)
        return os.path.join(
            settings.IMAGE_PATH, "thumb", self.size,
            photo.path, shortname + ".jpg")

    def get_url(self):
        photo = self.photo
        (shortname, _) = os.path.splitext(photo.name)
        return iri_to_uri(os.path.join(
            settings.IMAGE_URL, "thumb", urlquote(self.size),
            urlquote(photo.path), urlquote(shortname + ".jpg")))

    def delete(self):
        path = self.get_path()
        if os.path.lexists(path):
            os.unlink(path)


class photo_video(BaseModel):
    photo = models.ForeignKey(photo, on_delete=models.CASCADE)
    size = models.CharField(max_length=10, db_index=True)
    width = models.IntegerField(null=True, blank=True)
    height = models.IntegerField(null=True, blank=True)
    format = models.CharField(max_length=20)
    extension = models.CharField(max_length=4)

    def get_path(self):
        photo = self.photo
        (shortname, _) = os.path.splitext(photo.name)
        return os.path.join(
            settings.IMAGE_PATH, "video", self.size,
            photo.path, shortname + "." + self.extension)

    def get_url(self):
        photo = self.photo
        (shortname, _) = os.path.splitext(photo.name)
        return iri_to_uri(os.path.join(
            settings.IMAGE_URL, "video", urlquote(self.size),
            urlquote(photo.path), urlquote(shortname + "." + self.extension)))

    def delete(self):
        path = self.get_path()
        if os.path.lexists(path):
            os.unlink(path)


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
