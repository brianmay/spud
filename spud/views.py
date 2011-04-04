from django.shortcuts import get_object_or_404, render_to_response
from django.template import RequestContext, loader
from django.forms.models import inlineformset_factory
from django.core.urlresolvers import reverse
from django.http import HttpResponseRedirect, HttpResponse, HttpResponseForbidden, Http404
from django.core.paginator import Paginator, InvalidPage, EmptyPage
from django.contrib.comments.moderation import CommentModerator, moderator
from django.contrib.comments.signals import comment_was_flagged, comment_was_posted
from django.utils.encoding import smart_unicode
from django.conf import settings

from django.db.models import Count, Q

from spud.comments.models import CommentWithRating
from spud import models
from spud import forms
from spud import webs
from spud import tables

from datetime import *

import re

def root(request):
    breadcrumbs = []
    breadcrumbs.append(webs.breadcrumb(reverse("root"), "home"))

    return render_to_response('spud/index.html', {
                        'breadcrumbs': breadcrumbs,
                        }, context_instance=RequestContext(request))

def set_album_list(photo, pk_list):
    pa_list = photo.photo_album_set.all()
    for pa in pa_list:
        if pa.album.pk in pk_list:
            pk_list.remove(pa.album.pk)
        else:
            pa.delete()

    for pk in pk_list:
        pa = models.photo_album.objects.create(photo=photo,album_id=pk)

def set_category_list(photo, pk_list):
    pa_list = photo.photo_category_set.all()
    for pa in pa_list:
        if pa.category.pk in pk_list:
            pk_list.remove(pa.category.pk)
        else:
            pa.delete()

    for pk in pk_list:
        pa = models.photo_category.objects.create(photo=photo,category_id=pk)

############
# COMMENTS #
############
class photo_moderator(CommentModerator):
    email_notification = True

    def moderate(self, comment, content_object, request):
        if request.user.is_authenticated:
            return False
        else:
            return True

moderator.register(models.photo, photo_moderator)


def update_photo_ratings(sender, **kwargs):
    object_type = kwargs['comment'].content_type_id
    object_pk   = kwargs['comment'].object_pk

    if kwargs['comment'].content_type_id == 6:

        rlist = CommentWithRating.objects.filter(
                                content_type=object_type,
                                object_pk=object_pk,
                                is_public=True,
                                is_removed=False)

        count = 0
        total = 0
        for r in rlist:
                count = count + 1
                total = total + r.rating

        object = models.photo.objects.get(pk=object_pk)
        if count > 0:
            object.rating = total/count
        else:
            object.rating = None
        object.save()

comment_was_flagged.connect(update_photo_ratings)
comment_was_posted.connect(update_photo_ratings)

#########
# PHOTO #
#########

def photo_orig_redirect(request,object_id):
    web = webs.photo_web()
    object = get_object_or_404(models.photo, pk=object_id)
    url = web.get_orig_url(object)
    return HttpResponseRedirect(url)

def photo_thumb_redirect(request,object_id,size):
    web = webs.photo_web()
    if size in settings.IMAGE_SIZES:
        object = get_object_or_404(models.photo, pk=object_id)
        url = web.get_thumb_url(object,size)
        return HttpResponseRedirect(url)
    else:
        raise Http404("Unknown image size '%s'"%(size))

def photo_detail(request, object_id, size):
    web = webs.photo_web()
    photo_list = models.photo.objects.filter(pk=object_id)
    object = photo_list[0]
    return web.object_photo_detail(request,object,0,photo_list,size)

def photo_edit(request, object_id, size):
    web = webs.photo_web()
    photo_list = models.photo.objects.filter(pk=object_id)
    object = photo_list[0]
    return web.object_photo_edit(request,object,0,photo_list,size)

#########
# PLACE #
#########

def place_redirect(request,object_id):
    web = webs.place_web()
    object = get_object_or_404(models.place, pk=object_id)
    return HttpResponseRedirect(web.get_view_url(object))

