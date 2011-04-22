import os
import random
import pytz

from django.core.urlresolvers import reverse
from django.db import models as m
from django.core.paginator import Paginator, InvalidPage, EmptyPage
from django.shortcuts import render_to_response, get_object_or_404
from django.template import RequestContext, loader
from django.http import HttpResponseRedirect, HttpResponseForbidden, Http404
from django.conf import settings
from django.utils.http import urlquote
from django.utils.encoding import iri_to_uri
from django.utils.translation import ugettext as _
from django.db.models import Count


from spud import models,forms

# META INFORMATION FOR MODELS

class breadcrumb(object):
    def __init__(self, url, name):
        self.url = url
        self.name = name

################
# BASE METHODS #
################
class base_web(object):
    def assert_instance_type(self, instance):
        type_name = type(instance).__name__
        expected_type = self.web_id

        if type_name != expected_type:
            raise RuntimeError("Expected type %s but got '%s'"%(expected_type,type_name))

    @property
    def verbose_name(self):
        web_id = self.web_id
        return web_id.replace("_", " ")

    @property
    def verbose_name_plural(self):
        return self.verbose_name + 's'

    @property
    def perm_id(self):
        return self.web_id

    @property
    def url_prefix(self):
        return self.web_id

    @property
    def template_prefix(self):
        return self.web_id

    def has_name_perms(self, user, name):
        if user.is_authenticated() and user.has_perm('spud.%s_%s'%(name, self.perm_id)):
            return True
        else:
            return False

    def get_breadcrumbs(self):
        breadcrumbs = []
        breadcrumbs.append(breadcrumb(reverse("root"), _("Home")))
        breadcrumbs.append(breadcrumb(reverse(self.url_prefix+"_list"), self.verbose_name_plural))
        return breadcrumbs

    def get_instance(self):
        return self.model()

    def pre_save(self, instance, form):
        self.assert_instance_type(instance)
        return True

    ###############
    # LIST ACTION #
    ###############

    def has_list_perms(self, user):
        return True

    def get_list_breadcrumbs(self):
        return self.get_breadcrumbs()

    def get_list_buttons(self, user):
        buttons = []

        if self.has_add_perms(user):
            buttons.append({
                'class': 'addlink',
                'text': 'Add %s'%(self.verbose_name),
                'url': self.get_add_url(),
            })

        return buttons

    ###############
    # VIEW ACTION #
    ###############

    def has_view_perms(self, user):
        return True

    # get the URL to display this object
    # note this may not always make sense
    @m.permalink
    def get_view_url(self, instance):
        self.assert_instance_type(instance)
        return(self.url_prefix+'_detail', [ str(instance.pk) ])

    # get the breadcrumbs to show while displaying this object
    def get_view_breadcrumbs(self, instance):
        self.assert_instance_type(instance)
        breadcrumbs = self.get_breadcrumbs()
        breadcrumbs.append(breadcrumb(self.get_view_url(instance), instance))
        return breadcrumbs

    def get_view_buttons(self, user, instance):
        self.assert_instance_type(instance)
        buttons = []

        if self.has_edit_perms(user):
            buttons.append({
                'class': 'changelink',
                'text': 'Edit',
                'url': self.get_edit_url(instance),
            })

        if self.has_delete_perms(user):
            buttons.append({
                'class': 'deletelink',
                'text': 'Delete',
                'url': self.get_delete_url(instance),
            })

        return buttons

    ##############
    # ADD ACTION #
    ##############

    def has_add_perms(self, user):
        return self.has_name_perms(user, "add")

    @m.permalink
    def get_add_url(self):
        return(self.url_prefix+"_add",)

    def get_add_breadcrumbs(self, **kwargs):
        breadcrumbs = self.get_breadcrumbs()
        breadcrumbs.append(breadcrumb(self.get_add_url(**kwargs), "add"))
        return breadcrumbs

    ###############
    # EDIT ACTION #
    ###############

    def has_edit_perms(self, user):
        return self.has_name_perms(user, "edit")

    # get the URL to edit this object
    @m.permalink
    def get_edit_url(self, instance):
        self.assert_instance_type(instance)
        return(self.url_prefix+'_edit', [ str(instance.pk) ])

    # find url we should go to after editing this object
    def get_edit_finished_url(self, instance):
        self.assert_instance_type(instance)
        return self.get_view_url(instance)

    # get breadcrumbs to show while editing this object
    def get_edit_breadcrumbs(self, instance):
        self.assert_instance_type(instance)
        breadcrumbs = self.get_view_breadcrumbs(instance)
        breadcrumbs.append(breadcrumb(self.get_edit_url(instance), "edit"))
        return breadcrumbs

    #################
    # DELETE ACTION #
    #################

    def has_delete_perms(self, user):
        return self.has_name_perms(user, "delete")

    # get the URL to delete this object
    @m.permalink
    def get_delete_url(self, instance):
        self.assert_instance_type(instance)
        return(self.url_prefix+'_delete', [ str(instance.pk) ])

    # find url we should go to after deleting object
    @m.permalink
    def get_delete_finished_url(self, instance):
        self.assert_instance_type(instance)
        return(self.url_prefix+"_list",)

    # get breadcrumbs to show while deleting this object
    def get_delete_breadcrumbs(self, instance):
        self.assert_instance_type(instance)
        breadcrumbs = self.get_view_breadcrumbs(instance)
        breadcrumbs.append(breadcrumb(self.get_delete_url(instance), "delete"))
        return breadcrumbs

    #####################
    # PERMISSION CHECKS #
    #####################

    def permission_denied_response(self, request, breadcrumbs, error_list):
        t = loader.get_template('spud/error.html')
        c = RequestContext(request, {
                'title': 'Access denied',
                'error_list': error_list,
                'breadcrumbs': breadcrumbs
        })
        return HttpResponseForbidden(t.render(c))

    def check_list_perms(self, request, breadcrumbs):
        error_list = []
        if not self.has_list_perms(request.user):
            error_list.append("You cannot list %s objects"%(selfs.verbose_name))

        if len(error_list) > 0:
            return permission_denied_response(request, breadcrumbs, error_list)
        else:
            return None

    def check_view_perms(self, request, breadcrumbs):
        error_list = []
        if not self.has_view_perms(request.user):
            error_list.append("You cannot view a %s object"%(selfs.verbose_name))

        if len(error_list) > 0:
            return permission_denied_response(request, breadcrumbs, error_list)
        else:
            return None

    def check_add_perms(self, request, breadcrumbs):
        error_list = []
        if not self.has_add_perms(request.user):
            error_list.append("You cannot add a %s object"%(selfs.verbose_name))

        if len(error_list) > 0:
            return permission_denied_response(request, breadcrumbs, error_list)
        else:
            return None

    def check_edit_perms(self, request, breadcrumbs):
        error_list = []
        if not self.has_edit_perms(request.user):
            error_list.append("You cannot edit a %s object"%(selfs.verbose_name))

        if len(error_list) > 0:
            return permission_denied_response(request, breadcrumbs, error_list)
        else:
            return None

    def check_delete_perms(self, request, breadcrumbs):
        error_list = []
        if not self.has_delete_perms(request.user):
            error_list.append("You cannot delete a %s object"%(selfs.verbose_name))

        if len(error_list) > 0:
            return permission_denied_response(request, breadcrumbs, error_list)
        else:
            return None

    #####################
    # GENERIC FUNCTIONS #
    #####################

    def object_list(self, request, form, table, template=None, kwargs={}, context={}):
        breadcrumbs = self.get_list_breadcrumbs(**kwargs)

        error = self.check_list_perms(request, breadcrumbs)
        if error is not None:
            return error

        if template is None:
            template='spud/object_list.html'

        paginator = Paginator(table.rows, 50) # Show 50 objects per page

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
                'web': self,
                'table': table,
                'page_obj': page_obj,
                'breadcrumbs': breadcrumbs,
        }

        if form is not None:
            defaults['form'] = form
            defaults['media'] = form.media

        defaults.update(context)
        return render_to_response(template, defaults,
                context_instance=RequestContext(request))

    def object_view(self, request, instance, template=None):
        self.assert_instance_type(instance)
        breadcrumbs = self.get_view_breadcrumbs(instance)

        error = self.check_view_perms(request, breadcrumbs)
        if error is not None:
            return error

        if template is None:
            template='spud/'+self.template_prefix+'_detail.html'
        return render_to_response(template, {
                'object': instance,
                'web': self,
                'breadcrumbs': breadcrumbs,
                },context_instance=RequestContext(request))

    def object_add(self, request, template=None, kwargs={}):
        breadcrumbs = self.get_add_breadcrumbs(**kwargs)

        if template is None:
            template='spud/object_edit.html'

        error = self.check_add_perms(request, breadcrumbs)
        if error is not None:
            return error

        if request.method == 'POST':
            form = self.form(request.POST, request.FILES)

            if form.is_valid():
                valid = True
                instance = form.save(commit=False)
                valid = self.pre_save(instance=instance, form=form)

                if valid:
                    instance.save()
                    url=self.get_edit_finished_url(instance)
                    return HttpResponseRedirect(url)
        else:
            instance = self.get_instance(**kwargs)
            self.assert_instance_type(instance)
            form = self.form(instance=instance)

        return render_to_response(template, {
                'object': None, 'web': self,
                'breadcrumbs': breadcrumbs,
                'form' : form,
                'media' : form.media,
                },context_instance=RequestContext(request))

    def object_edit(self, request, instance, template=None):
        self.assert_instance_type(instance)
        breadcrumbs = self.get_edit_breadcrumbs(instance)

        if template is None:
            template='spud/object_edit.html'

        error = self.check_edit_perms(request, breadcrumbs)
        if error is not None:
            return error

        if request.method == 'POST':
            form = self.form(request.POST, request.FILES, instance=instance)
            if form.is_valid():
                valid = True
                instance = form.save(commit=False)
                valid = self.pre_save(instance=instance, form=form)

                if valid:
                    instance.save()
                    url = self.get_edit_finished_url(instance)
                    return HttpResponseRedirect(url)
        else:
            form = self.form(instance=instance)

        return render_to_response(template, {
                'object': instance,
                'web': self,
                'breadcrumbs': breadcrumbs,
                'form' : form,
                'media' : form.media,
                },context_instance=RequestContext(request))

    def object_delete(self, request, instance, template=None):
        self.assert_instance_type(instance)
        breadcrumbs = self.get_delete_breadcrumbs(instance)

        if template is None:
            template='spud/object_confirm_delete.html'

        error = self.check_delete_perms(request, breadcrumbs)
        if error is not None:
            return error

        errorlist = []
        if request.method == 'POST':
            errorlist = instance.check_delete()
            if len(errorlist) == 0:
                url = self.get_delete_finished_url(instance)
                instance.delete()
                return HttpResponseRedirect(url)

        return render_to_response(template, {
                'object': instance,
                'breadcrumbs': breadcrumbs,
                'errorlist': errorlist,
                },context_instance=RequestContext(request))

