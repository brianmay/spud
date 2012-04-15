# This is an auto-generated Django model module.
# You'll have to do the following manually to clean this up:
#     * Rearrange models' order
#     * Make sure each model has one field with primary_key=True
# Feel free to rename the models, but don't rename db_table values or field names.
#
# Also note: You'll have to insert the output of 'django-admin.py sqlcustom [appname]'
# into your database.

from django.conf import settings

from django.db import models
from django.db.models import Q

import os
import datetime
import pytz
import shutil
import filecmp

from spud import media

SEX_CHOICES = (
    ('1', 'male'),
    ('2', 'female'),
)

PHOTO_ACTION = (
    ('D', 'delete'),
    ('S', 'regenerate size'),
    ('R', 'regenerate thumbnail'),
    ('M', 'move photo'),
    ('auto', 'rotate automatic'),
    ('90', 'rotate 90 degrees clockwise'),
    ('180', 'rotate 180 degrees clockwise'),
    ('270', 'rotate 270 degrees clockwise'),
)


class photo_already_exists_error(Exception):
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

class base_model(models.Model):

    class Meta:
        abstract = True

    def error_list(self):
        error_list = []
        return error_list

    # are there any reasons why this object should not be deleted?
    def check_delete(self):
        error_list = []
        return error_list

# ---------------------------------------------------------------------------

class place(base_model):
    place_id = models.AutoField(primary_key=True)
    parent_place = models.ForeignKey('self', related_name='children', null=True, blank=True)
    title = models.CharField(max_length=192, db_index=True)
    address = models.CharField(max_length=192, blank=True)
    address2 = models.CharField(max_length=192, blank=True)
    city = models.CharField(max_length=96, blank=True)
    state = models.CharField(max_length=96, blank=True)
    zip = models.CharField(max_length=30, blank=True)
    country = models.CharField(max_length=96, blank=True)
    url = models.CharField(max_length=3072, blank=True)
    urldesc = models.CharField(max_length=96, blank=True)
    cover_photo = models.ForeignKey('photo', related_name='place_cover_of', null=True, blank=True)
    notes = models.TextField(blank=True)

    class Meta:
        ordering = [ 'title' ]

    def __unicode__(self):
        return self.title

    def _get_descendants(self, descendants):
        if self in descendants:
            return descendants

        descendants.append(self)

        for place in self.children.all():
            place._get_descendants(descendants)

    def get_descendants(self):
        descendants = []
        self._get_descendants(descendants)
        return descendants

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

    def delete(self):
        self.work_of.clear()
        self.home_of.clear()
        super(place, self).delete()

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

class album(base_model):
    album_id = models.AutoField(primary_key=True)
    parent_album = models.ForeignKey('self', related_name='children', null=True, blank=True)
    album = models.CharField(max_length=96, db_index=True)
    album_description = models.TextField(blank=True)
    cover_photo = models.ForeignKey('photo', related_name='album_cover_of', null=True, blank=True)
    sortname = models.CharField(max_length=96, blank=True)
    sortorder = models.CharField(max_length=96, blank=True)
    revised = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = [ 'sortname', 'sortorder', 'album' ]

    def __unicode__(self):
        return self.album

    def _get_descendants(self, descendants):
        if self in descendants:
            return descendants

        descendants.append(self)

        for album in self.children.all():
            album._get_descendants(descendants)

    def get_descendants(self):
        descendants = []
        self._get_descendants(descendants)
        return descendants

    def check_delete(self):
        errorlist = []
        if self.photos.all().count() > 0:
            errorlist.append("Cannot delete album with photos")
        if self.children.all().count() > 0:
            errorlist.append("Cannot delete album with children")
        return errorlist

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

