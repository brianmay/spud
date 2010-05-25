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

from datetime import *

import re
import random

def spud_root(request):
    breadcrumbs = [ ]
    breadcrumbs.append(models.breadcrumb(reverse("spud_root"),"home"))

    return render_to_response('spud/index.html', {
                                'breadcrumbs': breadcrumbs,
                                },
                        context_instance=RequestContext(request))

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

#####################
# PERMISSION CHECKS #
#####################

def HttpErrorResponse(request, breadcrumbs, error_list):
    t = loader.get_template('spud/error.html')
    c = RequestContext(request, {
            'title': 'Access denied',
            'error_list': error_list,
            'breadcrumbs': breadcrumbs
    })
    return HttpResponseForbidden(t.render(c))

def check_add_perms(request, breadcrumbs, types):
    error_list = []
    for type in types:
        if not type.has_add_perms(request.user):
            error_list.append("You cannot create a %s object"%(type.single_name()))

    if len(error_list) > 0:
        return HttpErrorResponse(request, breadcrumbs, error_list)
    else:
        return None

def check_edit_perms(request, breadcrumbs, types):
    error_list = []
    for type in types:
        if not type.has_edit_perms(request.user):
            error_list.append("You cannot create a %s object"%(type.single_name()))

    if len(error_list) > 0:
        return HttpErrorResponse(request, breadcrumbs, error_list)
    else:
        return None

def check_delete_perms(request, breadcrumbs, types):
    error_list = []
    for type in types:
        if not type.has_delete_perms(request.user):
            error_list.append("You cannot create a %s object"%(type.single_name()))

    if len(error_list) > 0:
        return HttpErrorResponse(request, breadcrumbs, error_list)
    else:
        return None

#####################
# GENERIC FUNCTIONS #
#####################

def object_list(request, object_list, type, template=None, kwargs={}, context={}):
    breadcrumbs = type.get_breadcrumbs(**kwargs)
    if template is None:
        template='spud/'+type.type_id+'_list.html'

    paginator = Paginator(object_list, 50) # Show 50 objects per page

    # Make sure page request is an int. If not, deliver first page.
    try:
        page = int(request.GET.get('page', '1'))
    except ValueError:
        page = 1

    # If page request (9999) is out of range, deliver last page of results.
    try:
        page_obj = paginator.page(page)
    except (EmptyPage, InvalidPage):
        page_obj = paginator.page(paginator.num_pages)

    defaults = {
            'type': type,
            'page_obj': page_obj,
            'breadcrumbs': breadcrumbs,
    }
    defaults.update(context)
    return render_to_response(template, defaults,
            context_instance=RequestContext(request))

def object_detail(request, object, template=None):
    if template is None:
        template='spud/'+object.type.type_id+'_detail.html'
    return render_to_response(template, {
            'object': object,
            'breadcrumbs': object.get_breadcrumbs(),
            },context_instance=RequestContext(request))

def object_create(request, type, modal_form, get_defaults=None, pre_save=None, template=None, kwargs={}):
    breadcrumbs = type.get_create_breadcrumbs(**kwargs)
    if template is None:
        template='spud/object_edit.html'

    types = [ type ]
    error = check_add_perms(request, breadcrumbs, types)
    if error is not None:
        return error

    if request.method == 'POST':
        form = modal_form(request.POST, request.FILES)

        if form.is_valid():
            valid = True
            instance = form.save(commit=False)

            if pre_save is not None:
                valid = pre_save(instance=instance, form=form)

            if valid:
                instance.save()
                form.save_m2m()
                url=instance.get_edited_url()
                return HttpResponseRedirect(url)
    else:
        if get_defaults is None:
            form = modal_form()
        else:
            instance = get_defaults()
            form = modal_form(instance=instance)

    return render_to_response(template, {
            'object': None, 'type': type,
            'breadcrumbs': breadcrumbs,
            'form' : form,
            'media' : form.media,
            },context_instance=RequestContext(request))

def object_edit(request, object, modal_form, pre_save=None, template=None):
    breadcrumbs = object.get_edit_breadcrumbs()
    if template is None:
        template='spud/object_edit.html'

    types = [ object.type ]
    error = check_edit_perms(request, breadcrumbs, types)
    if error is not None:
        return error

    if request.method == 'POST':
        form = modal_form(request.POST, request.FILES, instance=object)
        if form.is_valid():
            valid = True
            instance = form.save(commit=False)

            if pre_save is not None:
                valid = pre_save(instance=instance, form=form)

            if valid:
                instance.save()
                form.save_m2m()
                url = instance.get_edited_url()
                return HttpResponseRedirect(url)
    else:
        form = modal_form(instance=object)

    return render_to_response(template, {
            'object': object,
            'breadcrumbs': breadcrumbs,
            'form' : form,
            'media' : form.media,
            },context_instance=RequestContext(request))