#################
# PHOTO METHODS #
#################

class photo_base_web(base_web):

    def object_photo_list(self, request, instance, photo_list, template=None, context={}):
        self.assert_instance_type(instance)
        breadcrumbs = self.get_view_breadcrumbs(instance)
        paginator = Paginator(photo_list, 25) # Show 25 photos per page

        if template is None:
            template='spud/'+self.template_prefix+'_detail.html'

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
                'object': instance,
                'web': self,
                'page_obj': page_obj,
                'breadcrumbs': breadcrumbs,
        }
        defaults.update(context)
        return render_to_response(template, defaults,
                                  context_instance=RequestContext(request))


    def object_photo_detail(self, request, instance, number, photo_list, size):
        self.assert_instance_type(instance)
        breadcrumbs = self.get_view_breadcrumbs(instance)
        paginator = Paginator(photo_list, 1)

        template='spud/photo_detail.html'

        if number == "random":
            number = random.randint(1,paginator.num_pages)
            url = self.photo_detail_url(instance, number, size)
            return HttpResponseRedirect(url)

        # If page request (9999) is out of range, deliver last page of results.
        try:
            page_obj = paginator.page(number)
        except (EmptyPage, InvalidPage):
            page_obj = paginator.page(paginator.num_pages)

        if page_obj.object_list.count() <= 0:
            raise Http404("No photos were found")

        photo_object = page_obj.object_list[0]

        detail_url = self.photo_detail_url(instance, page_obj.number, size)
        breadcrumbs.append(breadcrumb(detail_url,photo_object))

        return render_to_response(template, {
                                    'parent': instance,
                                    'object': photo_object,
                                    'size': size,
                                    'web': self,
                                    'page_obj': page_obj,
                                    'breadcrumbs': breadcrumbs,
                                    },
                                    context_instance=RequestContext(request))

    def object_photo_edit(self, request, instance, number, photo_list, size):
        self.assert_instance_type(instance)
        breadcrumbs = self.get_view_breadcrumbs(instance)
        paginator = Paginator(photo_list, 1)

        template='spud/photo_edit.html'

        if number == "random":
            number = random.randint(1,paginator.num_pages)
            url = self.photo_edit_url(instance, number, size)
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

                            pp,c = models.photo_person.objects.get_or_create(photo=photo_object,person=o.person)
                            pp.position = position
                            pp.save()
                    elif update.verb == "delete" and update.noun == "person":
                        for o in update.objects:
                            if o.position == "":
                                models.photo_person.objects.filter(photo=photo_object,person=o.person).delete()
                            else:
                                models.photo_person.objects.filter(photo=photo_object,person=o.person,position=o.position).delete()
                    elif update.verb == "set" and update.noun == "person":
                        for o in update.objects:
                            pp = models.photo_person.objects.filter(photo=photo_object,person=o.person).update(position=o.position)
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
                    elif update.verb == "set" and update.noun == "timezone":
                        if photo_object.timezone != update.timezone:
                            photo_object.timezone = update.timezone
                            if photo_object.action is None:
                                photo_object.action = "M"
                    elif update.verb == "set" and update.noun == "datetime":
                        src_timezone = pytz.timezone(photo_object.timezone)
                        value = src_timezone.localize(update.datetime)
                        photo_object.datetime = value.astimezone(pytz.utc).replace(tzinfo=None)
                        if photo_object.action is None:
                            photo_object.action = "M"

                    else:
                        raise Http404("operation '%s' '%s' not implemented"%(update.verb, update.noun))

                if 'action' in request.POST:
                    action = request.POST['action']
                    if action == "nop":
                        photo_object.action = None
                    elif action == "delete":
                        photo_object.action = "D"
                    elif action == "regenerate":
                        photo_object.action = "R"
                    elif action == "move":
                        photo_object.action = "M"
                    elif action == "rotate 90":
                        photo_object.action = "90"
                    elif action == "rotate 180":
                        photo_object.action = "180"
                    elif action == "rotate 270":
                        photo_object.action = "270"
                    elif action == "rotate auto":
                        photo_object.action = "auto"
                    else:
                        raise Http404("Action '%s' not implemented"%(action))

                photo_object.save()


                if "goto" not in request.POST:
                    goto = 'save'
                else:
                    goto = request.POST['goto']

                if goto == "prev":
                    number = page_obj.number - 1
                    if number < 1:
                        number = 1
                    url = self.photo_edit_url(instance, number, size)
                elif goto == "next":
                    number = page_obj.number + 1
                    if number > page_obj.paginator.num_pages:
                        number = page_obj.paginator.num_pages
                    url = self.photo_edit_url(instance, number, size)
                elif goto == "save":
                    url = self.photo_edit_url(instance, page_obj.number, size)
                else:
                    url = self.photo_detail_url(instance, page_obj.number, size)

                return HttpResponseRedirect(url)

        else:
            form = forms.photo_extra_form({
                                    'photo_id': photo_object.pk,
                                    'updates': '',
                                    })

        # can't do this until after we confirm the object
        detail_url = self.photo_detail_url(instance, page_obj.number, size)
        edit_url = self.photo_edit_url(instance, page_obj.number, size)

        breadcrumbs.append(breadcrumb(detail_url,photo_object))
        breadcrumbs.append(breadcrumb(edit_url,"edit"))

        persons = models.person.objects.filter(photos__in=photo_list).annotate(Count('photos')).order_by("-photos__count")
        albums = models.album.objects.filter(photos__in=photo_list).annotate(Count('photos')).order_by("-photos__count")
        categories = models.category.objects.filter(photos__in=photo_list).annotate(Count('photos')).order_by("-photos__count")
        places = models.place.objects.filter(photos__in=photo_list).annotate(Count('photos')).order_by("-photos__count")

        return render_to_response(template, {
                'parent': instance,
                'object': photo_object,
                'size': size,
                'web': self,
                'page_obj': page_obj,
                'form' : form, 'breadcrumbs': breadcrumbs,
                'media' : form.media,
                'persons': persons,
                'albums': albums,
                'categorys': categories,
                'places': places,
                },context_instance=RequestContext(request))

    def photo_detail_url(self, instance, number, size):
        self.assert_instance_type(instance)
        return reverse("%s_photo_detail"%(self.url_prefix), kwargs={ 'object_id': instance.pk, 'number': number, 'size': size })

    def photo_edit_url(self, instance, number, size):
        self.assert_instance_type(instance)
        return reverse("%s_photo_edit"%(self.url_prefix), kwargs={ 'object_id': instance.pk, 'number': number, 'size': size })

    def get_photo_buttons(self, user, instance, number, photo, size):
        self.assert_instance_type(instance)
        buttons = []

        p_web = photo_web()
        if self.has_edit_perms(user):
            buttons.append({
                'class': 'viewlink',
                'text': 'Orig',
                'url': p_web.get_orig_url(photo),
            })

        for the_size in settings.IMAGE_SIZES:
            if size != the_size:
                buttons.append({
                    'class': 'viewlink',
                    'text': the_size.capitalize(),
                    'url': self.photo_detail_url(instance, number, the_size)
                })

        if True:
            buttons.append({
                'class': 'viewlink',
                'text': 'Link',
                'url': p_web.get_view_url(photo, size),
            })

        if self.has_edit_perms(user):
            buttons.append({
                'class': 'changelink',
                'text': 'Edit',
                'url': self.photo_edit_url(instance, number, size),
            })

        return buttons



