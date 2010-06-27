# This is an auto-generated Django model module.
# You'll have to do the following manually to clean this up:
#     * Rearrange models' order
#     * Make sure each model has one field with primary_key=True
# Feel free to rename the models, but don't rename db_table values or field names.
#
# Also note: You'll have to insert the output of 'django-admin.py sqlcustom [appname]'
# into your database.

from django.core.urlresolvers import reverse
from django.contrib.auth.models import User as django_user
from django.conf import settings

from django.db import models
from django.db.models import Q

from django.utils.http import urlquote
from django.utils.encoding import iri_to_uri

import os
import datetime

from spud import media

SEX_CHOICES = (
    ('1', 'male'),
    ('2', 'female'),
)

PHOTO_ACTION = (
    ('D', 'delete'),
    ('R', 'regenerate thumbnail'),
    ('AUTO', 'rotate automatic'),
    ('90', 'rotate 90 degrees clockwise'),
    ('180', 'rotate 180 degrees clockwise'),
    ('270', 'rotate 270 degrees clockwise'),
)

def sex_to_string(sex):
    if sex == '1':
        return u'male'
    elif sex == '2':
        return u'female'
    else:
        return u'unknown'

def action_to_string(action):
    if action is None:
        return u'none'
    elif action == 'D':
        return u'delete'
    elif action == 'R':
        return u'regenerate'
    elif action == 'AUTO':
        return u'rotate auto'
    elif action == '90':
        return u'rotate 90'
    elif action == '180':
        return u'rotate 180'
    elif action == '270':
        return u'rotate 270'
    else:
        return u'unknown'

# META INFORMATION FOR MODELS

class breadcrumb:
    def __init__(self,url,name):
        self.url = url
        self.name = name

# BASE ABSTRACT MODEL CLASS

