# -*- coding: utf-8 -*- 

from django import template
from django.utils.safestring import mark_safe
from django.utils.http import urlquote
from django.core.urlresolvers import reverse

import pytz
from django.conf import settings

from spud.models import sex_to_string, status_to_string

register = template.Library()

DOT = '.'

@register.simple_tag
def get_thumb_url(photo,size):
    return mark_safe(photo.get_thumb_url(size))

@register.inclusion_tag('spud/show_error_list.html')
def show_error_list(error_list):
    return {
        'error_list': error_list,
    };

@register.inclusion_tag('spud/show_photo_list.html')
def show_photo_list(page_obj, links):
        return {
                'page_obj': page_obj,
                'links': links,
                };

@register.inclusion_tag('spud/breadcrumbs.html')
def show_breadcrumbs(breadcrumbs):
        return {'breadcrumbs': breadcrumbs[:-1], 'object': breadcrumbs[-1] };

def _get_link(links,i):
    if links is not None:
        return links.photo_detail_link(i)
    else:
        return u"?page=%d"%(i)

@register.simple_tag
def paginator_random(page_obj,links):
    if links is not None:
        return mark_safe(u"<a href='%s'>R</a>" % (links.photo_detail_link("random")))
    else:
        return mark_safe(u'')

@register.simple_tag
def paginator_prev(page_obj,links):
    if page_obj.number <= 1:
        return mark_safe(u'')
    else:
        return mark_safe(u"<a href='%s'>&lt;</a>" % (_get_link(links,page_obj.number-1)))

@register.simple_tag
def paginator_next(page_obj,links):
    if page_obj.number >= page_obj.paginator.num_pages:
        return mark_safe(u'')
    else:
        return mark_safe(u"<a href='%s'>&gt;</a>" % (_get_link(links,page_obj.number+1)))

@register.simple_tag
def paginator_number(page_obj,links,i):
    if i == DOT:
        return mark_safe(u'... ')
    elif i == page_obj.number:
        return mark_safe(u'<span class="this-page">%d</span> ' % (i))
    else:
        return mark_safe(u'<a href="%s"%s>%d</a> ' % (_get_link(links,i), (i == page_obj.paginator.num_pages and ' class="end"' or ''), i))

def _pagination(page_obj, links):
    paginator, page_num = page_obj.paginator, page_obj.number

    if paginator.num_pages <= 1:
        pagination_required = False
        page_range = []
    else:
        pagination_required = True
        ON_EACH_SIDE = 3
        ON_ENDS = 2

        # If there are 10 or fewer pages, display links to every page.
        # Otherwise, do some fancy
        if paginator.num_pages <= 10:
            page_range = range(1,paginator.num_pages+1)
        else:
            # Insert "smart" pagination links, so that there are always ON_ENDS
            # links at either end of the list of pages, and there are always
            # ON_EACH_SIDE links at either end of the "current page" link.
            page_range = []
            if page_num > (ON_EACH_SIDE + ON_ENDS + 1):
                page_range.extend(range(1, ON_ENDS+1))
                page_range.append(DOT)
                page_range.extend(range(page_num - ON_EACH_SIDE, page_num))
            else:
                page_range.extend(range(1, page_num))

            if page_num < (paginator.num_pages - ON_EACH_SIDE - ON_ENDS):
                page_range.extend(range(page_num, page_num + ON_EACH_SIDE + 1))
                page_range.append(DOT)
                page_range.extend(range(paginator.num_pages - ON_ENDS + 1, paginator.num_pages + 1))
            else:
                page_range.extend(range(page_num, paginator.num_pages + 1))

    return {
        'pagination_required': pagination_required,
        'page_obj': page_obj,
        'page_range': page_range,
        'links': links
    }

@register.inclusion_tag('spud/pagination.html')
def pagination(page_obj):
    return _pagination(page_obj, None)

@register.inclusion_tag('spud/pagination.html')
def pagination_with_links(page_obj, links):
    return _pagination(page_obj, links)

@register.simple_tag
def photo_detail_url_by_page(links,page_obj,number):
    return links.photo_detail_link(page_obj.start_index()+number)

@register.simple_tag
def photo_edit_url(links,number):
    return links.photo_edit_link(number)

@register.inclusion_tag('spud/photo_edit_buttons.html')
def photo_edit_buttons(page_obj):
        return { 'page_obj': page_obj };

@register.filter
def show_datetime(value, timezone=None):
    if timezone is None:
        timezone = settings.TIME_ZONE

    from_tz = pytz.utc
    to_tz = pytz.timezone(timezone)

    local = from_tz.localize(value)
    local = local.astimezone(to_tz)

    return mark_safe(u"<a href='%s'>%s</a> %s (%s)" % (
            reverse("date_detail",kwargs={'object_id': value.date()}),
            local.date(),local.time(),local.tzinfo))

@register.simple_tag
def show_sex(sex):
    return mark_safe(sex_to_string(sex))

@register.simple_tag
def show_status(status):
    return mark_safe(status_to_string(status))

@register.simple_tag
def show_status_with_link(status):
    value = status_to_string(status)
    if status=="":
        status="none";
    return mark_safe("<a href='%s'>%s</a>"%(
            reverse("status_detail",kwargs={'object_id': status}),
            value))

@register.tag
def get_permissions_from_type(parser, token):
    try:
        tag_name, add_tag, edit_tag, delete_tag, user, type = token.split_contents()
    except ValueError:
        raise template.TemplateSyntaxError, "%r tag requires exactly four arguments" % token.contents.split()[0]
    return get_permissions_from_type_node(add_tag, edit_tag, delete_tag, user, type)

class get_permissions_from_type_node(template.Node):
    def __init__(self, add_tag, edit_tag, delete_tag, user, type):
        self.add_tag = template.Variable(add_tag)
        self.edit_tag = template.Variable(edit_tag)
        self.delete_tag = template.Variable(delete_tag)
        self.user = template.Variable(user)
        self.type = template.Variable(type)
    def render(self, context):
        add_tag = self.add_tag.resolve(context)
        edit_tag = self.edit_tag.resolve(context)
        delete_tag = self.delete_tag.resolve(context)
        user = self.user.resolve(context)
        type = self.type.resolve(context)

        context[add_tag] = type.has_add_perms(user)
        context[edit_tag] = type.has_edit_perms(user)
        context[delete_tag] = type.has_delete_perms(user)
        return ''

