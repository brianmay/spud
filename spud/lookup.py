from ajax_select import LookupChannel
from spud import models, webs
from django.db.models import Q
from django.utils.html import escape
from django.conf import settings

class LookupChannel(LookupChannel):
    # anyone can use these lookup methods
    def check_auth(self, request):
        return

def format_match(object, photo=None, description=None):
    result = []

    if photo is None:
        photo = object.get_cover_photo()

    if photo is not None:
        web = webs.photo_web()
        result.append(u"<img src='%s' alt=''/>"%web.get_thumb_url(photo,settings.DEFAULT_LIST_SIZE))

    result.append(u"<div class='title'>%s</div>"%(escape(object)))

    if description:
        result.append(u"<div class='desc'>%s</div>"%(escape(description)))

    return "".join(result)

class person_lookup(LookupChannel):

    def get_query(self,q,request):
        """ return a query set.  you also have access to request.user if needed """
        return models.person.objects.filter(Q(first_name__istartswith=q) | Q(last_name__istartswith=q))

    def format_item_display(self,object):
        """ simple display of an object when it is displayed in the list of selected objects """
        return escape(unicode(object))

    def format_match(self,object):
        """ (HTML) formatted item for display in the dropdown """
        return format_match(object)

    def get_objects(self,ids):
        """ given a list of ids, return the objects ordered as you would like them on the admin page.
            this is for displaying the currently selected items (in the case of a ManyToMany field)
        """
        result=[]
        for id in ids:
                result.append(models.person.objects.get(pk=id))
        return result

class place_lookup(LookupChannel):

    def get_query(self,q,request):
        """ return a query set.  you also have access to request.user if needed """
        return models.place.objects.filter(Q(title__istartswith=q))

    def format_item_display(self,object):
        """ simple display of an object when it is displayed in the list of selected objects """
        return escape(unicode(object))

    def format_match(self,object):
        """ (HTML) formatted item for display in the dropdown """
        description=[]
        if object.city:
            description.append(object.city)
        if object.state:
            description.append(object.state)
        if object.country:
            description.append(object.country)

        if len(description) == 0:
            description = None
        else:
            description = ", ".join(description)

        return format_match(object, description=description)

    def get_objects(self,ids):
        """ given a list of ids, return the objects ordered as you would like them on the admin page.
            this is for displaying the currently selected items (in the case of a ManyToMany field)
        """
        return models.place.objects.filter(pk__in=ids)

class album_lookup(LookupChannel):

    def get_query(self,q,request):
        """ return a query set.  you also have access to request.user if needed """
        return models.album.objects.filter(Q(album__istartswith=q))

    def format_item_display(self,object):
        """ simple display of an object when it is displayed in the list of selected objects """
        return escape(unicode(object))

    def format_match(self,object):
        """ (HTML) formatted item for display in the dropdown """
        return format_match(object, description=object.album_description)

    def get_objects(self,ids):
        """ given a list of ids, return the objects ordered as you would like them on the admin page.
            this is for displaying the currently selected items (in the case of a ManyToMany field)
        """
        return models.album.objects.filter(pk__in=ids)

class category_lookup(LookupChannel):

    def get_query(self,q,request):
        """ return a query set.  you also have access to request.user if needed """
        return models.category.objects.filter(Q(category__istartswith=q))

    def format_item_display(self,object):
        """ simple display of an object when it is displayed in the list of selected objects """
        return escape(unicode(object))

    def format_match(self,object):
        """ (HTML) formatted item for display in the dropdown """
        return format_match(object, description=object.category_description)

    def get_objects(self,ids):
        """ given a list of ids, return the objects ordered as you would like them on the admin page.
            this is for displaying the currently selected items (in the case of a ManyToMany field)
        """
        return models.category.objects.filter(pk__in=ids)

class photo_lookup(LookupChannel):

    def get_query(self,q,request):
        """ return a query set.  you also have access to request.user if needed """
        return models.photo.objects.filter(Q(title__istartswith=q) | Q(name__istartswith=q))[0:10]

    def format_item_display(self,object):
        """ simple display of an object when it is displayed in the list of selected objects """
        return escape(unicode(object))

    def format_match(self,object):
        """ (HTML) formatted item for display in the dropdown """
        return format_match(object, photo=object, description=photo.description)

    def get_objects(self,ids):
        """ given a list of ids, return the objects ordered as you would like them on the admin page.
            this is for displaying the currently selected items (in the case of a ManyToMany field)
        """
        return models.photo.objects.filter(pk__in=ids).order_by()