class category(base_model):
    category_id = models.AutoField(primary_key=True)
    parent_category = models.ForeignKey('self', related_name='children', null=True, blank=True)
    category = models.CharField(max_length=96, db_index=True)
    category_description = models.TextField(blank=True)
    cover_photo = models.ForeignKey('photo', related_name='category_cover_of', null=True, blank=True)
    sortname = models.CharField(max_length=96, blank=True)
    sortorder = models.CharField(max_length=96, blank=True)

    class Meta:
        ordering = [ 'sortname', 'sortorder', 'category' ]

    def __unicode__(self):
        return self.category

    def _get_descendants(self, descendants):
        if self in descendants:
            return descendants

        descendants.append(self)

        for category in self.children.all():
            category._get_descendants(descendants)

    def get_descendants(self):
        descendants = []
        self._get_descendants(descendants)
        return descendants

    def check_delete(self):
        errorlist = []
        if self.photos.all().count() > 0:
            errorlist.append("Cannot delete category object with photos")
        if self.children.all().count() > 0:
            errorlist.append("Cannot delete category object with children")
        return errorlist

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

class person(base_model):
    person_id = models.AutoField(primary_key=True)
    first_name = models.CharField(max_length=96, blank=True, db_index=True)
    last_name = models.CharField(max_length=96, blank=True, db_index=True)
    middle_name = models.CharField(max_length=96, blank=True)
    called = models.CharField(max_length=48, blank=True)
    gender = models.CharField(max_length=1, blank=True, choices=SEX_CHOICES)
    dob = models.DateField(null=True, blank=True)
    dod = models.DateField(null=True, blank=True)
    home = models.ForeignKey(place, null=True, blank=True, related_name="home_of")
    work = models.ForeignKey(place, null=True, blank=True, related_name="work_of")
    father = models.ForeignKey('self', null=True, blank=True, related_name='father_of')
    mother = models.ForeignKey('self', null=True, blank=True, related_name='mother_of')
    spouse = models.ForeignKey('self', null=True, blank=True, related_name='reverse_spouses')
    notes = models.TextField(blank=True)
    cover_photo = models.ForeignKey('photo', related_name='person_cover_of', null=True, blank=True)
    email = models.CharField(max_length=192, blank=True)

    class Meta:
        ordering = [ 'last_name', 'first_name' ]

    def __unicode__(self):
        result = u"%s"%(self.first_name)
        if self.middle_name is not None and self.middle_name!="":
            result += u" %s"%(self.middle_name)
        if self.called is not None and self.called!="":
            result += u" (%s)"%(self.called)
        if self.last_name is not None and self.last_name!="":
            result += u" %s"%(self.last_name)
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

    def delete(self):
        self.father_of.clear()
        self.mother_of.clear()
        self.reverse_spouses.clear()
        self.photographed.clear()
        super(person, self).delete()

    # grand parents generation

    def grandparents(self):
        parents = self.parents()
        return person.objects.filter(Q(father_of__in=parents) | Q(mother_of__in=parents))

    # parents generation

    def uncles_aunts(self):
        parents = [ i.pk for i in self.parents() ]
        grandparents = self.grandparents()
        return person.objects.filter(Q(father__in=grandparents) | Q(mother__in=grandparents)).exclude(pk__in=parents)

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
        return person.objects.filter(Q(father__in=parents) | Q(mother__in=parents)).exclude(pk=self.pk)

    def cousins(self):
        parents = self.uncles_aunts()
        return person.objects.filter(Q(father__in=parents) | Q(mother__in=parents))

    # next generation

    def children(self):
        return person.objects.filter(Q(father=self) | Q(mother=self))

    def nephews_nieces(self):
        parents = self.siblings()
        return person.objects.filter(Q(father__in=parents) | Q(mother__in=parents))

    # grand children generation

    def grandchildren(self):
        children = self.children()
        return person.objects.filter(Q(father__in=children) | Q(mother__in=children))

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

# ---------------------------------------------------------------------------