def object_delete(request, object, template=None):
    breadcrumbs = object.get_delete_breadcrumbs()
    if template is None:
        template='spud/object_confirm_delete.html'

    types = [ object.type ]
    error = check_delete_perms(request, breadcrumbs, types)
    if error is not None:
        return error

    errorlist = []
    if request.method == 'POST':
        errorlist = object.check_delete()
        if len(errorlist) == 0:
            url = object.get_deleted_url()
            object.delete()
            return HttpResponseRedirect(url)

    return render_to_response(template, {
            'object': object,
            'breadcrumbs': breadcrumbs,
            'errorlist': errorlist,
            },context_instance=RequestContext(request))

def object_photo_list(request,object,photo_list,links,template=None):
    breadcrumbs = object.get_breadcrumbs()
    paginator = Paginator(photo_list, 25) # Show 25 photos per page

    if template is None:
        template='spud/'+object.type.type_id+'_detail.html'

    # Make sure page request is an int. If not, deliver first page.
    try:
        page = int(request.GET.get('page', '1'))
    except ValueError:
        page = 1

    # If page request (9999) is out of range, deliver last page of results.
    try:
        page_obj = paginator.page(page)
    except (EmptyPage, InvalidPage):
        page_obj = paginator.page(paginator.num_pages)

    return render_to_response(template, {
                                "object": object,
                                "page_obj": page_obj,
                                "links": links,
                                'breadcrumbs': breadcrumbs},
                                context_instance=RequestContext(request))


def object_photo_detail(request,object,number,photo_list,links):
    breadcrumbs = object.get_breadcrumbs()
    paginator = Paginator(photo_list, 1)

    template='spud/photo_detail.html'

    if number == "random":
        number = random.randint(1,paginator.num_pages)
        url = links.photo_detail_link(number)
        return HttpResponseRedirect(url)

    # If page request (9999) is out of range, deliver last page of results.
    try:
        page_obj = paginator.page(number)
    except (EmptyPage, InvalidPage):
        page_obj = paginator.page(paginator.num_pages)

    if page_obj.object_list.count() <= 0:
        raise Http404("No photos were found")

    photo_object = page_obj.object_list[0]

    detail_url = links.photo_detail_link(page_obj.number)
    breadcrumbs.append(models.breadcrumb(detail_url,photo_object))

    return render_to_response(template, {
                                'object': photo_object,
                                'page_obj': page_obj,
                                'links': links,
                                'breadcrumbs': breadcrumbs,
                                },
                                context_instance=RequestContext(request))