class base_model(models.Model):

    class Meta:
        abstract = True

    def get_history(self):
        ct = ContentType.objects.get_for_model(self)
        return history_item.objects.filter(content_type=ct, object_pk=self.pk)

    def error_list(self):
        error_list = []
        return error_list

    # VIEW ACTION

    # get the URL to display this object
    # note this may not always make sense
    @models.permalink
    def get_absolute_url(self):
        return(self.type.type_id+'_detail', [ str(self.pk) ])

    # get the breadcrumbs to show while displaying this object
    def get_breadcrumbs(self):
        breadcrumbs = self.type.get_breadcrumbs()
        breadcrumbs.append(breadcrumb(self.get_absolute_url(),self))
        return breadcrumbs

    # CREATE ACTION

    # EDIT ACTION

    # get the URL to edit this object
    @models.permalink
    def get_edit_url(self):
        return(self.type.type_id+'_edit', [ str(self.pk) ])

    # get breadcrumbs to show while editing this object
    def get_edit_breadcrumbs(self):
        breadcrumbs = self.get_breadcrumbs()
        breadcrumbs.append(breadcrumb(self.get_edit_url(),"edit"))
        return breadcrumbs

    # find link we should go to after editing this object
    def get_edited_url(self):
        return self.get_absolute_url()

    # DELETE ACTION

    # get the URL to delete this object
    @models.permalink
    def get_delete_url(self):
        return(self.type.type_id+'_delete', [ str(self.pk) ])

    # get breadcrumbs to show while deleting this object
    def get_delete_breadcrumbs(self):
        breadcrumbs = self.get_breadcrumbs()
        breadcrumbs.append(breadcrumb(self.get_delete_url(),"delete"))
        return breadcrumbs

    # are there any reasons why this object should not be deleted?
    def check_delete(self):
        error_list = []
        return error_list

    # find link we should go to after deleting object
    @models.permalink
    def get_deleted_url(self):
        return(self.type.type_id+"_list",)


    ################
    # TYPE METHODS #
    ################
    class type:
        verbose_name = None
        verbose_name_plural = None

        @classmethod
        def single_name(cls):
            if cls.verbose_name is not None:
                return cls.verbose_name

            type_id = cls.type_id
            return type_id.replace("_"," ")

        @classmethod
        def plural_name(cls):
            if cls.verbose_name_plural is not None:
                return cls.verbose_name_plural

            return cls.single_name() + 's'

        @classmethod
        def has_add_perms(cls,user):
            if user.is_authenticated() and user.has_perm('spud.add_'+cls.type_id):
                return True
            else:
                return False

        @classmethod
        def has_edit_perms(cls,user):
            if user.is_authenticated() and user.has_perm('spud.edit_'+cls.type_id):
                return True
            else:
                return False

        @classmethod
        def has_delete_perms(cls,user):
            if user.is_authenticated() and user.has_perm('spud.delete_'+cls.type_id):
                return True
            else:
                return False

        @classmethod
        def get_breadcrumbs(cls):
            breadcrumbs = []
            breadcrumbs.append(breadcrumb(reverse("spud_root"),"home"))
            breadcrumbs.append(breadcrumb(reverse(cls.type_id+"_list"),cls.plural_name()))
            return breadcrumbs

        @classmethod
        def get_create_breadcrumbs(cls, **kwargs):
            breadcrumbs = cls.get_breadcrumbs(**kwargs)
            breadcrumbs.append(breadcrumb(cls.get_create_url(**kwargs),"create"))
            return breadcrumbs

        @classmethod
        @models.permalink
        def get_create_url(cls):
            return(cls.type_id+"_create",)

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
    coverphoto = models.ForeignKey('photo', db_column='coverphoto', related_name='place_cover_of', null=True, blank=True)
    notes = models.TextField(blank=True)
    class Meta:
        db_table = u'zoph_places'
        ordering = [ 'title' ]

    def __unicode__(self):
        return self.title

    @models.permalink
    def get_absolute_url(self):
        return('place_detail', [ str(self.place_id) ])

    @models.permalink
    def get_create_url(self):
        return('place_create', [ str(self.place_id) ])

    @models.permalink
    def get_edit_url(self):
        return('place_edit', [ str(self.place_id) ])

    @models.permalink
    def get_delete_url(self):
        return('place_delete', [ str(self.place_id) ])

    def get_full_name(self):
        list = []

        object=self
        seen = {}
        while object is not None and object.pk not in seen:
            list.insert(0,u"%s"%(object))
            seen[object.pk] = True
            object = object.parent_place

        if object is not None:
            list.insert(0,u"ERROR")

        return "&rsaquo;".join(list)

    def get_breadcrumbs(self):
        breadcrumbs = []
        breadcrumbs.append(breadcrumb(reverse("spud_root"),"home"))

        object=self
        seen = {}
        while object is not None and object.pk not in seen:
            breadcrumbs.insert(1,breadcrumb(object.get_absolute_url(),object))
            seen[object.pk] = True
            object = object.parent_place

        if object is not None:
            breadcrumbs.insert(1,breadcrumb(object.get_absolute_url(),"ERROR"))

        return breadcrumbs

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

    # find link we should go to after deleting object
    @models.permalink
    def get_deleted_url(self):
        if self.parent_place is None:
            return('place_detail', [ str(1)])
        else:
            return('place_detail', [ str(self.parent_place.pk) ])

    def delete(self):
        self.work_of.clear()
        self.home_of.clear()
        super(place, self).delete()

    class type(base_model.type):
        type_id = "place"

        @classmethod
        def get_breadcrumbs(cls, parent):
            breadcrumbs = parent.get_breadcrumbs()
            return breadcrumbs

        @classmethod
        @models.permalink
        def get_create_url(cls, parent):
            return(cls.type_id+"_create", [ parent.pk ] )

