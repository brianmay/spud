from spud import webs, models
import django_tables as tables

from django.utils.html import conditional_escape
from django.utils.safestring import mark_safe

class web_table(tables.MemoryTable):
    def __init__(self, web, *args, **kwargs):
        super(web_table,self).__init__(*args, **kwargs)
        self.web = web

class date_table(web_table):
    date = tables.Column(sortable=False)

    def render_date(self, data):
        return mark_safe(u"<a href='%s'>%s</a>"%(self.web.get_view_url(data),conditional_escape(u"%s"%(data))))

class action_table(web_table):
    action = tables.Column(sortable=False)

    def render_action(self, data):
        return mark_safe(u"<a href='%s'>%s</a>"%(self.web.get_view_url(data),conditional_escape(u"%s"%(data))))

class person_table(tables.ModelTable):
    coverphoto = tables.Column(sortable=False)
    called = tables.Column()
    first_name = tables.Column()
    middle_name = tables.Column()
    last_name = tables.Column()

    def __init__(self, user, web, *args, **kwargs):
        super(person_table,self).__init__(*args, **kwargs)
        self.web = web

        if web.has_edit_perms(user):
            self.base_columns["edit"] = tables.Column(sortable=False)
        if web.has_delete_perms(user):
            self.base_columns["delete"] = tables.Column(sortable=False)

    def render_coverphoto(self, data):
        photo = data.get_cover_photo()
        if photo is not None:
            web = webs.photo_web()
            return mark_safe(u"<img src='%s' alt=''/>"%(web.get_thumb_url(photo,'thumb')))
        else:
            return mark_safe(u"No Photo")

    def render_called(self, data):
        value = data.called
        if not value:
            value="-"
        return mark_safe(u"<a href='%s'>%s</a>"%(self.web.get_view_url(data),conditional_escape(value)))

    def render_first_name(self, data):
        value = data.first_name
        if not value:
            value="-"
        return mark_safe(u"<a href='%s'>%s</a>"%(self.web.get_view_url(data),conditional_escape(value)))

    def render_middle_name(self, data):
        value = data.middle_name
        if not value:
            value="-"
        return mark_safe(u"<a href='%s'>%s</a>"%(self.web.get_view_url(data),conditional_escape(value)))

    def render_last_name(self, data):
        value = data.last_name
        if not value:
            value="-"
        return mark_safe(u"<a href='%s'>%s</a>"%(self.web.get_view_url(data),conditional_escape(value)))

    def render_edit(self, data):
        web = webs.get_web_from_object(data)
        return mark_safe("<a class='changelink' href='%s'>%s</a>"%(
                web.get_edit_url(data),
                "edit"))

    def render_delete(self, data):
        web = webs.get_web_from_object(data)
        return mark_safe("<a class='deletelink' href='%s'>%s</a>"%(
                web.get_delete_url(data),
                "delete"))

class photo_relation_table(tables.ModelTable):
    photo_1 = tables.Column(sortable=False)
    desc_1 = tables.Column()
    photo_2 = tables.Column(sortable=False)
    desc_2 = tables.Column()

    def __init__(self, user, web, *args, **kwargs):
        super(photo_relation_table,self).__init__(*args, **kwargs)
        self.web = web

        if web.has_edit_perms(user):
            self.base_columns["edit"] = tables.Column(sortable=False)

    def render_edit(self, data):
        web = webs.get_web_from_object(data)
        return mark_safe("<a class='changelink' href='%s'>%s</a>"%(
                web.get_edit_url(data),
                "edit"))

    def render_photo_1(self, data):
        photo = data.photo_1
        if photo is not None:
            web = webs.photo_web()
            return mark_safe(u"<a href='%s'><img src='%s' alt=''/></a>"%(web.get_view_url(photo),web.get_thumb_url(photo,'thumb')))
        else:
            return mark_safe(u"No Photo")

    def render_photo_2(self, data):
        photo = data.photo_2
        if photo is not None:
            web = webs.photo_web()
            return mark_safe(u"<a href='%s'><img src='%s' alt=''/></a>"%(web.get_view_url(photo),web.get_thumb_url(photo,'thumb')))
        else:
            return mark_safe(u"No Photo")