def place_detail(request, object_id):
    web = webs.place_web()
    if request.method == 'POST':
        form = forms.search_place_form(request.POST)

        if form.is_valid():
            place = form.cleaned_data['place']
            url=web.get_view_url(place)
            return HttpResponseRedirect(url)
    else:
        form = forms.search_place_form()

    context = { 'form': form, 'media': form.media }
    object = get_object_or_404(models.place, pk=object_id)
    photo_list = models.photo.objects.filter(location=object)
    return web.object_photo_list(request,object,photo_list,context=context)

def place_add(request, object_id):
    web = webs.place_web()
    parent = get_object_or_404(models.place, pk=object_id)
    return web.object_add(request, kwargs={ 'parent': parent })

def place_edit(request,object_id):
    web = webs.place_web()
    object = get_object_or_404(models.place, pk=object_id)
    return web.object_edit(request, object)

def place_delete(request,object_id):
    web = webs.place_web()
    object = get_object_or_404(models.place, pk=object_id)
    return web.object_delete(request, object)

def place_photo_detail(request, object_id, number, size):
    web = webs.place_web()
    object = get_object_or_404(models.place, pk=object_id)
    photo_list = models.photo.objects.filter(location=object)
    return web.object_photo_detail(request,object,number,photo_list,size)

def place_photo_edit(request, object_id, number, size):
    web = webs.place_web()
    object = get_object_or_404(models.place, pk=object_id)
    photo_list = models.photo.objects.filter(location=object)
    return web.object_photo_edit(request,object,number,photo_list,size)

#########
# ALBUM #
#########

def album_redirect(request,object_id):
    web = webs.album_web()
    object = get_object_or_404(models.album, pk=object_id)
    return HttpResponseRedirect(web.get_view_url(object))

def album_detail(request, object_id):
    web = webs.album_web()
    if request.method == 'POST':
        form = forms.search_album_form(request.POST)

        if form.is_valid():
            album = form.cleaned_data['album']
            url=web.get_view_url(album)
            return HttpResponseRedirect(url)
    else:
        form = forms.search_album_form()

    context = { 'form': form, 'media': form.media }
    object = get_object_or_404(models.album, pk=object_id)
    photo_list = models.photo.objects.filter(albums=object)
    return web.object_photo_list(request,object,photo_list,context=context)

def album_todo(request):
    web = webs.album_web()
    parent = get_object_or_404(models.album, pk=1)
    dt = datetime.now()-timedelta(days=365)
    objects = models.album.objects.filter(Q(revised__lt=dt) | Q(revised__isnull=True)).order_by('revised','-pk')
    table = tables.album_table(request.user, web, objects, order_by=request.GET.get('sort'))
    return web.object_list(request, None, table)

def album_add(request, object_id):
    web = webs.album_web()
    parent = get_object_or_404(models.album, pk=object_id)
    return web.object_add(request, kwargs={ 'parent': parent })

def album_edit(request,object_id):
    web = webs.album_web()
    object = get_object_or_404(models.album, pk=object_id)
    return web.object_edit(request, object)

def album_delete(request,object_id):
    web = webs.album_web()
    object = get_object_or_404(models.album, pk=object_id)
    return web.object_delete(request, object)

def album_photo_detail(request, object_id, number, size):
    web = webs.album_web()
    object = get_object_or_404(models.album, pk=object_id)
    photo_list = models.photo.objects.filter(albums=object)
    return web.object_photo_detail(request,object,number,photo_list,size)

def album_photo_edit(request, object_id, number, size):
    web = webs.album_web()
    object = get_object_or_404(models.album, pk=object_id)
    photo_list = models.photo.objects.filter(albums=object)
    return web.object_photo_edit(request,object,number,photo_list,size)

############
# CATEGORY #
############

def category_redirect(request,object_id):
    web = webs.category_web()
    object = get_object_or_404(models.category, pk=object_id)
    return HttpResponseRedirect(web.get_view_url(object))

def category_detail(request, object_id):
    web = webs.category_web()
    if request.method == 'POST':
        form = forms.search_category_form(request.POST)

        if form.is_valid():
            category = form.cleaned_data['category']
            url=web.get_view_url(category)
            return HttpResponseRedirect(url)
    else:
        form = forms.search_category_form()

    context = { 'form': form, 'media': form.media }
    object = get_object_or_404(models.category, pk=object_id)
    photo_list = models.photo.objects.filter(categorys=object)
    return web.object_photo_list(request,object,photo_list,context=context)