class album(base_model):
    album_id = models.AutoField(primary_key=True)
    parent_album = models.ForeignKey('self', related_name='children', null=True, blank=True)
    album = models.CharField(max_length=96, db_index=True)
    album_description = models.TextField(blank=True)
    coverphoto = models.ForeignKey('photo', db_column='coverphoto', related_name='album_cover_of', null=True, blank=True)
    sortname = models.CharField(max_length=96, blank=True)
    sortorder = models.CharField(max_length=96, blank=True)
    revised = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = u'zoph_albums'
        ordering = [ 'sortname', 'sortorder', 'album' ]

    def __unicode__(self):
        return self.album

    @models.permalink
    def get_absolute_url(self):
        return('album_detail', [ str(self.album_id)])

    @models.permalink
    def get_create_url(self):
        return('album_create', [ str(self.album_id)])

    @models.permalink
    def get_edit_url(self):
        return('album_edit', [ str(self.album_id)])

    @models.permalink
    def get_delete_url(self):
        return('album_delete', [ str(self.album_id)])

    def get_full_name(self):
        list = []

        object=self
        seen = {}
        while object is not None and object.pk not in seen:
            list.insert(0,u"%s"%(object))
            seen[object.pk] = True
            object = object.parent_album

        if object is not None:
            list.insert(0,u"ERROR")

        return "&rsaquo;".join(list)

    def get_breadcrumbs(self):
        breadcrumbs = []
        breadcrumbs.append(breadcrumb(reverse("spud_root"),"home"))

        object=self
        seen = {}
        while object is not None and object.pk not in seen:
            breadcrumbs.insert(1,breadcrumb(object.get_absolute_url(),object))
            seen[object.pk] = True
            object = object.parent_album

        if object is not None:
            breadcrumbs.insert(1,breadcrumb(object.get_absolute_url(),"ERROR"))

        return breadcrumbs

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

    # find link we should go to after deleting object
    @models.permalink
    def get_deleted_url(self):
        if self.parent_album is None:
            return('album_detail', [ str(1)])
        else:
            return('album_detail', [ str(self.parent_album.pk) ])

    class type(base_model.type):
        type_id = "album"

        @classmethod
        def get_breadcrumbs(cls, parent):
            breadcrumbs = parent.get_breadcrumbs()
            return breadcrumbs

        @classmethod
        @models.permalink
        def get_create_url(cls, parent):
            return(cls.type_id+"_create", [ parent.pk ] )

class category(base_model):
    category_id = models.AutoField(primary_key=True)
    parent_category = models.ForeignKey('self', related_name='children', null=True, blank=True)
    category = models.CharField(max_length=96, db_index=True)
    category_description = models.TextField(blank=True)
    coverphoto = models.ForeignKey('photo', db_column='coverphoto', related_name='category_cover_of', null=True, blank=True)
    sortname = models.CharField(max_length=96, blank=True)
    sortorder = models.CharField(max_length=96, blank=True)
    class Meta:
        db_table = u'zoph_categories'
        ordering = [ 'sortname', 'sortorder', 'category' ]

    def __unicode__(self):
        return self.category

    @models.permalink
    def get_absolute_url(self):
        return('category_detail', [ str(self.category_id)])

    @models.permalink
    def get_create_url(self):
        return('category_create', [ str(self.category_id)])

    @models.permalink
    def get_edit_url(self):
        return('category_edit', [ str(self.category_id)])

    @models.permalink
    def get_delete_url(self):
        return('category_delete', [ str(self.category_id)])

    def get_full_name(self):
        list = []

        object=self
        seen = {}
        while object is not None and object.pk not in seen:
            list.insert(0,u"%s"%(object))
            seen[object.pk] = True
            object = object.parent_category

        if object is not None:
            list.insert(0,u"ERROR")

        return "&rsaquo;".join(list)

    def get_breadcrumbs(self):
        breadcrumbs = []
        breadcrumbs.append(breadcrumb(reverse("spud_root"),"home"))

        object=self
        seen = {}
        while object is not None and object.pk not in seen:
            breadcrumbs.insert(1,breadcrumb(object.get_absolute_url(),object))
            seen[object.pk] = True
            object = object.parent_category

        if object is not None:
            breadcrumbs.insert(1,breadcrumb(object.get_absolute_url(),"ERROR"))

        return breadcrumbs

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

    # find link we should go to after deleting object
    @models.permalink
    def get_deleted_url(self):
        if self.parent_category is None:
            return('category_detail', [ str(1)])
        else:
            return('category_detail', [ str(self.parent_category.pk) ])

    class type(base_model.type):
        type_id = "category"

        @classmethod
        def get_breadcrumbs(cls, parent):
            breadcrumbs = parent.get_breadcrumbs()
            return breadcrumbs

        @classmethod
        @models.permalink
        def get_create_url(cls, parent):
            return(cls.type_id+"_create", [ parent.pk ] )

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
    coverphoto = models.ForeignKey('photo', db_column='coverphoto', related_name='person_cover_of', null=True, blank=True)
    email = models.CharField(max_length=192, blank=True)
    class Meta:
        db_table = u'zoph_people'
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

    @models.permalink
    def get_absolute_url(self):
        return('person_detail', [ str(self.person_id)])

    @models.permalink
    def get_edit_url(self):
        return('person_edit', [ str(self.person_id)])

    @models.permalink
    def get_delete_url(self):
        return('person_delete', [ str(self.person_id)])

    def get_breadcrumbs(self):
        breadcrumbs = []
        breadcrumbs.append(breadcrumb(reverse("spud_root"),"home"))
        breadcrumbs.append(breadcrumb(reverse("person_list"),"people"))
        breadcrumbs.append(breadcrumb(self.get_absolute_url(),self))
        return breadcrumbs

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
        parents = [self.father.pk, self.mother.pk]
        grandparents = self.grandparents()
        return person.objects.filter(Q(father__in=grandparents) | Q(mother__in=grandparents)).exclude(pk__in=parents)

    def parents(self):
        return [self.father, self.mother]

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

    class type(base_model.type):
        type_id = "person"

