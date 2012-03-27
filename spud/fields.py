from django import forms
from django.forms.util import ValidationError
from django.utils.translation import ugettext as _

from spud import models

import pyparsing as p
import pytz
import datetime

import ajax_select.fields

class select_widget(ajax_select.fields.AutoCompleteSelectWidget):
    class Media:
        css = {
            'all': ( 'css/ajax_select.css', 'css/jquery-ui.css')
        }
        js = ('js/jquery.js', 'js/jquery-ui.js', 'js/ajax_select.js')

class select_field(ajax_select.fields.AutoCompleteSelectField):

    def __init__(self, channel, *args, **kwargs):
        widget = kwargs.get("widget", None)
        if widget is None:
            kwargs["widget"] = select_widget(channel=channel,help_text=kwargs.get('help_text',_('Enter text to search.')))
        super(select_field, self).__init__(channel, *args, **kwargs)

class select_multiple_widget(ajax_select.fields.AutoCompleteSelectMultipleWidget):
    class Media:
        css = {
            'all': ( 'css/ajax_select.css', 'css/jquery-ui.css')
        }
        js = ('js/jquery.js', 'js/jquery-ui.js', 'js/ajax_select.js')

class select_multiple_field(ajax_select.fields.AutoCompleteSelectMultipleField):

    def __init__(self, channel, *args, **kwargs):
        widget = kwargs.get("widget", None)
        if widget is None:
            kwargs["widget"] = select_widget(channel=channel,help_text=kwargs.get('help_text',_('Enter text to search.')))
        super(select_multiple_field, self).__init__(channel, *args, **kwargs)

class timezone_field(forms.CharField):
    def clean(self, value):
        value=super(timezone_field, self).clean(value)
        if value == "":
            return None
        try:
            return pytz.timezone(value)
        except pytz.UnknownTimeZoneError:
            raise ValidationError(u"Cannot find timezone: '%s'"%(value))
        return value

def get_person(s, loc, toks):
    # input "Abc Def Xyz"

    # Try first_name="Abc" last_name="Xyz" middle_name="Def"
    parts = toks[0].split(" ")
    try:
        if len(parts)==3:
            (first_name, middle_name, last_name) = parts
            return models.person.objects.get(first_name=first_name,last_name=last_name,middle_name=middle_name)
    except models.person.DoesNotExist, e:
        pass
    except models.person.MultipleObjectsReturned, e:
        raise p.ParseFatalException(u"First name '%s' middle name '%s' last name '%s' found multiple times"%(first_name,middle_name,last_name), loc)
    except Exception, e:
        raise p.ParseFatalException(u"Unknown exception '%s' processing '%s': '%s'"%(type(e),toks[0],e), loc)

    # Try first_name="Abc" last_name="" middle_name=""
    try:
        if len(parts)==3:
            (first_name, middle_name, last_name) = parts
            middle_name=""
            return models.person.objects.get(first_name=first_name,last_name=last_name,middle_name=middle_name)
    except models.person.DoesNotExist, e:
        pass
    except models.person.MultipleObjectsReturned, e:
        raise p.ParseFatalException(u"First name '%s' middle name '%s' last name '%s' found multiple times"%(first_name,middle_name,last_name), loc)
    except Exception, e:
        raise p.ParseFatalException(u"Unknown exception '%s' processing '%s': '%s'"%(type(e),toks[0],e), loc)

    # Try first_name="Abc Def" last_name="Xyz"
    (first_name, _, last_name) = toks[0].strip().rpartition(" ")
    try:
        if first_name != "":
            return models.person.objects.get(first_name=first_name,last_name=last_name)
    except models.person.DoesNotExist, e:
        pass
    except models.person.MultipleObjectsReturned, e:
        raise p.ParseFatalException(u"First name '%s' last name '%s' found multiple times"%(first_name,last_name), loc)
    except Exception, e:
        raise p.ParseFatalException(u"Unknown exception '%s' processing '%s': '%s'"%(type(e),toks[0],e), loc)

    # Try first_name="Abc Def Xyz"
    try:
        return models.person.objects.get(first_name=toks[0])
    except models.person.DoesNotExist, e:
        pass
    except models.person.MultipleObjectsReturned, e:
        raise p.ParseFatalException(u"First name '%s' found multiple times"%(toks[0]), loc)

    # Try last_name="Abc Def Xyz"
    try:
        return models.person.objects.get(last_name=toks[0])
    except models.person.DoesNotExist, e:
        pass
    except models.person.MultipleObjectsReturned, e:
        raise p.ParseFatalException(u"Last name '%s' found multiple times"%(toks[0]), loc)

    raise p.ParseFatalException(u"Person '%s' not found"%(toks[0]), loc)

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
        raise p.ParseFatalException(u"Unknown exception '%s' processing '%s': '%s'"%(type(e),toks[0],e), loc)

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
    except models.category.MultipleObjectsReturned, e:
        raise p.ParseFatalException(u"Category '%s' not unique"%(item), loc)
    except Exception, e:
        raise p.ParseFatalException(u"Unknown exception '%s' processing '%s': '%s'"%(type(e),toks[0],e), loc)

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
        raise p.ParseFatalException(u"Unknown exception '%s' processing '%s': '%s'"%(type(e),toks[0],e), loc)

