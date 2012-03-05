from spud import webs
import django_tables2 as tables

from django.utils.html import conditional_escape
from django.utils.safestring import mark_safe

class web_table(tables.Table):
    def __init__(self, web, *args, **kwargs):
        super(web_table,self).__init__(*args, **kwargs)
        self.web = web

class date_table(web_table):
    date = tables.Column(sortable=False)

    def render_date(self, record):
        return mark_safe(u"<a href='%s'>%s</a>"%(self.web.get_view_url(record),conditional_escape(u"%s"%(record))))

class action_table(web_table):
    action = tables.Column(sortable=False)

    def render_action(self, record):
        return mark_safe(u"<a href='%s'>%s</a>"%(self.web.get_view_url(record),conditional_escape(u"%s"%(record))))

class person_table(tables.Table):
    cover_photo = tables.Column(sortable=False)
    called = tables.Column()
    first_name = tables.Column()
    middle_name = tables.Column()
    last_name = tables.Column()

    def __init__(self, user, web, default_list_size, *args, **kwargs):
        super(person_table,self).__init__(*args, **kwargs)
        self.web = web
        self.default_list_size = default_list_size

        if web.has_edit_perms(user):
            self.base_columns["edit"] = tables.Column(sortable=False)
        if web.has_delete_perms(user):
            self.base_columns["delete"] = tables.Column(sortable=False)

    def render_cover_photo(self, record):
        photo = record.get_cover_photo()
        if photo is not None:
            web = webs.photo_web()
            value = u"<img src='%s' alt=''/>"%(web.get_thumb_url(photo,self.default_list_size))
        else:
            value = u"No Photo"

        return mark_safe(u"<a href='%s'>%s</a>"%(self.web.get_view_url(record),value))

    def render_called(self, record):
        value = record.called
        if not value:
            value="-"
        return mark_safe(conditional_escape(value))

    def render_first_name(self, record):
        value = record.first_name
        if not value:
            value="-"
        return mark_safe(conditional_escape(value))

    def render_middle_name(self, record):
        value = record.middle_name
        if not value:
            value="-"
        return mark_safe(conditional_escape(value))

    def render_last_name(self, record):
        value = record.last_name
        if not value:
            value="-"
        return mark_safe(conditional_escape(value))

    def render_edit(self, record):
        web = webs.get_web_from_object(record)
        return mark_safe("<a class='changelink' href='%s'>%s</a>"%(
                web.get_edit_url(record),
                "edit"))

    def render_delete(self, record):
        web = webs.get_web_from_object(record)
        return mark_safe("<a class='deletelink' href='%s'>%s</a>"%(
                web.get_delete_url(record),
                "delete"))

class album_table(tables.Table):
    cover_photo = tables.Column(sortable=False)
    album = tables.Column()
    sortname = tables.Column()
    sortorder = tables.Column()
    revised = tables.Column()

    def __init__(self, user, web, default_list_size, *args, **kwargs):
        super(album_table,self).__init__(*args, **kwargs)
        self.web = web
        self.default_list_size = default_list_size

        if web.has_edit_perms(user):
            self.base_columns["edit"] = tables.Column(sortable=False)
        if web.has_delete_perms(user):
            self.base_columns["delete"] = tables.Column(sortable=False)

    def render_cover_photo(self, record):
        photo = record.get_cover_photo()
        if photo is not None:
            web = webs.photo_web()
            value = u"<img src='%s' alt=''/>"%(web.get_thumb_url(photo,self.default_list_size))
        else:
            value = u"No Photo"

        return mark_safe(u"<a href='%s'>%s</a>"%(self.web.get_view_url(record),value))

    def render_edit(self, record):
        web = webs.get_web_from_object(record)
        return mark_safe("<a class='changelink' href='%s'>%s</a>"%(
                web.get_edit_url(record),
                "edit"))

    def render_delete(self, record):
        web = webs.get_web_from_object(record)
        return mark_safe("<a class='deletelink' href='%s'>%s</a>"%(
                web.get_delete_url(record),
                "delete"))

class photo_relation_table(tables.Table):
    photo_1 = tables.Column(sortable=False)
    desc_1 = tables.Column()
    photo_2 = tables.Column(sortable=False)
    desc_2 = tables.Column()

    def __init__(self, user, web, default_list_size, default_view_size, *args, **kwargs):
        super(photo_relation_table,self).__init__(*args, **kwargs)
        self.web = web
        self.default_list_size = default_list_size
        self.default_view_size = default_view_size

        if web.has_edit_perms(user):
            self.base_columns["edit"] = tables.Column(sortable=False)

    def render_edit(self, record):
        web = webs.get_web_from_object(record)
        return mark_safe("<a class='changelink' href='%s'>%s</a>"%(
                web.get_edit_url(record),
                "edit"))

    def render_photo_1(self, record):
        photo = record.photo_1
        if photo is not None:
            web = webs.photo_web()
            return mark_safe(u"<a href='%s'><img src='%s' alt=''/></a>"%(web.get_view_url(photo,self.default_view_size),web.get_thumb_url(photo,self.default_list_size)))
        else:
            return mark_safe(u"No Photo")

    def render_photo_2(self, record):
        photo = record.photo_2
        if photo is not None:
            web = webs.photo_web()
            return mark_safe(u"<a href='%s'><img src='%s' alt=''/></a>"%(web.get_view_url(photo,self.default_view_size),web.get_thumb_url(photo,self.default_list_size)))
        else:
            return mark_safe(u"No Photo")