# ---------------------------------------------------------------------------

class place_web(photo_base_web):
    web_id = "place"
    model = models.place
    form = forms.place_form

    def get_instance(self, parent):
        instance = models.place()
        instance.parent_place = parent
        return instance

    def get_breadcrumbs(self):
        breadcrumbs = []
        breadcrumbs.append(breadcrumb(reverse("root"), _("Home")))
        return breadcrumbs

    ###############
    # LIST ACTION #
    ###############

    ###############
    # VIEW ACTION #
    ###############

    def get_view_breadcrumbs(self, instance):
        self.assert_instance_type(instance)
        breadcrumbs = self.get_breadcrumbs()

        seen = {}
        while instance is not None and instance.pk not in seen:
            breadcrumbs.insert(1,breadcrumb(self.get_view_url(instance),instance))
            seen[instance.pk] = True
            instance = instance.parent_place

        if instance is not None:
            breadcrumbs.insert(1,breadcrumb(self.get_view_url(instance),"ERROR"))

        return breadcrumbs

    def get_view_buttons(self, user, instance):
        self.assert_instance_type(instance)
        buttons = super(place_web, self).get_view_buttons(user, instance)

        if self.has_add_perms(user):
            buttons.insert(0,{
                'class': 'addlink',
                'text': 'Add place',
                'url': self.get_add_url(instance),
            })

        return buttons

    ##############
    # ADD ACTION #
    ##############

    @m.permalink
    def get_add_url(self, parent):
        return(self.web_id+"_add", [ parent.pk ] )

    def get_add_breadcrumbs(self, parent):
        breadcrumbs = self.get_view_breadcrumbs(parent)
        breadcrumbs.append(breadcrumb(self.get_add_url(parent), "add"))
        return breadcrumbs

    ###############
    # EDIT ACTION #
    ###############

    #################
    # DELETE ACTION #
    #################

    # find url we should go to after deleting object
    @m.permalink
    def get_delete_finished_url(self, instance):
        if instance.parent_place is None:
            return('place_detail', [ str(1)])
        else:
            return('place_detail', [ str(instance.parent_place.pk) ])