def category_add(request, object_id):
    web = webs.category_web()
    parent = get_object_or_404(models.category, pk=object_id)
    return web.object_add(request, kwargs={ 'parent': parent })

def category_edit(request,object_id):
    web = webs.category_web()
    object = get_object_or_404(models.category, pk=object_id)
    return web.object_edit(request, object)

def category_delete(request,object_id):
    web = webs.category_web()
    object = get_object_or_404(models.category, pk=object_id)
    return web.object_delete(request, object)

def category_photo_detail(request, object_id, number, size):
    web = webs.category_web()
    object = get_object_or_404(models.category, pk=object_id)
    photo_list = models.photo.objects.filter(categorys=object)
    return web.object_photo_detail(request,object,number,photo_list,size)

def category_photo_edit(request, object_id, number, size):
    web = webs.category_web()
    object = get_object_or_404(models.category, pk=object_id)
    photo_list = models.photo.objects.filter(categorys=object)
    return web.object_photo_edit(request,object,number,photo_list,size)

##########
# PERSON #
##########

def person_list(request):
    web = webs.person_web()
    if request.method == 'POST':
        form = forms.search_person_form(request.POST)

        if form.is_valid():
            person = form.cleaned_data['person']
            url=web.get_view_url(person)
            return HttpResponseRedirect(url)
    else:
        form = forms.search_person_form()

    context = { 'form': form, 'media': form.media }
    list = models.person.objects.all()
    table = tables.person_table(request.user, web, list, order_by=request.GET.get('sort'))
    return web.object_list(request, form, table)

def person_redirect(request,object_id):
    web = webs.person_web()
    object = get_object_or_404(models.person, pk=object_id)
    return HttpResponseRedirect(web.get_view_url(object))

def person_detail(request, object_id):
    web = webs.person_web()
    object = get_object_or_404(models.person, pk=object_id)
    photo_list = models.photo.objects.filter(persons=object)
    return web.object_photo_list(request,object,photo_list)

def person_add(request):
    web = webs.person_web()
    return web.object_add(request)

def person_edit(request,object_id):
    web = webs.person_web()
    object = get_object_or_404(models.person, pk=object_id)
    return web.object_edit(request, object)

def person_delete(request,object_id):
    web = webs.person_web()
    object = get_object_or_404(models.person, pk=object_id)
    return web.object_delete(request, object)

def person_photo_detail(request, object_id, number, size):
    web = webs.person_web()
    object = get_object_or_404(models.person, pk=object_id)
    photo_list = models.photo.objects.filter(persons=object)
    return web.object_photo_detail(request,object,number,photo_list,size)

def person_photo_edit(request, object_id, number, size):
    web = webs.person_web()
    object = get_object_or_404(models.person, pk=object_id)
    photo_list = models.photo.objects.filter(persons=object)
    return web.object_photo_edit(request,object,number,photo_list,size)

########
# DATE #
########

class date_class(object):

    def __init__(self,date):
        self.date=date

    def __unicode__(self):
        return self.date

    def get(self, key, default):
        if key=="date":
            return self.date
        return default

    @property
    def pk(self):
        return self.date

def date_results(date):
    m = re.match("^(\d\d\d\d)-(\d\d)-(\d\d)$",date)
    if m is not None:
        (year,month,day)=(int(m.group(1)),int(m.group(2)),int(m.group(3)))
        photo_list = models.photo.objects.filter(datetime__year=year,datetime__month=month,datetime__day=day)
    else:
        photo_list = models.photo.objects.all()
    return photo_list

def date_list(request):
    web = webs.date_web()

    if request.method == 'POST':
        form = forms.search_date_form(request.POST)

        if form.is_valid():
            date = form.cleaned_data['date']
            object = date_class(date)
            url = web.get_view_url(object)
            return HttpResponseRedirect(url)
    else:
        form = forms.search_date_form()

    list = models.photo.objects.dates('datetime', 'day')
    list = [ date_class(instance.date().isoformat()) for instance in list ]
    table = tables.date_table(web, list, order_by=request.GET.get('sort'))
    return web.object_list(request, form, table)