def object_photo_edit(request,object,number,photo_list,links):
    breadcrumbs = object.get_breadcrumbs()
    paginator = Paginator(photo_list, 1)

    template='spud/photo_edit.html'

    if number == "random":
        number = random.randint(1,paginator.num_pages)
        url = links.photo_edit_link(number)
        return HttpResponseRedirect(url)

    # If page request (9999) is out of range, deliver last page of results.
    try:
        page_obj = paginator.page(number)
    except (EmptyPage, InvalidPage):
        page_obj = paginator.page(paginator.num_pages)

    if page_obj.object_list.count() <= 0:
        raise Http404("No photos were found")

    photo_object = page_obj.object_list[0]

    if request.method == 'POST':
        form = forms.photo_extra_form(request.POST)

        # search result may have changed, value in form is
        # authoritive
        if form.is_valid():
            photo_id = form.cleaned_data['photo_id']
            if photo_object.pk != photo_id:
                    photo_object = get_object_or_404(models.photo, pk=photo_id)

            updates = form.cleaned_data['updates']
            for update in updates:
                if update.verb == "add" and update.noun == "person":
                    for o in update.objects:

                        # try to guess the position we should assign
                        if o.position == "":
                            pp = models.photo_person.objects.filter(photo=photo_object).order_by("-position")
                            try:
                                if pp[0].position is not None:
                                    position = pp[0].position + 1
                                else:
                                    position = None
                            except IndexError:
                                position = 1
                        else:
                            position = o.position

                        models.photo_person.objects.get_or_create(photo=photo_object,person=o.person,
                                defaults={'position': position}
                        )
                elif update.verb == "delete" and update.noun == "person":
                    for o in update.objects:
                        if o.position == "":
                            models.photo_person.objects.filter(photo=photo_object,person=o.person).delete()
                        else:
                            models.photo_person.objects.filter(photo=photo_object,person=o.person,position=o.position).delete()
                elif update.verb == "set" and update.noun == "person":
                    models.photo_person.objects.filter(photo=photo_object,person=update.object).update(position=update.position)
                elif update.verb == "add" and update.noun == "album":
                    for album in update.objects:
                        models.photo_album.objects.get_or_create(photo=photo_object,album=album)
                elif update.verb == "delete" and update.noun == "album":
                    for album in update.objects:
                        models.photo_album.objects.filter(photo=photo_object,album=album).delete()
                elif update.verb == "add" and update.noun == "category":
                    for category in update.objects:
                        models.photo_category.objects.get_or_create(photo=photo_object,category=category)
                elif update.verb == "delete" and update.noun == "category":
                    for category in update.objects:
                        models.photo_category.objects.filter(photo=photo_object,category=category).delete()
                elif update.verb == "set" and update.noun == "place":
                    if update.object == "None":
                        photo_object.location = None
                    else:
                        photo_object.location = update.object
                elif update.verb == "set" and update.noun == "photographer":
                    if update.object == "None":
                        photo_object.photographer = None
                    else:
                        photo_object.photographer = update.object
                elif update.verb == "set" and update.noun == "title":
                    if update.object == "None":
                        photo_object.title = ""
                    else:
                        photo_object.title = update.object
                elif update.verb == "set" and update.noun == "description":
                    if update.object == "None":
                        photo_object.description = ""
                    else:
                        photo_object.description = update.object

                else:
                    raise Http404("operation '%s' '%s' not implemented"%(update.verb, update.noun))

            if 'queer' in request.POST:
                try:
                    photo_id = request.POST['photo_id']
                    photo_id = int(str(photo_id))
                except KeyError, e:
                    raise Http404("photo_id not given")
                except (ValueError,TypeError), e:
                    raise Http404("photo_id is invalid")

                if photo_object.pk != photo_id:
                    photo_object = get_object_or_404(models.photo, pk=photo_id)

                queer = get_object_or_404(models.queer, name=request.POST['queer'])

                photo_object.update_from_queer(queer)

            photo_object.save()


            if "goto" not in request.POST:
                goto = 'save'
            else:
                goto = request.POST['goto']

            if goto == "prev":
                number = page_obj.number - 1
                if number < 1:
                    number = 1
                url = links.photo_edit_link(number)
            elif goto == "next":
                number = page_obj.number + 1
                if number > page_obj.paginator.num_pages:
                    number = page_obj.paginator.num_pages
                url = links.photo_edit_link(number)
            elif goto == "save":
                url = links.photo_edit_link(page_obj.number)
            else:
                url = links.photo_detail_link(page_obj.number)

            return HttpResponseRedirect(url)

    else:
        form = forms.photo_extra_form({
                                'photo_id': photo_object.pk,
                                'updates': '',
                                })

    # can't do this until after we confirm the object
    detail_url = links.photo_detail_link(page_obj.number)
    edit_url = links.photo_edit_link(page_obj.number)

    breadcrumbs.append(models.breadcrumb(detail_url,photo_object))
    breadcrumbs.append(models.breadcrumb(edit_url,"edit"))

    return render_to_response(template, {
            'object': photo_object,
            'page_obj': page_obj,
            'links': links,
            'form' : form, 'breadcrumbs': breadcrumbs,
            'media' : form.media,
            },context_instance=RequestContext(request))

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

class photo_links:
    def __init__(self,object_id):
        self.object_id = object_id

    def photo_detail_link(self,number):
        return reverse("photo_detail", kwargs={ 'object_id': self.object_id })

    def photo_edit_link(self,number):
        return reverse("photo_edit", kwargs={ 'object_id': self.object_id })

class photo_class:

    def __init__(self, photo_id):
        self.photo_id = photo_id

    def results(self):
        photo_list = models.photo.objects.filter(pk=self.photo_id)
        return photo_list

    def get_breadcrumbs(self):
        breadcrumbs = self.type.get_breadcrumbs()
        return breadcrumbs

    def get_absolute_url(self):
        return reverse("photo_detail",kwargs={'object_id':self.photo_id})

    class type(models.photo.type):
        pass

