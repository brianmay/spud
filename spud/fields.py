from django import forms
from django.forms.util import ValidationError

from spud import models

import pyparsing as p

class photo_field(forms.IntegerField):
    def clean(self, value):
        value=super(photo_field, self).clean(value)

        if value in ('',None):
            return None

        try:
            photo=models.photo.objects.get(pk=value)
        except models.photo.DoesNotExist, e:
            raise ValidationError(u"Cannot find photo %s: %s" % (value,e))

        return photo


def get_person(s, loc, toks):
    try:
        return models.person.objects.get(first_name=toks[0])
    except models.person.DoesNotExist, e:
        pass
    except models.person.MultipleObjectsReturned, e:
        pass

    try:
        return models.person.objects.get(last_name=toks[0])
    except models.person.DoesNotExist, e:
        pass
    except models.person.MultipleObjectsReturned, e:
        pass

    (first_name, sep, last_name) = toks[0].strip().rpartition(" ")
    if first_name == "":
        first_name = last_name
        last_name = ""

    try:
        return models.person.objects.get(first_name=first_name,last_name=last_name)
    except models.person.DoesNotExist, e:
        raise p.ParseFatalException(u"Person '%s' '%s' not found"%(first_name,last_name), loc)
    except models.person.MultipleObjectsReturned, e:
        raise p.ParseFatalException(u"Person '%s' '%s' not unique"%(first_name,last_name), loc)
    except Exception, e:
        raise p.ParseFatalException(u"Unknown exception: %s"%(e), loc)

def get_album(s, loc, toks):
    list = toks[0].split("/")

    try:
        parent = None
        for item in list:
            if parent is None:
                parent = models.album.objects.get(album=item)
            else:
                parent = models.album.objects.get(album=item,parent_album=parent)
        return parent
    except models.album.DoesNotExist, e:
        raise p.ParseFatalException(u"Album '%s' not found"%(item), loc)
    except models.album.MultipleObjectsReturned, e:
        raise p.ParseFatalException(u"Album '%s' not unique"%(item), loc)
    except Exception, e:
        raise p.ParseFatalException(u"Unknown exception: %s"%(e), loc)

def get_category(s, loc, toks):
    list = toks[0].split("/")

    try:
        parent = None
        for item in list:
            if parent is None:
                parent = models.category.objects.get(category=item)
            else:
                parent = models.category.objects.get(category=item,parent_category=parent)
        return parent
    except models.category.DoesNotExist, e:
        raise p.ParseFatalException(u"Category '%s' not found"%(item), loc)
    except models.catrgory.MultipleObjectsReturned, e:
        raise p.ParseFatalException(u"Category '%s' not unique"%(item), loc)
    except Exception, e:
        raise p.ParseFatalException(u"Unknown exception: %s"%(e), loc)

def get_place(s, loc, toks):
    list = toks[0].split("/")

    try:
        parent = None
        for item in list:
            if parent is None:
                parent = models.place.objects.get(title=item)
            else:
                parent = models.place.objects.get(title=item,parent_place=parent)
        return parent
    except models.place.DoesNotExist, e:
        raise p.ParseFatalException(u"Place '%s' not found"%(item), loc)
    except Exception, e:
        raise p.ParseFatalException(u"Unknown exception: %s"%(e), loc)

def get_int(s, loc, toks):
    return int(toks[0])

class photo_update_field(forms.CharField):
    def clean(self, value):
        value=super(photo_update_field, self).clean(value)

        if value in ('',None):
            return []

        person = p.Regex('[a-zA-Z0-9\' \/-]+')
        person.setParseAction(get_person)

        album = p.Regex('[a-zA-Z0-9\' \/-]+')
        album.setParseAction(get_album)

        category = p.Regex('[a-zA-Z0-9\' \/-]+')
        category.setParseAction(get_category)

        place = p.Regex('[a-zA-Z0-9\' \/-]+')
        place.setParseAction(get_place)

        person_operation = (p.Keyword("person",caseless=True).setResultsName("noun")
                            + p.Group(p.delimitedList( 
                                p.Group(person.setResultsName("person") + p.Optional("(" + p.Word(p.nums).setParseAction(get_int).setResultsName("position") + ")"))
                            )).setResultsName( "objects" ) )

        album_operation = (p.Keyword("album",caseless=True).setResultsName("noun")
                            + p.Group(p.delimitedList( album )).setResultsName( "objects" ))

        category_operation = (p.Keyword("category",caseless=True).setResultsName("noun")
                            + p.Group(p.delimitedList( category )).setResultsName( "objects" ))

        place_operation = (p.Keyword("place",caseless=True).setResultsName("noun")
                            + (p.Keyword("None",caseless=True) | place).setResultsName( "object" ))

        photographer_operation = (p.Keyword("photographer",caseless=True).setResultsName("noun")
                            + (p.Keyword("None",caseless=True) | person).setResultsName( "object" ))

        title_operation = (p.Keyword("title",caseless=True).setResultsName("noun")
                            +  (p.Keyword("None",caseless=True) | p.Regex(".+")).setResultsName( "object" ))

        description_operation = (p.Keyword("description",caseless=True).setResultsName("noun")
                            +  (p.Keyword("None",caseless=True) | p.Regex(".+")).setResultsName( "object" ))


        add_operation = ( p.Keyword("add",caseless=True).setResultsName("verb")
                            + ( person_operation | album_operation | category_operation ) )

        set_operation = ( p.Keyword("set",caseless=True).setResultsName("verb")
                            + ( person_operation | place_operation | photographer_operation | title_operation | description_operation ) )

        delete_operation = ( p.Keyword("delete",caseless=True).setResultsName("verb")
                            + ( person_operation | album_operation | category_operation ) )


        parser = add_operation | set_operation | delete_operation

        list = value.split("\n")
        results = []
        for line in list:
            try:
                if line != "":
                    results.append(parser.parseString(line, parseAll=True))
            except p.ParseBaseException, e:
                raise ValidationError(u"Cannot parse line '%s' loc: %s msg: %s"%(line, e.loc, e.msg))

        return results