def get_int(s, loc, toks):
    return int(toks[0])

def get_timezone(s, loc, toks):
    try:
        return pytz.timezone(toks[0])
    except pytz.UnknownTimeZoneError, e:
        raise p.ParseFatalException(u"Unknown timezone '%s'"%(toks[0]), loc)
    except Exception, e:
        raise p.ParseFatalException(u"Unknown exception '%s' processing '%s': '%s'"%(type(e),toks[0],e), loc)

def get_datetime(s, loc, toks):
    try:
        (date,time) = toks[0].split(" ")
        (year,month,day) = date.split("-")

        thetime = time.split(":")
        (hour,minute) = thetime[0:2]
        if len(thetime) >= 3:
            second=thetime[2]
        else:
            second=0

        return datetime.datetime(int(year),int(month),int(day),int(hour),int(minute),int(second))
    except ValueError, e:
        raise p.ParseFatalException(u"Illegal date/time '%s': '%s'"%(toks[0],e), loc)
    except Exception, e:
        raise p.ParseFatalException(u"Unknown exception '%s' processing '%s': '%s'"%(type(e),toks[0],e), loc)

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

        action_operation = (p.Keyword("action",caseless=True).setResultsName("noun")
                            + p.Group(p.Keyword("nop") | p.Keyword("delete") | p.Keyword("regenerate") | p.Keyword("move") | p.Keyword("90") | p.Keyword("180") | p.Keyword("270")).setResultsName( "action" ))

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

        datetime_operation = (p.Keyword("datetime",caseless=True).setResultsName("noun")
                            +  (p.Regex("\\d\\d\\d\\d-\\d\\d-\\d\\d \\d\\d:\\d\\d(:\\d\\d)?")).setParseAction(get_datetime).setResultsName( "datetime" )
                         )

        timezone_operation = (p.Keyword("timezone",caseless=True).setResultsName("noun")
                            +  (p.Regex("[A-Za-z\/]+")).setParseAction(get_timezone).setResultsName( "timezone" ))

        add_operation = ( p.Keyword("add",caseless=True).setResultsName("verb")
                            + ( person_operation | album_operation | category_operation ) )

        set_operation = ( p.Keyword("set",caseless=True).setResultsName("verb")
                            + ( action_operation | person_operation | place_operation | photographer_operation | title_operation | description_operation | datetime_operation | timezone_operation ) )

        delete_operation = ( p.Keyword("delete",caseless=True).setResultsName("verb")
                            + ( person_operation | album_operation | category_operation ) )


        parser = add_operation | set_operation | delete_operation

        list = value.split("\n")
        results = []
        for line in list:
            line = line.strip()
            try:
                if line != "":
                    results.append(parser.parseString(line, parseAll=True))
            except p.ParseBaseException, e:
                raise ValidationError(u"Cannot parse line '%s' loc: '%s' msg: '%s'"%(line, e.loc, e.msg))

        return results