def date_detail(request, object_id):
    web = webs.date_web()
    object = date_class(object_id)
    photo_list = date_results(object_id)
    return web.object_photo_list(request,object,photo_list)

def date_photo_detail(request, object_id, number, size):
    web = webs.date_web()
    object = date_class(object_id)
    photo_list = date_results(object_id)
    return web.object_photo_detail(request,object,number,photo_list,size)

def date_photo_edit(request, object_id, number, size):
    web = webs.date_web()
    object = date_class(object_id)
    photo_list = date_results(object_id)
    return web.object_photo_edit(request,object,number,photo_list,size)

##########
# ACTION #
##########

class action_class(object):

    def __init__(self,action):
        if action == "none":
            self.action = None
        else:
            self.action=action

    def __unicode__(self):
        return models.action_to_string(self.action)

    def get(self, key, default):
        if key=="action":
            if self.action is not None:
                return self.action
            else:
                return "None"
        return default

    @property
    def pk(self):
        return self.action

def action_results(action):
    photo_list = models.photo.objects.filter(action=action)
    return photo_list

def action_list(request):
    web = webs.action_web()
    list = [ action_class(None) ]
    list.extend( [ action_class(i[0]) for i in models.PHOTO_ACTION ] )
    table = tables.action_table(web, list, order_by=request.GET.get('sort'))
    return web.object_list(request, None, table)

def action_detail(request, object_id):
    web = webs.action_web()
    object = action_class(object_id)
    photo_list = action_results(object_id)
    return web.object_photo_list(request,object,photo_list)

def action_photo_detail(request, object_id, number, size):
    web = webs.action_web()
    object = action_class(object_id)
    photo_list = action_results(object_id)
    return web.object_photo_detail(request,object,number,photo_list,size)

def action_photo_edit(request, object_id, number, size):
    web = webs.action_web()
    object = action_class(object_id)
    photo_list = action_results(object_id)
    return web.object_photo_edit(request,object,number,photo_list,size)

##########
# SEARCH #
##########

def decode_dict(value):
    dict = {}
    if value == "":
        return dict

    list = value.split(";")
    for item in list:
        (key,semicolon,value) = item.partition('=')
        value = value.replace("!","/")
        dict[key] = value

    return dict

def decode_string(value):
    return value

def decode_boolean(value):
    value = value.lower()
    if value=="t" or value=="true":
        return True
    else:
        return False

def decode_array(value):
    return value.split(",")

def encode_dict(dict):
    list = []
    for key in dict:
        value = dict[key]

        value = smart_unicode(value)
        value = value.replace(";"," ")
        value = value.replace("/","!")
        list.append("%s=%s"%(key,value))

    return ";".join(list)

def encode_string(value):
    return value

def encode_array(array):
    result_array = []
    for value in array:
        s = smart_unicode(value)
        result_array.append(s.replace(","," "))
    return ",".join(result_array)

class search_class(object):

    def __init__(self,search):
        self.search=search

    def __unicode__(self):
        return "results"

    def get(self, key, default):
        if key=="search":
            return self.search
        return default

    @property
    def pk(self):
        return self.search