class album_web(photo_base_web):
    web_id = "album"
    model = models.album
    form = forms.album_form

    def get_instance(self, parent):
        instance = models.album()
        instance.parent_album = parent
        return instance

    def get_breadcrumbs(self):
        breadcrumbs = []
        breadcrumbs.append(breadcrumb(reverse("root"), _("Home")))
        return breadcrumbs

    ###############
    # LIST ACTION #
    ###############

    def get_list_breadcrumbs(self):
        breadcrumbs = self.get_breadcrumbs()
        breadcrumbs.append(breadcrumb(reverse("album_todo"), "todo"))
        return breadcrumbs

    def get_list_buttons(self, user):
        buttons = []
        return buttons

    ###############
    # VIEW ACTION #
    ###############

    def get_view_breadcrumbs(self, instance):
        self.assert_instance_type(instance)
        breadcrumbs = self.get_breadcrumbs()

        seen = {}
        while instance is not None and instance.pk not in seen:
            breadcrumbs.insert(1,breadcrumb(self.get_view_url(instance),instance))
            seen[instance.pk] = True
            instance = instance.parent_album

        if instance is not None:
            breadcrumbs.insert(1,breadcrumb(self.get_view_url(instance),"ERROR"))

        return breadcrumbs

    def get_view_buttons(self, user, instance):
        self.assert_instance_type(instance)
        buttons = super(album_web, self).get_view_buttons(user, instance)

        if self.has_add_perms(user):
            buttons.insert(0,{
                'class': 'addlink',
                'text': 'Add album',
                'url': self.get_add_url(instance),
            })

        return buttons

    ##############
    # ADD ACTION #
    ##############

    @m.permalink
    def get_add_url(self, parent):
        return(self.web_id+"_add", [ parent.pk ] )

    def get_add_breadcrumbs(self, parent):
        breadcrumbs = self.get_view_breadcrumbs(parent)
        breadcrumbs.append(breadcrumb(self.get_add_url(parent), "add"))
        return breadcrumbs

    ###############
    # EDIT ACTION #
    ###############

    #################
    # DELETE ACTION #
    #################

    # find url we should go to after deleting object
    @m.permalink
    def get_delete_finished_url(self, instance):
        if instance.parent_album is None:
            return('album_detail', [ str(1)])
        else:
            return('album_detail', [ str(instance.parent_album.pk) ])

