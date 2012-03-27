from django.shortcuts import get_object_or_404, render_to_response
from django.template import RequestContext
from django.core.urlresolvers import reverse
from django.http import HttpResponseRedirect, Http404
from django.contrib.comments.moderation import CommentModerator, moderator
from django.contrib.comments.signals import comment_was_flagged, comment_was_posted
from django.utils.encoding import smart_unicode
from django.conf import settings
from django.utils.translation import ugettext as _
from django.views.decorators.csrf import csrf_exempt
from django.db.models import Q

from spud.comments.models import CommentWithRating
from spud import models
from spud import forms
from spud import webs
from spud import tables

from datetime import datetime, timedelta

def root(request):
    breadcrumbs = []
    breadcrumbs.append(webs.breadcrumb(reverse("root"), _("Home")))

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
    object = get_object_or_404(models.photo, pk=object_id)
    return web.object_photo_detail(request,object,0,size)

def photo_edit(request, object_id, size):
    web = webs.photo_web()
    object = get_object_or_404(models.photo, pk=object_id)
    return web.object_photo_edit(request,object,0,size)

def photo_update(request, object_id):
    web = webs.photo_web()
    object = get_object_or_404(models.photo, pk=object_id)
    return web.object_photo_update(request,object)

#########
# PLACE #
#########

def place_redirect(request,object_id):
    web = webs.place_web()
    object = get_object_or_404(models.place, pk=object_id)
    return HttpResponseRedirect(web.get_view_url(object))

def place_detail(request, object_id):
    web = webs.place_web()
    if 'place' in request.GET:
        form = forms.search_place_form(request.GET)

        if form.is_valid():
            place = form.cleaned_data['place']
            url=web.get_view_url(place)
            return HttpResponseRedirect(url)
    else:
        form = forms.search_place_form()

    context = { 'form': form, 'media': form.media }
    object = get_object_or_404(models.place, pk=object_id)
    return web.object_photo_list(request,object,context=context)

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
    return web.object_photo_detail(request,object,number,size)

def place_photo_edit(request, object_id, number, size):
    web = webs.place_web()
    object = get_object_or_404(models.place, pk=object_id)
    return web.object_photo_edit(request,object,number,size)

def place_photo_update(request, object_id):
    web = webs.place_web()
    object = get_object_or_404(models.place, pk=object_id)
    return web.object_photo_update(request,object)

#########
# ALBUM #
#########

def album_redirect(request,object_id):
    web = webs.album_web()
    object = get_object_or_404(models.album, pk=object_id)
    return HttpResponseRedirect(web.get_view_url(object))

def album_detail(request, object_id):
    web = webs.album_web()
    if 'album' in request.GET:
        form = forms.search_album_form(request.GET)

        if form.is_valid():
            album = form.cleaned_data['album']
            url=web.get_view_url(album)
            return HttpResponseRedirect(url)
    else:
        form = forms.search_album_form()

    context = { 'form': form, 'media': form.media }
    object = get_object_or_404(models.album, pk=object_id)
    return web.object_photo_list(request,object,context=context)

def album_todo(request):
    web = webs.album_web()
    dt = datetime.now()-timedelta(days=365)
    default_list_size = request.session.get('default_list_size', settings.DEFAULT_LIST_SIZE)
    objects = models.album.objects.filter(Q(revised__lt=dt) | Q(revised__isnull=True)).order_by('revised','-pk')
    table = tables.album_table(request.user, web, default_list_size, objects, order_by=request.GET.get('sort'))
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
    return web.object_photo_detail(request,object,number,size)

def album_photo_edit(request, object_id, number, size):
    web = webs.album_web()
    object = get_object_or_404(models.album, pk=object_id)
    return web.object_photo_edit(request,object,number,size)

def album_photo_update(request, object_id):
    web = webs.album_web()
    object = get_object_or_404(models.album, pk=object_id)
    return web.object_photo_update(request,object)

############
# CATEGORY #
############

def category_redirect(request,object_id):
    web = webs.category_web()
    object = get_object_or_404(models.category, pk=object_id)
    return HttpResponseRedirect(web.get_view_url(object))