def photo_orig_redirect(request,object_id):
    object = get_object_or_404(models.photo, pk=object_id)
    url = object.get_orig_url()
    return HttpResponseRedirect(url)

def photo_thumb_redirect(request,object_id,size):
    if size in settings.IMAGE_SIZES:
        object = get_object_or_404(models.photo, pk=object_id)
        url = object.get_thumb_url(size)
        return HttpResponseRedirect(url)
    else:
        raise Http404("Unknown image size '%s'"%(size))

def photo_detail(request, object_id):
    object = photo_class(object_id)
    photo_list = object.results()
    links = photo_links(object_id)
    return object_photo_detail(request,object,0,photo_list,links)

def photo_edit(request, object_id):
    object = photo_class(object_id)
    photo_list = object.results()
    links = photo_links(object_id)
    return object_photo_edit(request,object,0,photo_list,links)

#########
# PLACE #
#########

class place_links:
    def __init__(self,object_id):
        self.object_id = object_id

    def photo_detail_link(self,number):
        return reverse("place_photo_detail", kwargs={ 'object_id': self.object_id, 'number': number })

    def photo_edit_link(self,number):
        return reverse("place_photo_edit", kwargs={ 'object_id': self.object_id, 'number': number })

def place_redirect(request,object_id):
    object = get_object_or_404(models.place, pk=object_id)
    return HttpResponseRedirect(object.get_absolute_url())

def place_detail(request, object_id):
    object = get_object_or_404(models.place, pk=object_id)
    photo_list = models.photo.objects.filter(location=object)
    links = place_links(object_id)
    return object_photo_list(request,object,photo_list,links)

def place_create(request, object_id):
    type = models.place.type
    parent = get_object_or_404(models.place, pk=object_id)
    modal_form = forms.place_form

    def get_defaults():
        instance = models.place()
        instance.parent_place = parent
        return instance

    return object_create(request, type, modal_form, get_defaults=get_defaults, kwargs={ 'parent': parent })

def place_edit(request,object_id):
    object = get_object_or_404(models.place, pk=object_id)
    return object_edit(request, object, forms.place_form)

def place_delete(request,object_id):
    object = get_object_or_404(models.place, pk=object_id)
    return object_delete(request, object)

def place_photo_detail(request, object_id, number):
    object = get_object_or_404(models.place, pk=object_id)
    photo_list = models.photo.objects.filter(location=object)
    links = place_links(object_id)
    return object_photo_detail(request,object,number,photo_list,links)

def place_photo_edit(request, object_id, number):
    object = get_object_or_404(models.place, pk=object_id)
    photo_list = models.photo.objects.filter(location=object)
    links = place_links(object_id)
    return object_photo_edit(request,object,number,photo_list,links)

#########
# ALBUM #
#########

class album_links:
    def __init__(self,object_id):
        self.object_id = object_id

    def photo_detail_link(self,number):
        return reverse("album_photo_detail", kwargs={ 'object_id': self.object_id, 'number': number })

    def photo_edit_link(self,number):
        return reverse("album_photo_edit", kwargs={ 'object_id': self.object_id, 'number': number })

def album_redirect(request,object_id):
    object = get_object_or_404(models.album, pk=object_id)
    return HttpResponseRedirect(object.get_absolute_url())

def album_detail(request, object_id):
    object = get_object_or_404(models.album, pk=object_id)
    photo_list = models.photo.objects.filter(albums=object)
    links = album_links(object_id)
    return object_photo_list(request,object,photo_list,links)

def album_create(request, object_id):
    type = models.album.type
    parent = get_object_or_404(models.album, pk=object_id)
    modal_form = forms.album_form

    def get_defaults():
        instance = models.album()
        instance.parent_album = parent
        return instance

    return object_create(request, type, modal_form, get_defaults=get_defaults, kwargs={ 'parent': parent })

def album_edit(request,object_id):
    object = get_object_or_404(models.album, pk=object_id)
    return object_edit(request, object, forms.album_form)

def album_delete(request,object_id):
    object = get_object_or_404(models.album, pk=object_id)
    return object_delete(request, object)