def search_results(spec):
    criteria = []

    search = Q()
    search_dict = decode_dict(spec)
    photo_list = models.photo.objects.all()

    if "location_descendants" in search_dict:
        ld = decode_boolean(search_dict["location_descendants"])
    else:
        ld = False

    if "album_descendants" in search_dict:
        ad = decode_boolean(search_dict["album_descendants"])
    else:
        ad = False

    if "category_descendants" in search_dict:
        cd = decode_boolean(search_dict["category_descendants"])
    else:
        cd = False

    for key in search_dict:
        value = search_dict[key]

        if value != "":
            if key == "location_descendants":
                pass
            elif key == "album_descendants":
                pass
            elif key == "category_descendants":
                pass
            elif key == "first_date":
                value = decode_string(value)
                criteria.append({'key': 'date', 'value': "on or later then %s"%(value)})
                search = search & Q(datetime__gte=value)
            elif key == "last_date":
                value = decode_string(value)
                criteria.append({'key': 'date', 'value': "earlier then %s"%(value)})
                search = search & Q(datetime__lt=value)
            elif key == "lower_rating":
                value = decode_string(value)
                criteria.append({'key': 'rating', 'value': "higher then %s"%(value)})
                search = search & Q(rating__gte=value)
            elif key == "upper_rating":
                value = decode_string(value)
                criteria.append({'key': 'rating', 'value': "less then %s"%(value)})
                search = search & Q(rating__lte=value)
            elif key == "title":
                value = decode_string(value)
                criteria.append({'key': key, 'value': "contains %s"%(value)})
                search = search & Q(title__icontains=value)
            elif key == "camera_make":
                value = decode_string(value)
                criteria.append({'key': key, 'value': "contains %s"%(value)})
                search = search & Q(camera_make__icontains=value)
            elif key == "camera_model":
                value = decode_string(value)
                criteria.append({'key': key, 'value': "contains %s"%(value)})
                search = search & Q(camera_model__icontains=value)
            elif key  == "photographer":
                value = decode_string(value)
                object = get_object_or_404(models.person, pk=value)
                criteria.append({'key': key, 'value': "is %s"%(object)})
                search = search & Q(photographer=object)
            elif key  == "location":
                value = decode_string(value)
                object = get_object_or_404(models.place, pk=value)
                if ld:
                    criteria.append({'key': key, 'value': "is %s (or descendants)"%(object)})
                    descendants = object.get_descendants()
                    search = search & Q(location__in=descendants)
                else:
                    criteria.append({'key': key, 'value': "is %s"%(object)})
                    search = search & Q(location=object)
            elif key  == "person":
                values = decode_array(value)
                for value in values:
                    object = get_object_or_404(models.person, pk=value)
                    criteria.append({'key': key, 'value': "is %s"%(object)})
                    photo_list=photo_list.filter(persons=object)
            elif key  == "album":
                values = decode_array(value)
                for value in values:
                    object = get_object_or_404(models.album, pk=value)
                    if ad:
                        criteria.append({'key': key, 'value': "is %s (or descendants)"%(object)})
                        descendants = object.get_descendants()
                        photo_list=photo_list.filter(albums__in=descendants)
                    else:
                        criteria.append({'key': key, 'value': "is %s"%(object)})
                        photo_list=photo_list.filter(albums=object)
            elif key  == "category":
                values = decode_array(value)
                for value in values:
                    object = get_object_or_404(models.category, pk=value)
                    if cd:
                        criteria.append({'key': key, 'value': "is %s (or descendants)"%(object)})
                        descendants = object.get_descendants()
                        photo_list=photo_list.filter(categorys__in=descendants)
                    else:
                        criteria.append({'key': key, 'value': "is %s"%(object)})
                        photo_list=photo_list.filter(categorys=object)
            elif key  == "location_none":
                value = decode_boolean(value)
                if value:
                    criteria.append({'key': "location", 'value': "is %s"%("none")})
                    search = search & Q(location=None)
            elif key  == "person_none":
                value = decode_boolean(value)
                if value:
                    criteria.append({'key': "person", 'value': "is %s"%("none")})
                    search = search & Q(persons=None)
            elif key  == "album_none":
                value = decode_boolean(value)
                if value:
                    criteria.append({'key': "album", 'value': "is %s"%("none")})
                    search = search & Q(albums=None)
            elif key  == "category_none":
                value = decode_boolean(value)
                if value:
                    criteria.append({'key': "category", 'value': "is %s"%("none")})
                    search = search & Q(categorys=None)
            elif key  == "action":
                value = decode_string(value)
                if value == "none":
                    criteria.append({'key': key, 'value': "is %s"%(models.action_to_string(None))})
                    search = search & Q(action__isnull=True)
                else:
                    criteria.append({'key': key, 'value': "is %s"%(models.action_to_string(value))})
                    search = search & Q(action=value)
            elif key  == "path":
                value = decode_string(value)
                criteria.append({'key': key, 'value': "is %s"%(value)})
                search = search & Q(path=value)
            elif key  == "name":
                value = decode_string(value)
                criteria.append({'key': key, 'value': "is %s"%(value)})
                search = search & Q(name=value)
            else:
                raise Http404("Unknown key %s"%(key))

    photo_list = photo_list.filter(search)
    return (photo_list, criteria)