# ---------------------------------------------------------------------------

class photo(base_model):
    photo_id = models.AutoField(primary_key=True)
    name = models.CharField(max_length=128, blank=True, db_index=True)
    path = models.CharField(max_length=255, blank=True, db_index=True)
    width = models.IntegerField(null=True, blank=True)
    height = models.IntegerField(null=True, blank=True)
    size = models.IntegerField(null=True, blank=True)
    title = models.CharField(max_length=64, blank=True)
    photographer = models.ForeignKey(person, null=True, blank=True, related_name='photographed')
    location = models.ForeignKey(place, null=True, blank=True, related_name='photos')
    view = models.CharField(max_length=64, blank=True)
    rating = models.FloatField(null=True, blank=True, db_index=True)
    description = models.TextField(blank=True)
    timezone = models.CharField(max_length=100)
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
        db_table = u'zoph_photos'
        ordering = [ 'datetime' ]

    def __unicode__(self):
        if self.title is None or self.title=="":
                return self.name
        else:
                return self.title

    @models.permalink
    def get_edit_url(self):
        return('photo_edit', [ str(self.photo_id)])

    @models.permalink
    def get_absolute_url(self):
        return('photo_detail', [ str(self.photo_id)])

    @models.permalink
    def get_create_photo_relation_url(self):
        return('photo_relation_create', [ str(self.photo_id)])

    def get_thumb_url(self,size):
        if size in settings.IMAGE_SIZES:
            (shortname, extension) = os.path.splitext(self.name)
            return iri_to_uri(u"%sthumb/%s/%s/%s.jpg"%(settings.IMAGE_URL,urlquote(size),urlquote(self.path),urlquote(shortname)))
        else:
            raise RuntimeError("unknown image size %s"%(size))

    def get_thumb_path(self,size):
        if size in settings.IMAGE_SIZES:
            (shortname, extension) = os.path.splitext(self.name)
            return u"%sthumb/%s/%s/%s.jpg"%(settings.IMAGE_PATH,size,self.path,shortname)
        else:
            raise RuntimeError("unknown image size %s"%(size))

    def get_orig_url(self):
        return iri_to_uri(u"%sorig/%s/%s"%(settings.IMAGE_URL,urlquote(self.path),urlquote(self.name)))

    def get_orig_path(self):
        return u"%sorig/%s/%s"%(settings.IMAGE_PATH,self.path,self.name)

    # Other stuff
    def get_breadcrumbs(self):
        breadcrumbs = []
        breadcrumbs.append(breadcrumb(reverse("spud_root"),"home"))
        breadcrumbs.append(breadcrumb(self.get_absolute_url(),self))
        return breadcrumbs

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
                m.create_thumbnail(dst,max)

        os.umask(umask)
        return
    generate_thumbnails.alters_data = True

    def update_from_source(self):
        m = media.get_media(self.get_orig_path())
        exif = m.get_exif()

        (width,height) = m.get_size()
        size = m.get_bytes()

        self.width = width
        self.height = height
        self.size = size

        try:
            self.camera_make = exif['Exif.Image.Make']
        except KeyError:
            pass

        try:
            self.camera_model = exif['Exif.Image.Model']
        except KeyError:
            pass

        try:
            if exif['Exif.Photo.Flash'] & 1:
                self.flash_used = 'Y'
            else:
                self.flash_used = 'N'
        except KeyError:
            pass

        try:
            focallength = exif['Exif.Photo.FocalLength']
            self.focal_length = "%.1f mm"%(focallength.numerator*1.0/focallength.denominator)
        except KeyError:
            pass

        try:
            self.exposure = exif['Exif.Photo.ExposureTime']
        except KeyError:
            pass

        try:
            self.compression = ""
        except KeyError:
            pass

        try:
            fnumber = exif['Exif.Photo.FNumber']
            self.aperture = "F%.1f"%(fnumber.numerator*1.0/fnumber.denominator)
        except KeyError:
            pass

        try:
            self.iso_equiv = exif['Exif.Photo.ISOSpeedRatings']
        except KeyError:
            pass

        try:
            if exif['Exif.Photo.MeteringMode'] == 0:
                self.metering_mode = "unknown"
            elif exif['Exif.Photo.MeteringMode'] == 1:
                self.metering_mode = "average"
            elif exif['Exif.Photo.MeteringMode'] == 2:
                self.metering_mode = "center weighted average"
            elif exif['Exif.Photo.MeteringMode'] == 3:
                self.metering_mode = "spot"
            elif exif['Exif.Photo.MeteringMode'] == 4:
                self.metering_mode = "multi spot"
            elif exif['Exif.Photo.MeteringMode'] == 5:
                self.metering_mode = "pattern"
            elif exif['Exif.Photo.MeteringMode'] == 6:
                self.metering_mode = "partial"
            elif exif['Exif.Photo.MeteringMode'] == 255:
                self.metering_mode = "other"
            else:
                self.metering_mode = "reserved"
        except KeyError:
            pass

        try:
            self.focus_dist = exif['Exif.CanonSi.SubjectDistance']
        except KeyError:
            pass

        try:
            self.ccd_width = ""
        except KeyError:
            pass

        return
    update_from_source.alters_data = True

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

    class type(base_model.type):
        type_id = "photo"

        @classmethod
        def get_breadcrumbs(cls):
            breadcrumbs = []
            breadcrumbs.append(breadcrumb(reverse("spud_root"),"home"))
            return breadcrumbs