def album_photo_detail(request, object_id, number):
    object = get_object_or_404(models.album, pk=object_id)
    photo_list = models.photo.objects.filter(albums=object)
    links = album_links(object_id)
    return object_photo_detail(request,object,number,photo_list,links)

def album_photo_edit(request, object_id, number):
    object = get_object_or_404(models.album, pk=object_id)
    photo_list = models.photo.objects.filter(albums=object)
    links = album_links(object_id)
    return object_photo_edit(request,object,number,photo_list,links)

############
# CATEGORY #
############

class category_links:
    def __init__(self,object_id):
        self.object_id = object_id

    def photo_detail_link(self,number):
        return reverse("category_photo_detail", kwargs={ 'object_id': self.object_id, 'number': number })

    def photo_edit_link(self,number):
        return reverse("category_photo_edit", kwargs={ 'object_id': self.object_id, 'number': number })

def category_redirect(request,object_id):
    object = get_object_or_404(models.category, pk=object_id)
    return HttpResponseRedirect(object.get_absolute_url())

def category_detail(request, object_id):
    object = get_object_or_404(models.category, pk=object_id)
    photo_list = models.photo.objects.filter(categorys=object)
    links = category_links(object_id)
    return object_photo_list(request,object,photo_list,links)

def category_create(request, object_id):
    type = models.category.type
    parent = get_object_or_404(models.category, pk=object_id)
    modal_form = forms.category_form

    def get_defaults():
        instance = models.category()
        instance.parent_category = parent
        return instance

    return object_create(request, type, modal_form, get_defaults=get_defaults, kwargs={ 'parent': parent })

def category_edit(request,object_id):
    object = get_object_or_404(models.category, pk=object_id)
    return object_edit(request, object, forms.category_form)

def category_delete(request,object_id):
    object = get_object_or_404(models.category, pk=object_id)
    return object_delete(request, object)

def category_photo_detail(request, object_id, number):
    object = get_object_or_404(models.category, pk=object_id)
    photo_list = models.photo.objects.filter(categorys=object)
    links = category_links(object_id)
    return object_photo_detail(request,object,number,photo_list,links)

def category_photo_edit(request, object_id, number):
    object = get_object_or_404(models.category, pk=object_id)
    photo_list = models.photo.objects.filter(categorys=object)
    links = category_links(object_id)
    return object_photo_edit(request,object,number,photo_list,links)

##########
# PERSON #
##########

class person_links:
    def __init__(self,object_id):
        self.object_id = object_id

    def photo_detail_link(self,number):
        return reverse("person_photo_detail", kwargs={ 'object_id': self.object_id, 'number': number })

    def photo_edit_link(self,number):
        return reverse("person_photo_edit", kwargs={ 'object_id': self.object_id, 'number': number })

def person_list(request):
    if request.method == 'POST':
        form = forms.search_person_form(request.POST)

        if form.is_valid():
            person = form.cleaned_data['person']
            url=person.get_absolute_url()
            return HttpResponseRedirect(url)
    else:
        form = forms.search_person_form()

    context = { 'form': form, 'media': form.media }
    type = models.person.type
    list = models.person.objects.all()
    return object_list(request, list, type, context=context)

def person_redirect(request,object_id):
    object = get_object_or_404(models.person, pk=object_id)
    return HttpResponseRedirect(object.get_absolute_url())

def person_detail(request, object_id):
    object = get_object_or_404(models.person, pk=object_id)
    photo_list = models.photo.objects.filter(persons=object)
    links = person_links(object_id)
    return object_photo_list(request,object,photo_list,links)

def person_create(request):
    type = models.person.type
    modal_form = forms.person_form
    return object_create(request, type, modal_form)

def person_edit(request,object_id):
    object = get_object_or_404(models.person, pk=object_id)
    return object_edit(request, object, forms.person_form)

def person_delete(request,object_id):
    object = get_object_or_404(models.person, pk=object_id)
    return object_delete(request, object)

def person_photo_detail(request, object_id, number):
    object = get_object_or_404(models.person, pk=object_id)
    photo_list = models.photo.objects.filter(persons=object)
    links = person_links(object_id)
    return object_photo_detail(request,object,number,photo_list,links)

def person_photo_edit(request, object_id, number):
    object = get_object_or_404(models.person, pk=object_id)
    photo_list = models.photo.objects.filter(persons=object)
    links = person_links(object_id)
    return object_photo_edit(request,object,number,photo_list,links)

########
# DATE #
########