class category_web(photo_base_web):
    web_id = "category"
    model = models.category
    form = forms.category_form

    def get_instance(self, parent):
        instance = models.category()
        instance.parent_category = parent
        return instance

    def get_breadcrumbs(self):
        breadcrumbs = []
        breadcrumbs.append(breadcrumb(reverse("root"), _("Home")))
        return breadcrumbs

    ###############
    # LIST ACTION #
    ###############

    ###############
    # VIEW ACTION #
    ###############

    def get_view_breadcrumbs(self, instance):
        self.assert_instance_type(instance)
        breadcrumbs = self.get_breadcrumbs()

        seen = {}
        while instance is not None and instance.pk not in seen:
            breadcrumbs.insert(1,breadcrumb(self.get_view_url(instance),instance))
            seen[instance.pk] = True
            instance = instance.parent_category

        if instance is not None:
            breadcrumbs.insert(1,breadcrumb(self.get_view_url(instance),"ERROR"))

        return breadcrumbs

    def get_view_buttons(self, user, instance):
        buttons = super(category_web, self).get_view_buttons(user, instance)

        if self.has_add_perms(user):
            buttons.insert(0,{
                'class': 'addlink',
                'text': 'Add category',
                'url': self.get_add_url(instance),
            })

        return buttons

    ##############
    # ADD ACTION #
    ##############

    @m.permalink
    def get_add_url(self, parent):
        return(self.web_id+"_add", [ parent.pk ] )

    def get_add_breadcrumbs(self, parent):
        breadcrumbs = self.get_view_breadcrumbs(parent)
        breadcrumbs.append(breadcrumb(self.get_add_url(parent), "add"))
        return breadcrumbs

    ###############
    # EDIT ACTION #
    ###############

    #################
    # DELETE ACTION #
    #################

    # find url we should go to after deleting object
    @m.permalink
    def get_delete_finished_url(self, instance):
        if instance.parent_category is None:
            return('category_detail', [ str(1)])
        else:
            return('category_detail', [ str(instance.parent_category.pk) ])