# ---------------------------------------------------------------------------

class photo_album(base_model):
    photo = models.ForeignKey(photo)
    album = models.ForeignKey(album)
    class Meta:
        db_table = u'zoph_photo_albums'
    class type(base_model.type):
        type_id = "photo_album"

class photo_category(base_model):
    photo = models.ForeignKey(photo)
    category = models.ForeignKey(category)
    class Meta:
        db_table = u'zoph_photo_categories'
    class type(base_model.type):
        type_id = "photo_category"

class photo_person(base_model):
    photo = models.ForeignKey(photo)
    person = models.ForeignKey(person)
    position = models.IntegerField(null=True, blank=True)
    class Meta:
        db_table = u'zoph_photo_people'
        ordering = [ 'position' ]
    class type(base_model.type):
        type_id = "photo_person"

class photo_relation(base_model):
    photo_1 = models.ForeignKey(photo, db_column="photo_id_1", related_name="relations_1")
    photo_2 = models.ForeignKey(photo, db_column="photo_id_2", related_name="relations_2")
    desc_1 = models.CharField(max_length=384)
    desc_2 = models.CharField(max_length=384)

    class Meta:
        db_table = u'zoph_photo_relations'

    @models.permalink
    def get_edit_url(self):
        return('photo_relation_edit', [ str(self.pk) ])

    @models.permalink
    def get_delete_url(self):
        return('photo_relation_delete', [ str(self.pk) ])

    def get_breadcrumbs(self):
        breadcrumbs = []
        breadcrumbs.append(breadcrumb(reverse("spud_root"),"home"))
        breadcrumbs.append(breadcrumb(reverse("photo_relation_list"),"relations"))
        breadcrumbs.append(breadcrumb(self.get_edit_url(),self))
        return breadcrumbs

    class type(base_model.type):
        type_id = "photo_relation"