class photo(base_model):
    photo_id = models.AutoField(primary_key=True)
    name = models.CharField(max_length=128, blank=True, db_index=True)
    path = models.CharField(max_length=255, blank=True, db_index=True)
    size = models.IntegerField(null=True, blank=True)
    title = models.CharField(max_length=64, blank=True, db_index=True)
    photographer = models.ForeignKey(person, null=True, blank=True, related_name='photographed')
    location = models.ForeignKey(place, null=True, blank=True, related_name='photos')
    view = models.CharField(max_length=64, blank=True)
    rating = models.FloatField(null=True, blank=True, db_index=True)
    description = models.TextField(blank=True)
    utc_offset = models.IntegerField()
    datetime = models.DateTimeField(db_index=True)
    camera_make = models.CharField(max_length=32, blank=True)
    camera_model = models.CharField(max_length=32, blank=True)
    flash_used = models.CharField(max_length=1, blank=True)
    focal_length = models.CharField(max_length=64, blank=True)
    exposure = models.CharField(max_length=64, blank=True)
    compression = models.CharField(max_length=64, blank=True)
    aperture = models.CharField(max_length=16, blank=True)
    level = models.IntegerField()
    iso_equiv = models.CharField(max_length=8, blank=True)
    metering_mode = models.CharField(max_length=32, blank=True)
    focus_dist = models.CharField(max_length=16, blank=True)
    ccd_width = models.CharField(max_length=16, blank=True)
    comment = models.TextField(blank=True)
    action = models.CharField(max_length=4, null=True, blank=True, choices=PHOTO_ACTION, db_index=True)
    timestamp = models.DateTimeField()

    albums = models.ManyToManyField(album, through='photo_album', related_name='photos')
    categorys = models.ManyToManyField(category, through='photo_category', related_name='photos')
    persons = models.ManyToManyField(person, through='photo_person', related_name='photos')
    relations = models.ManyToManyField('self', through='photo_relation',symmetrical=False)

    class Meta:
        ordering = [ 'datetime' ]

    def __unicode__(self):
        if self.title is None or self.title=="":
                return self.name
        else:
                return self.title

    def get_thumb_path(self, size):
        if size in settings.IMAGE_SIZES:
            (shortname, _) = os.path.splitext(self.name)
            return u"%sthumb/%s/%s/%s.jpg"%(settings.IMAGE_PATH,size,self.path,shortname)
        else:
            raise RuntimeError("unknown image size %s"%(size))

    def get_orig_path(self):
        return u"%sorig/%s/%s"%(settings.IMAGE_PATH,self.path,self.name)

    def get_thumb(self, size):
        if size not in settings.IMAGE_SIZES:
            return None

        try:
            return self.photo_thumb_set.get(size=size)
        except photo_thumb.DoesNotExist:
            return None

    def get_style(self):
        if self.action is None:
            return ""
        elif self.action=="D":
            return "photo_D"
        elif (self.action=="R"
                or self.action=="M"
                or self.action=="auto"
                or self.action=="90" or self.action=="180" or self.action=="270"):
            return "photo_R"
        return ""

    # Other stuff
    def check_delete(self):
        errorlist = []
        return errorlist

    def delete(self):
        self.place_cover_of.clear()
        self.album_cover_of.clear()
        self.category_cover_of.clear()
        self.person_cover_of.clear()
        os.unlink(self.get_orig_path())
        for size in settings.IMAGE_SIZES:
            path = self.get_thumb_path(size)
            if os.path.lexists(path):
                os.unlink(path)
        super(photo, self).delete()
    delete.alters_data = True

    def rotate(self,amount):
        m = media.get_media(self.get_orig_path())
        m.rotate(amount)

        (width,height) = m.get_size()
        size = m.get_bytes()
        self.width = width
        self.height = height
        self.size = size
        return
    rotate.alters_data = True

    def generate_thumbnails(self,overwrite):
        m = media.get_media(self.get_orig_path())
        umask = os.umask(0022)

        for size, max in settings.IMAGE_SIZES.iteritems():
            dst = self.get_thumb_path(size)
            if not os.path.lexists(os.path.dirname(dst)):
                os.makedirs(os.path.dirname(dst),0755)
            if overwrite or not os.path.lexists(dst):
                xysize = m.create_thumbnail(dst,max)
            else:
                mt = media.get_media(dst)
                xysize = mt.get_size()
            pt,_ = photo_thumb.objects.get_or_create(photo=self,size=size)
            pt.width=xysize[0]
            pt.height=xysize[1]
            pt.save()

        os.umask(umask)
        return
    generate_thumbnails.alters_data = True

    def update_size(self):
        for size, max in settings.IMAGE_SIZES.iteritems():
            dst = self.get_thumb_path(size)
            mt = media.get_media(dst)
            xysize = mt.get_size()
            pt,_ = photo_thumb.objects.get_or_create(photo=self,size=size)
            pt.width=xysize[0]
            pt.height=xysize[1]
            pt.save()
        return
    update_size.alters_data = True

    def update_from_source(self, media=None):
        if media is None:
            m = media.get_media(self.get_orig_path())
        else:
            m = media

        exif = m.get_exif()

        (width,height) = m.get_size()
        size = m.get_bytes()

        self.width = width
        self.height = height
        self.size = size

        try:
            self.camera_make = exif['Exif.Image.Make'].value
        except KeyError:
            pass

        try:
            self.camera_model = exif['Exif.Image.Model'].value
        except KeyError:
            pass

        try:
            if exif['Exif.Photo.Flash'].value & 1:
                self.flash_used = 'Y'
            else:
                self.flash_used = 'N'
        except KeyError:
            pass

        try:
            focallength = exif['Exif.Photo.FocalLength'].value
            self.focal_length = "%.1f mm"%(focallength.numerator*1.0/focallength.denominator)
        except KeyError:
            pass

        try:
            self.exposure = exif['Exif.Photo.ExposureTime'].value
        except KeyError:
            pass

        try:
            self.compression = ""
        except KeyError:
            pass

        try:
            fnumber = exif['Exif.Photo.FNumber'].value
            self.aperture = "F%.1f"%(fnumber.numerator*1.0/fnumber.denominator)
        except KeyError:
            pass

        try:
            self.iso_equiv = exif['Exif.Photo.ISOSpeedRatings'].value
        except KeyError:
            pass

        try:
            if exif['Exif.Photo.MeteringMode'].value == 0:
                self.metering_mode = "unknown"
            elif exif['Exif.Photo.MeteringMode'].value == 1:
                self.metering_mode = "average"
            elif exif['Exif.Photo.MeteringMode'].value == 2:
                self.metering_mode = "center weighted average"
            elif exif['Exif.Photo.MeteringMode'].value == 3:
                self.metering_mode = "spot"
            elif exif['Exif.Photo.MeteringMode'].value == 4:
                self.metering_mode = "multi spot"
            elif exif['Exif.Photo.MeteringMode'].value == 5:
                self.metering_mode = "pattern"
            elif exif['Exif.Photo.MeteringMode'].value == 6:
                self.metering_mode = "partial"
            elif exif['Exif.Photo.MeteringMode'].value == 255:
                self.metering_mode = "other"
            else:
                self.metering_mode = "reserved"
        except KeyError:
            pass

        try:
            self.focus_dist = exif['Exif.CanonSi.SubjectDistance'].value
        except KeyError:
            pass

        try:
            self.ccd_width = ""
        except KeyError:
            pass

        return
    update_from_source.alters_data = True

    @classmethod
    def get_conflicts(cls, new_path, new_name):
        # check for conflicts or errors
        (shortname, extension) = os.path.splitext(new_name)
        dups = photo.objects.filter(path=new_path,name__startswith="%s."%(shortname))
        count = dups.count()
        if count > 0:
            return dups, count

        p = photo()
        p.path = new_path
        p.name = new_name

        full_path = p.get_orig_path()
        if os.path.lexists(full_path):
            raise RuntimeError("file already exists at %s but has no db entry"%full_path)

        for size in settings.IMAGE_SIZES:
            full_path = p.get_thumb_path(size)
            if os.path.lexists(full_path):
                raise RuntimeError("file already exists at %s but has no db entry"%full_path)

        return [], 0

    @classmethod
    def get_new_name(cls, old_file, new_path, new_name):
        append = [ '', 'a', 'b', 'c', 'd', ]

        for a in append:
            (shortname, extension) = os.path.splitext(new_name)
            tmp_name = shortname + a + extension
            dups, count = cls.get_conflicts(new_path, tmp_name)
            if count == 0:
                return new_path, tmp_name
            elif count > 1:
                raise RuntimeError("Multiple DB entries exist for %s/%s"%(new_path,tmp_name))

            dupfile = dups[0].get_orig_path()
            if filecmp.cmp(old_file, dupfile):
                raise photo_already_exists_error("same photo %d already exists at %s/%s as %s/%s"%(dups[0].pk,new_path,new_name,dups[0].path,dups[0].name))

        raise RuntimeError("Cannot get non-conflicting filename for %s/%s"%(new_path, new_name))

    def move(self,new_name=None):
        # Work out new path
        from_tz = pytz.utc
        to_tz = pytz.FixedOffset(self.utc_offset)
        to_offset =  datetime.timedelta(minutes=self.utc_offset)

        local = from_tz.localize(self.datetime)
        local = (local + to_offset).replace(tzinfo=to_tz)

        new_path = "%04d/%02d/%02d"%(local.year,local.month,local.day)

        # Work out new name
        if new_name is None:
            new_name = self.name

        # Get current paths
        old_path = { }
        for size in settings.IMAGE_SIZES:
            old_path[size] = self.get_thumb_path(size)
        old_orig_path = self.get_orig_path()

        # Check that something has changed
        if self.path == new_path and self.name == new_name:
            # nothing to do, good bye cruel world
            return

        new_path, new_name = photo.get_new_name(old_orig_path, new_path, new_name)

        # First pass, check for anything that could go wrong before doing anything
        for size in settings.IMAGE_SIZES:
            src = old_path[size]
            if not os.path.lexists(src):
                raise RuntimeError("Source '%s' not already exists"%(src))

        src = old_orig_path
        if not os.path.lexists(src):
            raise RuntimeError("Source '%s' not already exists"%(src))

        # Update the values so we get new paths
        self.path = new_path
        self.name = new_name

        # Second pass. Nothing can go wrong go wrong go wrong go wrong go wrong
        for size in settings.IMAGE_SIZES:
            src = old_path[size]
            dst = self.get_thumb_path(size)

            if src != dst:
                print "Moving '%s' to '%s'"%(src,dst)
                if not os.path.lexists(os.path.dirname(dst)):
                    os.makedirs(os.path.dirname(dst),0755)
                shutil.move(src,dst)

        src = old_orig_path
        dst = self.get_orig_path()
        if src != dst:
            print  "Moving '%s' to '%s'"%(src,dst)
            if not os.path.lexists(os.path.dirname(dst)):
                os.makedirs(os.path.dirname(dst),0755)
            shutil.move(src,dst)

        # Hurry! Save the new path and name before we forgot
        # ... err what did we just do?
        self.save()
        return
    move.alters_data = True

    def error_list(self):
        error_list = []

        if settings.IMAGE_CHECK_EXISTS:
            dst = self.get_orig_path()
            if not os.path.lexists(dst):
                error_list.append("Original file '%s' is missing"%(dst))

            for size in settings.IMAGE_SIZES:
                dst = self.get_thumb_path(size)
                if not os.path.lexists(dst):
                    error_list.append("Thumb file '%s' for size '%s' is missing"%(dst, size))

        duplicates = photo.objects.filter(path=self.path, name=self.name).exclude(pk=self.pk)
        if duplicates.count() > 0:
            error_list.append(u"photo path %s/%s is duplicated"%(self.path, self.name))

        return error_list

# ---------------------------------------------------------------------------

class photo_thumb(base_model):
    photo = models.ForeignKey(photo)
    size = models.CharField(max_length=10, db_index=True)
    width = models.IntegerField(null=True, blank=True)
    height = models.IntegerField(null=True, blank=True)

class photo_album(base_model):
    photo = models.ForeignKey(photo)
    album = models.ForeignKey(album)

class photo_category(base_model):
    photo = models.ForeignKey(photo)
    category = models.ForeignKey(category)

class photo_person(base_model):
    photo = models.ForeignKey(photo)
    person = models.ForeignKey(person)
    position = models.IntegerField(null=True, blank=True)
    class Meta:
        ordering = [ 'position' ]

class photo_relation(base_model):
    photo_1 = models.ForeignKey(photo, db_column="photo_id_1", related_name="relations_1")
    photo_2 = models.ForeignKey(photo, db_column="photo_id_2", related_name="relations_2")
    desc_1 = models.CharField(max_length=384)
    desc_2 = models.CharField(max_length=384)

    def __unicode__(self):
        return "relationship '%s' to '%s'"%(self.photo_1,self.photo_2)