def search_list(request):
    web = webs.search_web()
    breadcrumbs = web.get_list_breadcrumbs()

    error = web.check_list_perms(request, breadcrumbs)
    if error is not None:
        return error

    if request.method == 'POST':
        form = forms.search_form(request.POST)

        if form.is_valid():
            search_dict = {}
            for key in form.cleaned_data:
                value = form.cleaned_data[key]
                if key == "person" or key == "album" or key == "category":
                    if len(value)>0:
                        search_dict[key] = encode_array(value)
                elif key == "photographer" or key == "location":
                    if value is not None:
                        search_dict[key] = encode_string(value.pk)
                elif key == "location_descendants" or key == "album_descendants" or key == "category_descendants":
                    if value:
                        search_dict[key] = encode_string(value)
                else:
                    if value != "" and value is not None:
                        search_dict[key] = encode_string(value)

            search_spec = encode_dict(search_dict)

            url=reverse("search_detail",kwargs={'object_id':search_spec})
            return HttpResponseRedirect(url)
    else:
        form = forms.search_form()

    context = { 'form': form, 'media': form.media }

    template='spud/search_list.html'

    defaults = {
            'web': web,
            'breadcrumbs': breadcrumbs,
            'form': form,
            'media': form.media,
    }

    return render_to_response(template, defaults,
            context_instance=RequestContext(request))


def search_detail(request, object_id):
    web = webs.search_web()
    object = search_class(object_id)
    (photo_list, criteria) = search_results(object_id)
    return web.object_photo_list(request,object,photo_list,context={ 'criteria': criteria })

def search_photo_detail(request, object_id, number, size):
    web = webs.search_web()
    object = search_class(object_id)
    (photo_list, criteria) = search_results(object_id)
    return web.object_photo_detail(request,object,number,photo_list,size)

def search_photo_edit(request, object_id, number, size):
    web = webs.search_web()
    object = search_class(object_id)
    (photo_list, criteria) = search_results(object_id)
    return web.object_photo_edit(request,object,number,photo_list,size)

############
# RELATION #
############

def photo_relation_list(request):
    web = webs.photo_relation_web()
    list = models.photo_relation.objects.all()
    table = tables.photo_relation_table(request.user, web, list, order_by=request.GET.get('sort'))
    return web.object_list(request, None, table)

def photo_relation_add(request, object_id=None):
    web = webs.photo_relation_web()

    if object_id is not None:
        web.initial_photo = get_object_or_404(models.photo, pk=object_id)
    else:
        web.initial_photo = None

    return web.object_add(request)

def photo_relation_edit(request, object_id):
    web = webs.photo_relation_web()
    object = get_object_or_404(models.photo_relation, pk=object_id)
    return web.object_edit(request, object)

def photo_relation_delete(request,object_id):
    web = webs.photo_relation_web()
    object = get_object_or_404(models.photo_relation, pk=object_id)
    return web.object_delete(request, object)

##########
# LEGACY #
##########

def legacy_list(request,type):
    if type == "place":
        return legacy_detail(request,type,1)
    elif type == "album":
        return legacy_detail(request,type,1)
    elif type == "category":
        return legacy_detail(request,type,1)
    elif type == "person":
        return HttpResponseRedirect(reverse("person_list"))
    else:
        raise Http404("Unknown type '%s'"%(type))

def legacy_detail(request,type,object_id):
    url = None
    if type == "place":
        object = get_object_or_404(models.place, pk=object_id)
        web = webs.place_web()
        url = web.get_view_url(object)

    elif type == "album":
        object = get_object_or_404(models.album, pk=object_id)
        web = webs.album_web()
        url = web.get_view_url(object)

    elif type == "category":
        object = get_object_or_404(models.category, pk=object_id)
        web = webs.category_web()
        url = web.get_view_url(object)

    elif type == "person":
        object = get_object_or_404(models.person, pk=object_id)
        web = webs.person_web()
        url = web.get_view_url(object)

    elif type == "photo":
        object = get_object_or_404(models.photo, pk=object_id)
        web = webs.photo_web()
        url = web.get_view_url(object)

    if url is None:
        raise Http404("Unknown type '%s'"%(type))

    return HttpResponseRedirect(url)

