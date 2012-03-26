import os
import random
import pytz
import re

from django.core.urlresolvers import reverse
from django.db import models as m
from django.core.paginator import Paginator, InvalidPage, EmptyPage
from django.shortcuts import render_to_response, get_object_or_404
from django.template import RequestContext
from django.http import HttpResponseRedirect, Http404
from django.conf import settings
from django.utils.http import urlquote
from django.utils.encoding import iri_to_uri
from django.utils.translation import ugettext as _
from django.db.models import Count, Q
from django.utils.html import conditional_escape
from django.utils.safestring import mark_safe

import django_webs

from spud import models,forms

################
# BASE METHODS #
################
class base_web(django_webs.web):
    app_label = "spud"

    def get_description(self, instance):
        result = "%s <a href='%s'>%s</a>"%(
            conditional_escape(self.verbose_name), self.get_view_url(instance),
            conditional_escape(instance))
        return mark_safe(result)

get_web_from_object = django_webs.get_web_from_object
breadcrumb = django_webs.breadcrumb

#################
# PHOTO METHODS #
#################

class photo_base_web(base_web):
    @m.permalink
    def get_photo_update_url(self, instance):
        self.assert_instance_type(instance)
        return(self.url_prefix+'_photo_update', [ str(instance.pk) ])

    def process_updates(self, photo_object, updates):
        for update in updates:
            if update.verb == "add" and update.noun == "person":
                for o in update.objects:
                    # try to guess the position we should assign for new pp objects
                    pp_list = models.photo_person.objects.filter(photo=photo_object).order_by("-position")
                    try:
                        if pp_list[0].position is not None:
                            position = pp_list[0].position + 1
                        else:
                            position = None
                    except IndexError:
                        position = 1

                    pp,c = models.photo_person.objects.get_or_create(photo=photo_object,person=o.person)
                    if o.position != "":
                        # position was provided, use it
                        pp.position = o.position
                        pp.save()
                    elif c:
                        # if object was created, use the position we calculated
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
            elif update.verb == "set" and update.noun == "action":
                action = update.action[0]
                if action == "nop":
                    photo_object.action = None
                elif action == "delete":
                    photo_object.action = "D"
                elif action == "regenerate":
                    photo_object.action = "R"
                elif action == "move":
                    photo_object.action = "M"
                elif action == "auto":
                    photo_object.action = "auto"
                elif action == "90":
                    photo_object.action = "90"
                elif action == "180":
                    photo_object.action = "180"
                elif action == "270":
                    photo_object.action = "270"
                else:
                    raise Http404("action '%s' not implemented"%(action))
            elif update.verb == "set" and update.noun == "description":
                if update.object == "None":
                    photo_object.description = ""
                else:
                    photo_object.description = update.object
            elif update.verb == "set" and update.noun == "timezone":
                from_tz = pytz.utc
                to_tz = update.timezone

                local = from_tz.localize(photo_object.datetime)
                local = local.astimezone(to_tz)

                utc_offset = local.utcoffset().total_seconds() / 60

                if photo_object.utc_offset != utc_offset:
                    photo_object.utc_offset = utc_offset
                    if photo_object.action is None:
                        photo_object.action = "M"
            elif update.verb == "set" and update.noun == "datetime":
                src_timezone = pytz.FixedOffset(photo_object.utc_offset)
                value = src_timezone.localize(update.datetime)
                photo_object.datetime = value.astimezone(pytz.utc).replace(tzinfo=None)
                if photo_object.action is None:
                    photo_object.action = "M"

            else:
                raise Http404("operation '%s' '%s' not implemented"%(update.verb, update.noun))

    def object_photo_list(self, request, instance, template=None, context={}):
        self.assert_instance_type(instance)
        breadcrumbs = self.get_view_breadcrumbs(instance)

        photo_list = self.get_photo_list(instance)

        # photos per page
        try:
            number = int(request.session.get('photos_per_page',25))
        except ValueError:
            number = 25

        # construct paginator for paginating
        paginator = Paginator(photo_list, number)

        # what template should we use?
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
                'default_list_size': request.session.get('default_list_size',settings.DEFAULT_LIST_SIZE),
                'default_view_size': request.session.get('default_view_size',settings.DEFAULT_VIEW_SIZE),
        }
        defaults.update(context)
        return render_to_response(template, defaults,
                                  context_instance=RequestContext(request))


    def object_photo_detail(self, request, instance, number, size):
        self.assert_instance_type(instance)
        breadcrumbs = self.get_view_breadcrumbs(instance)
        photo_list = self.get_photo_list(instance)
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

        thumb = photo_object.get_thumb(size)
        if thumb is None:
            raise Http404("Thumb of size '%s' for photo was not found"%size)

        detail_url = self.photo_detail_url(instance, page_obj.number, size)
        breadcrumbs.append(breadcrumb(detail_url,photo_object))

        return render_to_response(template, {
                                    'parent': instance,
                                    'object': thumb,
                                    'click_size': request.session.get('default_click_size',settings.DEFAULT_CLICK_SIZE),
                                    'web': self,
                                    'page_obj': page_obj,
                                    'breadcrumbs': breadcrumbs,
                                    },
                                    context_instance=RequestContext(request))

    def object_photo_edit(self, request, instance, number, size):
        self.assert_instance_type(instance)
        breadcrumbs = self.get_view_breadcrumbs(instance)

        photo_list = self.get_photo_list(instance)

        p_web = photo_web()
        error = p_web.check_edit_perms(request, breadcrumbs)
        if error is not None:
            return error

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

        if request.method == 'POST':
            try:
                photo_id = int(request.POST.get('photo_id'))
            except (TypeError, ValueError):
                raise Http404("photo_id not supplied or not valid")
            photo_object = get_object_or_404(models.photo, pk=photo_id)

            form = forms.photo_form(request.POST, instance=photo_object)
            update_form = forms.photo_update_form(request.POST)

            # search result may have changed, value in form is
            # authoritive
            if form.is_valid() and update_form.is_valid():
                form.save()

                updates = update_form.cleaned_data['updates']
                self.process_updates(photo_object, updates)

                if 'update_action' in request.POST:
                    update_action = request.POST['update_action']
                    if update_action == "nop":
                        photo_object.action = None
                    elif update_action == "delete":
                        photo_object.action = "D"
                    elif update_action == "regenerate":
                        photo_object.action = "R"
                    elif update_action == "move":
                        photo_object.action = "M"
                    elif update_action == "rotate 90":
                        photo_object.action = "90"
                    elif update_action == "rotate 180":
                        photo_object.action = "180"
                    elif update_action == "rotate 270":
                        photo_object.action = "270"
                    elif update_action == "rotate auto":
                        photo_object.action = "auto"
                    else:
                        raise Http404("Action '%s' not implemented"%(photo_object.action))

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
            photo_object = page_obj.object_list[0]
            form = forms.photo_form(instance=photo_object)
            update_form = forms.photo_update_form({
                                    'updates': '',
                                    })

        thumb = photo_object.get_thumb(size)
        if thumb is None:
            raise Http404("Thumb of size '%s' for photo was not found"%size)

        # can't do this until after we confirm the object
        detail_url = self.photo_detail_url(instance, page_obj.number, size)
        edit_url = self.photo_edit_url(instance, page_obj.number, size)

        breadcrumbs.append(breadcrumb(detail_url,photo_object))
        breadcrumbs.append(breadcrumb(edit_url,"edit"))

        persons = models.person.objects.filter(photos__in=photo_list).annotate(Count('photos')).order_by("-photos__count")[:10]
        albums = models.album.objects.filter(photos__in=photo_list).annotate(Count('photos')).order_by("-photos__count")[:10]
        categories = models.category.objects.filter(photos__in=photo_list).annotate(Count('photos')).order_by("-photos__count")[:10]
        places = models.place.objects.filter(photos__in=photo_list).annotate(Count('photos')).order_by("-photos__count")[:10]

        return render_to_response(template, {
                'parent': instance,
                'object': thumb,
                'click_size': request.session.get('default_click_size',settings.DEFAULT_CLICK_SIZE),
                'web': self,
                'page_obj': page_obj,
                'form': form,
                'update_form' : update_form,
                'media' : form.media + update_form.media,
                'breadcrumbs': breadcrumbs,
                'persons': persons,
                'albums': albums,
                'categorys': categories,
                'places': places,
                },context_instance=RequestContext(request))

    def object_photo_update(self, request, instance):
        self.assert_instance_type(instance)
        update_url = self.get_photo_update_url(instance)
        breadcrumbs = self.get_view_breadcrumbs(instance)
        breadcrumbs.append(breadcrumb(update_url,"bulk update"))

        photo_list = self.get_photo_list(instance)

        p_web = photo_web()
        error = p_web.check_edit_perms(request, breadcrumbs)
        if error is not None:
            return error

        template='spud/photo_update.html'

        if request.method == 'POST':
            update_form = forms.photo_update_form(request.POST)

            # search result may have changed, value in form is
            # authoritive
            if update_form.is_valid():
                updates = update_form.cleaned_data['updates']
                for photo_object in photo_list:
                    self.process_updates(photo_object, updates)
                    photo_object.save()

                url = self.get_view_url(instance)
                return HttpResponseRedirect(url)

        else:
            update_form = forms.photo_update_form({
                                    'updates': '',
                                    })

        persons = models.person.objects.filter(photos__in=photo_list).annotate(Count('photos')).order_by("-photos__count")[:10]
        albums = models.album.objects.filter(photos__in=photo_list).annotate(Count('photos')).order_by("-photos__count")[:10]
        categories = models.category.objects.filter(photos__in=photo_list).annotate(Count('photos')).order_by("-photos__count")[:10]
        places = models.place.objects.filter(photos__in=photo_list).annotate(Count('photos')).order_by("-photos__count")[:10]

        defaults = {
                'object': instance,
                'web': self,
                'breadcrumbs': breadcrumbs,
                'update_form': update_form,
                'media': update_form.media,
                'persons': persons,
                'albums': albums,
                'categorys': categories,
                'places': places,
        }

        return render_to_response(template, defaults,
                                  context_instance=RequestContext(request))


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
        if p_web.has_edit_perms(user):
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

        if p_web.has_edit_perms(user):
            buttons.append({
                'class': 'changelink',
                'text': 'Edit',
                'url': self.photo_edit_url(instance, number, size),
            })

        return buttons

    def get_view_buttons(self, user, instance):
        self.assert_instance_type(instance)
        buttons = super(photo_base_web, self).get_view_buttons(user, instance)

        p_web = photo_web()
        if p_web.has_edit_perms(user):
            buttons.insert(0,{
                'class': 'changelink',
                'text': 'Bulk update',
                'url': self.get_photo_update_url(instance),
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

    def get_photo_list(self, instance):
        return models.photo.objects.filter(location=instance)

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

    def get_photo_list(self, instance):
        return models.photo.objects.filter(albums=instance)

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

    def get_photo_list(self, instance):
        return models.photo.objects.filter(categorys=instance)

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

    def get_photo_list(self, instance):
        return models.photo.objects.filter(persons=instance)

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

    # find url we should go to after editing this object
    def get_edit_finished_url(self, instance):
        self.assert_instance_type(instance)
        return self.get_list_url()

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

    def photo_relation_add_url(self, instance):
        self.assert_instance_type(instance)
        return reverse("photo_relation_add", kwargs={ 'object_id': instance.pk })

    def get_breadcrumbs(self):
        breadcrumbs = []
        breadcrumbs.append(breadcrumb(reverse("root"), _("Home")))
        return breadcrumbs

    def get_description(self, instance):
        result = "%s %s"%(
            conditional_escape(self.verbose_name), conditional_escape(instance))
        return mark_safe(result)

    ###############
    # LIST ACTION #
    ###############

    def get_photo_list(self, instance):
        return models.photo.objects.filter(pk=instance.pk)

    ###############
    # VIEW ACTION #
    ###############

    def get_thumb_url(self, instance, size):
        self.assert_instance_type(instance)
        if size in settings.IMAGE_SIZES:
            (shortname, _) = os.path.splitext(instance.name)
            return iri_to_uri(u"%sthumb/%s/%s/%s.jpg"%(settings.IMAGE_URL,urlquote(size),urlquote(instance.path),urlquote(shortname)))
        else:
            return None

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

    # edit operation makes no sense
    def has_add_perms(self, user):
        return False

    # edit operation makes no sense
    def has_edit_perms(self, user):
        return False

    # delete operation makes no sense
    def has_delete_perms(self, user):
        return False


class date_web(search_base_web):
    web_id = "date_class"
    perm_id = "photo"
    url_prefix = "date"
    template_prefix = "date"
    verbose_name = "date"

    def get_photo_list(self, instance):
        m = re.match("^(\d\d\d\d)-(\d\d)-(\d\d)$",instance.pk)
        if m is not None:
            (year,month,day)=(int(m.group(1)),int(m.group(2)),int(m.group(3)))
            return models.photo.objects.filter(datetime__year=year,datetime__month=month,datetime__day=day)
        else:
            return models.photo.objects.all()

class action_web(search_base_web):
    web_id = "action_class"
    perm_id = "photo"
    url_prefix = "action"
    template_prefix = "action"
    verbose_name = "action"

    def get_photo_list(self, instance):
        if instance.pk != "none":
            return models.photo.objects.filter(action=instance.pk)
        else:
            return models.photo.objects.filter(action__isnull=True)

class search_web(search_base_web):
    web_id = "search_class"
    perm_id = "photo"
    url_prefix = "search"
    template_prefix = "search"
    verbose_name = "search"
    verbose_name_plural = "search"

    def decode_dict(self, value):
        dict = {}
        if value == "":
            return dict

        list = value.split(";")
        for item in list:
            (key,_,value) = item.partition('=')
            value = value.replace("!","/")
            dict[key] = value

        return dict

    def decode_string(self, value):
        return value

    def decode_boolean(self, value):
        value = value.lower()
        if value=="t" or value=="true":
            return True
        else:
            return False

    def decode_array(self, value):
        return value.split(",")

    def _get_photo_list(self, instance):
        criteria = []

        search = Q()
        search_dict = self.decode_dict(instance.pk)
        photo_list = models.photo.objects.all()

        if "location_descendants" in search_dict:
            ld = self.decode_boolean(search_dict["location_descendants"])
        else:
            ld = False

        if "album_descendants" in search_dict:
            ad = self.decode_boolean(search_dict["album_descendants"])
        else:
            ad = False

        if "category_descendants" in search_dict:
            cd = self.decode_boolean(search_dict["category_descendants"])
        else:
            cd = False

        def criteria_string(key, pretext, posttext=""):
            if posttext!="": posttext=" "+posttext
            evalue = conditional_escape(value)
            result = mark_safe("%s %s %s%s"%(key, pretext, evalue, posttext))
            criteria.append({'key': key, 'value': result})

        def criteria_none(key, pretext, posttext=""):
            if posttext!="": posttext=" "+posttext
            result = mark_safe("%s %s %s%s"%(key, pretext, "none", posttext))
            criteria.append({'key': key, 'value': result})

        def criteria_object(key, pretext, posttext=""):
            if posttext!="": posttext=" "+posttext
            web = get_web_from_object(object)
            result = "%s %s <a href='%s'>%s</a>%s"%(key, pretext,
                web.get_view_url(object), conditional_escape(object), posttext)
            result = mark_safe(result)
            criteria.append({'key': key, 'value': result})

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
                    value = self.decode_string(value)
                    criteria_string('date', 'on or later then')
                    search = search & Q(datetime__gte=value)
                elif key == "last_date":
                    value = self.decode_string(value)
                    criteria_string('date', 'earlier then')
                    search = search & Q(datetime__lt=value)
                elif key == "lower_rating":
                    value = self.decode_string(value)
                    criteria_string('rating', 'higher then')
                    search = search & Q(rating__gte=value)
                elif key == "upper_rating":
                    value = self.decode_string(value)
                    criteria_string('rating', 'less then')
                    search = search & Q(rating__lte=value)
                elif key == "title":
                    value = self.decode_string(value)
                    criteria_string(key, 'contains')
                    search = search & Q(title__icontains=value)
                elif key == "camera_make":
                    value = self.decode_string(value)
                    criteria_string(key, 'contains')
                    search = search & Q(camera_make__icontains=value)
                elif key == "camera_model":
                    value = self.decode_string(value)
                    criteria_string(key, 'contains')
                    search = search & Q(camera_model__icontains=value)
                elif key  == "photographer":
                    value = self.decode_string(value)
                    object = get_object_or_404(models.person, pk=value)
                    criteria_object(key, 'is')
                    search = search & Q(photographer=object)
                elif key  == "location":
                    value = self.decode_string(value)
                    object = get_object_or_404(models.place, pk=value)
                    if ld:
                        criteria_object(key, 'is', '(or descendants)')
                        descendants = object.get_descendants()
                        search = search & Q(location__in=descendants)
                    else:
                        criteria_object(key, 'is')
                        search = search & Q(location=object)
                elif key  == "person":
                    values = self.decode_array(value)
                    for value in values:
                        object = get_object_or_404(models.person, pk=value)
                        criteria_object(key, 'is')
                        photo_list=photo_list.filter(persons=object)
                elif key  == "album":
                    values = self.decode_array(value)
                    for value in values:
                        object = get_object_or_404(models.album, pk=value)
                        if ad:
                            criteria_object(key, 'is', '(or descendants)')
                            descendants = object.get_descendants()
                            photo_list=photo_list.filter(albums__in=descendants)
                        else:
                            criteria_object(key, 'is')
                            photo_list=photo_list.filter(albums=object)
                elif key  == "category":
                    values = self.decode_array(value)
                    for value in values:
                        object = get_object_or_404(models.category, pk=value)
                        if cd:
                            criteria_object(key, 'is', '(or descendants)')
                            descendants = object.get_descendants()
                            photo_list=photo_list.filter(categorys__in=descendants)
                        else:
                            criteria_object(key, 'is')
                            photo_list=photo_list.filter(categorys=object)
                elif key  == "location_none":
                    value = self.decode_boolean(value)
                    if value:
                        criteria_none("location", 'is')
                        search = search & Q(location=None)
                elif key  == "person_none":
                    value = self.decode_boolean(value)
                    if value:
                        criteria_none("person", 'is')
                        search = search & Q(persons=None)
                elif key  == "album_none":
                    value = self.decode_boolean(value)
                    if value:
                        criteria_none("album", 'is')
                        search = search & Q(albums=None)
                elif key  == "category_none":
                    value = self.decode_boolean(value)
                    if value:
                        criteria_none("category", 'is')
                        search = search & Q(categorys=None)
                elif key  == "action":
                    value = self.decode_string(value)
                    if value == "none":
                        search = search & Q(action__isnull=True)
                    else:
                        search = search & Q(action=value)
                    value = models.action_to_string(value)
                    criteria_string(key, 'is')
                elif key  == "path":
                    value = self.decode_string(value)
                    criteria_string(key, 'is')
                    search = search & Q(path=value)
                elif key  == "name":
                    value = self.decode_string(value)
                    criteria_string(key, 'is')
                    search = search & Q(name=value)
                else:
                    raise Http404("Unknown key %s"%(key))

        photo_list = photo_list.filter(search)
        return (photo_list, criteria)

    def get_photo_list(self, instance):
        return self._get_photo_list(instance)[0]

    def get_criteria(self, instance):
        return self._get_photo_list(instance)[1]

    def get_description(self, instance):
        criteria = self.get_criteria(instance)

        description = ""
        sep = ""
        for i in criteria:
            description = description + sep + i['value']
            sep = " and "

        result = "%s (<a href='%s'>%s</a>)"%(
            description, self.get_view_url(instance),
            conditional_escape(instance))
        return mark_safe(result)