class person_web(photo_base_web):
    web_id = "person"
    model = models.person
    form = forms.person_form

    ###############
    # LIST ACTION #
    ###############

    ###############
    # VIEW ACTION #
    ###############

    ##############
    # ADD ACTION #
    ##############

    ###############
    # EDIT ACTION #
    ###############

    #################
    # DELETE ACTION #
    #################

class photo_relation_web(base_web):
    web_id = "photo_relation"
    model = models.photo_relation
    form = forms.photo_relation_form

    def get_instance(self):
        instance = models.photo_relation()
        if self.initial_photo is not None:
            instance.photo_1 = self.initial_photo
        return instance

    # get breadcrumbs to show while editing this object
    def get_edit_breadcrumbs(self, instance):
        self.assert_instance_type(instance)
        breadcrumbs = self.get_list_breadcrumbs()
        breadcrumbs.append(breadcrumb(self.get_edit_url(instance), "edit"))
        return breadcrumbs

    # get breadcrumbs to show while deleting this object
    def get_delete_breadcrumbs(self, instance):
        self.assert_instance_type(instance)
        breadcrumbs = self.get_list_breadcrumbs()
        breadcrumbs.append(breadcrumb(self.get_delete_url(instance), "delete"))
        return breadcrumbs

class photo_web(photo_base_web):
    web_id = "photo"
    model = models.photo
    form = forms.photo_form

    def photo_detail_url(self, instance, number, size):
        self.assert_instance_type(instance)
        return reverse("%s_detail"%(self.url_prefix), kwargs={ 'object_id': instance.pk, 'size': size })

    def photo_edit_url(self, instance, number, size):
        self.assert_instance_type(instance)
        return reverse("%s_edit"%(self.url_prefix), kwargs={ 'object_id': instance.pk, 'size': size })

    def get_breadcrumbs(self):
        breadcrumbs = []
        breadcrumbs.append(breadcrumb(reverse("root"), _("Home")))
        return breadcrumbs

    ###############
    # LIST ACTION #
    ###############

    ###############
    # VIEW ACTION #
    ###############

    def get_thumb_url(self, instance, size):
        self.assert_instance_type(instance)
        if size in settings.IMAGE_SIZES:
            (shortname, extension) = os.path.splitext(instance.name)
            return iri_to_uri(u"%sthumb/%s/%s/%s.jpg"%(settings.IMAGE_URL,urlquote(size),urlquote(instance.path),urlquote(shortname)))
        else:
            raise RuntimeError("unknown image size %s"%(size))

    def get_orig_url(self, instance):
        self.assert_instance_type(instance)
        return iri_to_uri(u"%sorig/%s/%s"%(settings.IMAGE_URL,urlquote(instance.path),urlquote(instance.name)))

    @m.permalink
    def get_view_url(self, instance, size):
        self.assert_instance_type(instance)
        return(self.url_prefix+'_detail', [ str(instance.pk), size ])

    # get the breadcrumbs to show while displaying this object
    def get_view_breadcrumbs(self, instance):
        self.assert_instance_type(instance)
        breadcrumbs = self.get_breadcrumbs()
        return breadcrumbs

    ##############
    # ADD ACTION #
    ##############
    def get_add_photo_relation_url(self, instance):
        self.assert_instance_type(instance)
        return('photo_relation_add', [ str(self.instance_id)])

    ###############
    # EDIT ACTION #
    ###############

    #################
    # DELETE ACTION #
    #################

##########
# SEARCH #
##########

class search_base_web(photo_base_web):
    model = None
    form = None

    def get_list_buttons(self, user):
        buttons = []
        return buttons

    def get_view_buttons(self, user, instance):
        self.assert_instance_type(instance)
        buttons = []
        return buttons


class date_web(search_base_web):
    web_id = "date_class"
    perm_id = "photo"
    url_prefix = "date"
    template_prefix = "date"
    verbose_name = "date"

class action_web(search_base_web):
    web_id = "action_class"
    perm_id = "photo"
    url_prefix = "action"
    template_prefix = "action"
    verbose_name = "action"

class search_web(search_base_web):
    web_id = "search_class"
    perm_id = "photo"
    url_prefix = "search"
    template_prefix = "search"
    verbose_name = "search"
    verbose_name_plural = "search"

###############
# OTHER STUFF #
###############
types = {
    'place': place_web,
    'album': album_web,
    'category': category_web,
    'person': person_web,
    'photo': photo_web,
    'photo_relation': photo_relation_web,
}

def get_web_from_object(self):
    type_name = type(self).__name__
    return types[type_name]()

