from spud import models
from django.db.models import Q

class person_lookup(object):

    def get_query(self,q,request):
        """ return a query set.  you also have access to request.user if needed """
        return models.person.objects.filter(Q(first_name__istartswith=q) | Q(last_name__istartswith=q))

    def format_item(self,object):
        """ simple display of an object when it is displayed in the list of selected objects """
        return unicode(object)

    def format_result(self,object):
        """ a more verbose display, used in the search results display.  may contain html and multi-lines """
        return u"%s" % (object)

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
        return unicode(object)

    def format_result(self,object):
        """ a more verbose display, used in the search results display.  may contain html and multi-lines """
        return object.get_full_name()

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
        return unicode(object)

    def format_result(self,object):
        """ a more verbose display, used in the search results display.  may contain html and multi-lines """
        return object.get_full_name()

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
        return unicode(object)

    def format_result(self,object):
        """ a more verbose display, used in the search results display.  may contain html and multi-lines """
        return object.get_full_name()

    def get_objects(self,ids):
        """ given a list of ids, return the objects ordered as you would like them on the admin page.
            this is for displaying the currently selected items (in the case of a ManyToMany field)
        """
        return models.category.objects.filter(pk__in=ids)
