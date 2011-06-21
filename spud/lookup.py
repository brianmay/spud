from spud import models, webs
from django.db.models import Q
from django.utils.html import escape
from django.conf import settings

def format_result(object):
    photo = object.get_cover_photo()
    if photo is None:
        return u"%s"%(escape(object))
    else:
        web = webs.photo_web()
        return u"<img src='%s' alt=''/>%s"%(web.get_thumb_url(photo,settings.DEFAULT_LIST_SIZE),escape(object))

class person_lookup(object):

    def get_query(self,q,request):
        """ return a query set.  you also have access to request.user if needed """
        return models.person.objects.filter(Q(first_name__istartswith=q) | Q(last_name__istartswith=q))

    def format_item(self,object):
        """ simple display of an object when it is displayed in the list of selected objects """
        return escape(unicode(object))

    def format_result(self,object):
        """ a more verbose display, used in the search results display.  may contain html and multi-lines """
        return format_result(object)

    def get_objects(self,ids):
        """ given a list of ids, return the objects ordered as you would like them on the admin page.
            this is for displaying the currently selected items (in the case of a ManyToMany field)
        """
        result=[]
        for id in ids:
                result.append(models.person.objects.get(pk=id))
        return result

class place_lookup(object):

    def get_query(self,q,request):
        """ return a query set.  you also have access to request.user if needed """
        return models.place.objects.filter(Q(title__istartswith=q))

    def format_item(self,object):
        """ simple display of an object when it is displayed in the list of selected objects """
        return escape(unicode(object))

    def format_result(self,object):
        """ a more verbose display, used in the search results display.  may contain html and multi-lines """
        return format_result(object)

    def get_objects(self,ids):
        """ given a list of ids, return the objects ordered as you would like them on the admin page.
            this is for displaying the currently selected items (in the case of a ManyToMany field)
        """
        return models.place.objects.filter(pk__in=ids)

class album_lookup(object):

    def get_query(self,q,request):
        """ return a query set.  you also have access to request.user if needed """
        return models.album.objects.filter(Q(album__istartswith=q))

    def format_item(self,object):
        """ simple display of an object when it is displayed in the list of selected objects """
        return escape(unicode(object))

    def format_result(self,object):
        """ a more verbose display, used in the search results display.  may contain html and multi-lines """
        return format_result(object)

    def get_objects(self,ids):
        """ given a list of ids, return the objects ordered as you would like them on the admin page.
            this is for displaying the currently selected items (in the case of a ManyToMany field)
        """
        return models.album.objects.filter(pk__in=ids)

class category_lookup(object):

    def get_query(self,q,request):
        """ return a query set.  you also have access to request.user if needed """
        return models.category.objects.filter(Q(category__istartswith=q))

    def format_item(self,object):
        """ simple display of an object when it is displayed in the list of selected objects """
        return escape(unicode(object))

    def format_result(self,object):
        """ a more verbose display, used in the search results display.  may contain html and multi-lines """
        return format_result(object)

    def get_objects(self,ids):
        """ given a list of ids, return the objects ordered as you would like them on the admin page.
            this is for displaying the currently selected items (in the case of a ManyToMany field)
        """
        return models.category.objects.filter(pk__in=ids)

class photo_lookup(object):

    def get_query(self,q,request):
        """ return a query set.  you also have access to request.user if needed """
        return models.photo.objects.filter(Q(title__istartswith=q) | Q(name__istartswith=q))

    def format_item(self,object):
        """ simple display of an object when it is displayed in the list of selected objects """
        return escape(unicode(object))

    def format_result(self,object):
        """ a more verbose display, used in the search results display.  may contain html and multi-lines """
        web = webs.photo_web()
        return u"<img src='%s' alt=""/>%s"%(web.get_thumb_url(object,settings.DEFAULT_LIST_SIZE),escape(object))

    def get_objects(self,ids):
        """ given a list of ids, return the objects ordered as you would like them on the admin page.
            this is for displaying the currently selected items (in the case of a ManyToMany field)
        """
        return models.photo.objects.filter(pk__in=ids).order_by()