class date_links:
    def __init__(self,object_id):
        self.object_id = object_id

    def photo_detail_link(self,number):
        return reverse("date_photo_detail", kwargs={ 'object_id': self.object_id, 'number': number })

    def photo_edit_link(self,number):
        return reverse("date_photo_edit", kwargs={ 'object_id': self.object_id, 'number': number })

class date_class:

    def __init__(self,date):
        self.date=date

    def results(self):
        m = re.match("^(\d\d\d\d)-(\d\d)-(\d\d)$",self.date)
        if m is not None:
            (year,month,day)=(int(m.group(1)),int(m.group(2)),int(m.group(3)))
            photo_list = models.photo.objects.filter(datetime__year=year,datetime__month=month,datetime__day=day)
        else:
            photo_list = models.photo.objects.all()
        return photo_list

    def get_breadcrumbs(self):
        breadcrumbs = self.type.get_breadcrumbs()
        breadcrumbs.append(models.breadcrumb(reverse("date_detail",kwargs={'object_id':self.date}),self.date))
        return breadcrumbs

    def get_absolute_url(self):
        return reverse("date_detail",kwargs={'object_id':self.date})

    def __unicode__(self):
        return self.date

    class type(models.base_model.type):
        type_id = "date"

def date_list(request):
    if request.method == 'POST':
        form = forms.search_date_form(request.POST)

        if form.is_valid():
            date = form.cleaned_data['date']
            object = date_class(date)
            url = object.get_absolute_url()
            return HttpResponseRedirect(url)
    else:
        form = forms.search_date_form()

    context = { 'form': form, 'media': form.media }
    type = date_class.type
    list = models.photo.objects.dates('datetime', 'day')
    return object_list(request, list, type, context=context)

def date_detail(request, object_id):
    object = date_class(object_id)
    photo_list = object.results()
    links = date_links(object_id)
    return object_photo_list(request,object,photo_list,links)

def date_photo_detail(request, object_id, number):
    object = date_class(object_id)
    photo_list = object.results()
    links = date_links(object_id)
    return object_photo_detail(request,object,number,photo_list,links)

def date_photo_edit(request, object_id, number):
    object = date_class(object_id)
    photo_list = object.results()
    links = date_links(object_id)
    return object_photo_edit(request,object,number,photo_list,links)

##########
# STATUS #
##########

class status_links:
    def __init__(self,object_id):
        self.object_id = object_id

    def photo_detail_link(self,number):
        return reverse("status_photo_detail", kwargs={ 'object_id': self.object_id, 'number': number })

    def photo_edit_link(self,number):
        return reverse("status_photo_edit", kwargs={ 'object_id': self.object_id, 'number': number })

class status_class:

    def __init__(self,status):
        if status == "none":
            self.status = ""
        else:
            self.status=status

    def results(self):
        status = self.status
        photo_list = models.photo.objects.filter(status=status)
        return photo_list

    def get_breadcrumbs(self):
        status = self.status
        if status == "":
            status="none"
        breadcrumbs = self.type.get_breadcrumbs()
        breadcrumbs.append(models.breadcrumb(reverse("status_detail",kwargs={'object_id':status}),self))
        return breadcrumbs

    def get_absolute_url(self):
        status = self.status
        if status == "":
            status="none"
        return reverse("status_detail",kwargs={'object_id':status})

    def __unicode__(self):
        return models.status_to_string(self.status)

    class type(models.base_model.type):
        type_id = "status"
        verbose_name_plural = "status"

def status_list(request):
    type = status_class.type
    list = [ status_class("") ]
    list.extend( [ status_class(i[0]) for i in models.PHOTO_STATUS ] )
    return object_list(request, list, type)

def status_detail(request, object_id):
    object = status_class(object_id)
    photo_list = object.results()
    links = status_links(object_id)
    return object_photo_list(request,object,photo_list,links)

def status_photo_detail(request, object_id, number):
    object = status_class(object_id)
    photo_list = object.results()
    links = status_links(object_id)
    return object_photo_detail(request,object,number,photo_list,links)

def status_photo_edit(request, object_id, number):
    object = status_class(object_id)
    photo_list = object.results()
    links = status_links(object_id)
    return object_photo_edit(request,object,number,photo_list,links)

##########
# SEARCH #
##########