def category_detail(request, object_id):
    web = webs.category_web()
    if 'category' in request.GET:
        form = forms.search_category_form(request.GET)

        if form.is_valid():
            category = form.cleaned_data['category']
            url=web.get_view_url(category)
            return HttpResponseRedirect(url)
    else:
        form = forms.search_category_form()

    context = { 'form': form, 'media': form.media }
    object = get_object_or_404(models.category, pk=object_id)
    return web.object_photo_list(request,object,context=context)

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
    return web.object_photo_detail(request,object,number,size)

def category_photo_edit(request, object_id, number, size):
    web = webs.category_web()
    object = get_object_or_404(models.category, pk=object_id)
    return web.object_photo_edit(request,object,number,size)

def category_photo_update(request, object_id):
    web = webs.category_web()
    object = get_object_or_404(models.category, pk=object_id)
    return web.object_photo_update(request,object)

##########
# PERSON #
##########

def person_list(request):
    web = webs.person_web()
    if 'person' in request.GET:
        form = forms.search_person_form(request.GET)

        if form.is_valid():
            person = form.cleaned_data['person']
            url=web.get_view_url(person)
            return HttpResponseRedirect(url)
    else:
        form = forms.search_person_form()

    default_list_size = request.session.get('default_list_size', settings.DEFAULT_LIST_SIZE)
    list = models.person.objects.all()
    table = tables.person_table(request.user, web, default_list_size, list, order_by=request.GET.get('sort'))
    return web.object_list(request, form, table)

def person_redirect(request,object_id):
    web = webs.person_web()
    object = get_object_or_404(models.person, pk=object_id)
    return HttpResponseRedirect(web.get_view_url(object))

def person_detail(request, object_id):
    web = webs.person_web()
    object = get_object_or_404(models.person, pk=object_id)
    return web.object_photo_list(request,object)

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
    return web.object_photo_detail(request,object,number,size)

def person_photo_edit(request, object_id, number, size):
    web = webs.person_web()
    object = get_object_or_404(models.person, pk=object_id)
    return web.object_photo_edit(request,object,number,size)

def person_photo_update(request, object_id):
    web = webs.person_web()
    object = get_object_or_404(models.person, pk=object_id)
    return web.object_photo_update(request,object)

########
# DATE #
########

class date_class(models.base_model):

    def __init__(self,date):
        self.string=date
        self.date=date[0:10]
        self.offset=date[10:15]

    def __unicode__(self):
        return self.date

    def get(self, key, default):
        if key=="date":
            return self.date
        return default

    def get_datetime(self):
        return datetime.strptime(self.date, "%Y-%m-%d")

    def get_utc_offset(self):
        return timedelta(hours=int(self.offset[0:3]),minutes=int(self.offset[3:6]))

    @property
    def pk(self):
        return self.string

def date_list(request):
    web = webs.date_web()

    if 'date' in request.GET:
        form = forms.search_date_form(request.GET)

        if form.is_valid():
            date = form.cleaned_data['date'].isoformat()+"+0000"
            object = date_class(date)
            url = web.get_view_url(object)
            return HttpResponseRedirect(url)
    else:
        form = forms.search_date_form()

    list = models.photo.objects.dates('datetime', 'day')
    list = [ date_class(instance.date().isoformat()+"+0000") for instance in list ]
    table = tables.date_table(web, list, order_by=request.GET.get('sort'))
    return web.object_list(request, form, table)

def date_detail(request, object_id):
    web = webs.date_web()
    object = date_class(object_id)
    return web.object_photo_list(request,object)

def date_photo_detail(request, object_id, number, size):
    web = webs.date_web()
    object = date_class(object_id)
    return web.object_photo_detail(request,object,number,size)

def date_photo_edit(request, object_id, number, size):
    web = webs.date_web()
    object = date_class(object_id)
    return web.object_photo_edit(request,object,number,size)

def date_photo_update(request, object_id):
    web = webs.date_web()
    object = date_class(object_id)
    return web.object_photo_update(request,object)

##########
# ACTION #
##########

class action_class(models.base_model):

    # action is a url string. "none" == no action
    def __init__(self,action):
        # translate string into db string. None == no action.
        if action.lower() == "none":
            self.action = None
        else:
            self.action = action

    # User friendly name for action
    def __unicode__(self):
        # translate db strings into user friendly string
        return models.action_to_string(self.action)

    # Used for ????
    def get(self, key, default):
        if key=="action":
            if self.action is not None:
                return self.action
            else:
                return "None"
        return default

    # Used for URLS
    @property
    def pk(self):
        # needs to return a url string. "none" == no action
        if self.action is None:
            return "none"
        else:
            return self.action

def action_list(request):
    web = webs.action_web()
    list = [ action_class("none") ]
    list.extend( [ action_class(i[0]) for i in models.PHOTO_ACTION ] )
    table = tables.action_table(web, list, order_by=request.GET.get('sort'))
    return web.object_list(request, None, table)

def action_detail(request, object_id):
    web = webs.action_web()
    object = action_class(object_id)
    return web.object_photo_list(request,object)

def action_photo_detail(request, object_id, number, size):
    web = webs.action_web()
    object = action_class(object_id)
    return web.object_photo_detail(request,object,number,size)

def action_photo_edit(request, object_id, number, size):
    web = webs.action_web()
    object = action_class(object_id)
    return web.object_photo_edit(request,object,number,size)

def action_photo_update(request, object_id):
    web = webs.action_web()
    object = action_class(object_id)
    return web.object_photo_update(request,object)

##########
# SEARCH #
##########

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

class search_class(models.base_model):

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

@csrf_exempt
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
                elif key == "location_none" or key == "album_none" or key == "category_none" or key == "person_none":
                    if value:
                        search_dict[key] = encode_string("true")
                else:
                    if value != "" and value is not None:
                        search_dict[key] = encode_string(value)

            if len(search_dict) > 0:
                search_spec = encode_dict(search_dict)
                url=reverse("search_detail",kwargs={'object_id':search_spec})
                return HttpResponseRedirect(url)
    else:
        form = forms.search_form()

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
    criteria = web.get_criteria(object)
    return web.object_photo_list(request,object,context={ 'criteria': criteria })

def search_photo_detail(request, object_id, number, size):
    web = webs.search_web()
    object = search_class(object_id)
    criteria = web.get_criteria(object)
    return web.object_photo_detail(request,object,number,size)

def search_photo_edit(request, object_id, number, size):
    web = webs.search_web()
    object = search_class(object_id)
    criteria = web.get_criteria(object)
    return web.object_photo_edit(request,object,number,size)

def search_photo_update(request, object_id):
    web = webs.search_web()
    object = search_class(object_id)
    criteria = web.get_criteria(object)
    return web.object_photo_update(request,object)

############
# RELATION #
############

def photo_relation_list(request):
    web = webs.photo_relation_web()
    list = models.photo_relation.objects.all()
    default_list_size = request.session.get('default_list_size', settings.DEFAULT_LIST_SIZE)
    default_view_size = request.session.get('default_view_size', settings.DEFAULT_VIEW_SIZE)
    table = tables.photo_relation_table(request.user, web, default_list_size, default_view_size, list, order_by=request.GET.get('sort'))
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


############
# SETTINGS #
############

def settings_form(request):
    breadcrumbs = []
    breadcrumbs.append(webs.breadcrumb(reverse("root"), _("Home")))
    breadcrumbs.append(webs.breadcrumb(reverse("settings_form"), _("Settings")))

    if request.method == 'POST':
        form = forms.settings_form(request.POST)

        if form.is_valid():
            url = reverse("root")
            url = request.GET.get("next",url)

            request.session["photos_per_page"] = form.cleaned_data['photos_per_page']
            request.session["default_list_size"] = form.cleaned_data['default_list_size']
            request.session["default_view_size"] = form.cleaned_data['default_view_size']
            request.session["default_click_size"] = form.cleaned_data['default_click_size']

            return HttpResponseRedirect(url)
    else:
        form = forms.settings_form({
            'photos_per_page': request.session.get('photos_per_page', 25),
            'default_list_size': request.session.get('default_list_size', settings.DEFAULT_LIST_SIZE),
            'default_view_size': request.session.get('default_view_size', settings.DEFAULT_VIEW_SIZE),
            'default_click_size': request.session.get('default_click_size', settings.DEFAULT_CLICK_SIZE),
        })

    template='spud/settings_form.html'

    defaults = {
            'breadcrumbs': breadcrumbs,
            'form': form,
            'media': form.media,
    }

    return render_to_response(template, defaults,
            context_instance=RequestContext(request))
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