class search_links:
    def __init__(self,object_id):
        self.object_id = object_id

    def photo_detail_link(self,number):
        return reverse("search_photo_detail", kwargs={ 'object_id': self.object_id, 'number': number })

    def photo_edit_link(self,number):
        return reverse("search_photo_edit", kwargs={ 'object_id': self.object_id, 'number': number })

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

class search_links:
    def __init__(self,object_id):
        self.object_id = object_id

    def photo_detail_link(self,number):
        return reverse("search_photo_detail", kwargs={ 'object_id': self.object_id, 'number': number })

    def photo_edit_link(self,number):
        return reverse("search_photo_edit", kwargs={ 'object_id': self.object_id, 'number': number })

class search_class:

    def __init__(self,search):
        self.search=search

    def results(self):
        criteria = []

        search = Q()
        search_dict = decode_dict(self.search)
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
                elif key  == "status":
                    value = decode_string(value)
                    criteria.append({'key': key, 'value': "is %s"%(models.status_to_string(value))})
                    search = search & Q(status=value)
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
        self.criteria = criteria
        return photo_list

    def get_breadcrumbs(self):
        breadcrumbs = self.type.get_breadcrumbs()
        breadcrumbs.append(models.breadcrumb(reverse("search_detail",kwargs={'object_id':self.search}),"results"))
        return breadcrumbs

    def get_absolute_url(self):
        return reverse("search_detail",kwargs={'object_id':self.search})

    def __unicode__(self):
        return models.search_to_string(self.search)

    class type(models.base_model.type):
        type_id = "search"
        verbose_name_plural = "search"

def search_list(request):
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
    type = search_class.type
    list = [ search_class("") ]
    list.extend( [ search_class(i[0]) for i in models.PHOTO_STATUS ] )
    return object_list(request, list, type, context=context)

def search_detail(request, object_id):
    object = search_class(object_id)
    photo_list = object.results()
    links = search_links(object_id)
    return object_photo_list(request,object,photo_list,links)

def search_photo_detail(request, object_id, number):
    object = search_class(object_id)
    photo_list = object.results()
    links = search_links(object_id)
    return object_photo_detail(request,object,number,photo_list,links)

def search_photo_edit(request, object_id, number):
    object = search_class(object_id)
    photo_list = object.results()
    links = search_links(object_id)
    return object_photo_edit(request,object,number,photo_list,links)

############
# RELATION #
############

def photo_relation_list(request):
    type = models.photo_relation.type
    list = models.photo_relation.objects.all()
    return object_list(request, list, type)

def photo_relation_create(request, object_id=None):
    type = models.photo_relation.type
    modal_form = forms.photo_relation_form

    if object_id is not None:
        photo = get_object_or_404(models.photo, pk=object_id)
    else:
        photo = None

    def get_defaults():
        instance = models.photo_relation()
        if photo is not None:
            instance.photo_1 = photo
        return instance

    return object_create(request, type, modal_form, get_defaults=get_defaults)

def photo_relation_edit(request, object_id):
    object = get_object_or_404(models.photo_relation, pk=object_id)
    return object_edit(request, object, forms.photo_relation_form)

def photo_relation_delete(request,object_id):
    object = get_object_or_404(models.photo_relation, pk=object_id)
    return object_delete(request, object)

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
        url = object.get_absolute_url()

    elif type == "album":
        object = get_object_or_404(models.album, pk=object_id)
        url = object.get_absolute_url()

    elif type == "category":
        object = get_object_or_404(models.category, pk=object_id)
        url = object.get_absolute_url()

    elif type == "person":
        object = get_object_or_404(models.person, pk=object_id)
        url = object.get_absolute_url()

    elif type == "photo":
        object = get_object_or_404(models.photo, pk=object_id)
        url = object.get_absolute_url()

    if url is None:
        raise Http404("Unknown type '%s'"%(type))

    return HttpResponseRedirect(url)

#########
# QUEER #
#########

def queer_list(request):
    type = models.queer.type
    list = models.queer.objects.all()
    return object_list(request, list, type)

def queer_detail(request, object_id):
    object = get_object_or_404(models.queer, pk=object_id)
    return object_detail(request, object)

def queer_create(request):
    type = models.queer.type
    modal_form = forms.queer_form
    return object_create(request, type, modal_form)

def queer_edit(request, object_id):
    object = get_object_or_404(models.queer, pk=object_id)
    return object_edit(request, object, forms.queer_form)

def queer_delete(request,object_id):
    object = get_object_or_404(models.queer, pk=object_id)
    return object_delete(request, object)

