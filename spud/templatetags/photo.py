# -*- coding: utf-8 -*- 

import pytz

from django import template
from django.utils.safestring import mark_safe
from django.utils.http import urlquote
from django.core.urlresolvers import reverse
from django.utils.html import conditional_escape
from django.conf import settings
from django.template import RequestContext

from spud.models import sex_to_string, action_to_string
from spud import webs

register = template.Library()

DOT = '.'

@register.simple_tag
def get_thumb_url(photo,size):
    web = webs.photo_web()
    return mark_safe(web.get_thumb_url(photo,size))

@register.simple_tag
def get_view_url(instance):
    web = webs.get_web_from_object(instance)
    return mark_safe(web.get_view_url(instance))

@register.simple_tag
def get_edit_url(instance):
    web = webs.get_web_from_object(instance)
    return mark_safe(web.get_edit_url(instance))

@register.simple_tag
def get_delete_url(instance):
    web = webs.get_web_from_object(instance)
    return mark_safe(web.get_delete_url(instance))

@register.inclusion_tag('spud/show_error_list.html')
def show_error_list(error_list):
    return {
        'error_list': error_list,
    };

@register.inclusion_tag('spud/show_object_list.html', takes_context=True)
def show_list(context, table, rows, web, sort="sort"):
    dict = RequestContext(context['request'])
    dict['table'] = table
    dict['web'] = web
    dict['rows'] = rows
    dict['sort'] = sort
    return dict

@register.inclusion_tag('spud/show_photo_list.html')
def show_photo_list(page_obj, web, parent):
        return {
                'page_obj': page_obj,
                'web': web,
                'parent': parent,
                };

@register.inclusion_tag('spud/breadcrumbs.html')
def show_breadcrumbs(breadcrumbs):
        return {'breadcrumbs': breadcrumbs[:-1], 'object': breadcrumbs[-1] };

def _get_url(web, instance, i):
    if instance is not None:
        return web.photo_detail_url(instance,i)
    else:
        return u"?page=%d"%(i)

@register.simple_tag
def paginator_random(page_obj, web, instance):
    if instance is not None:
        return mark_safe(u"<a href='%s' accesskey='r'>R</a>" % (web.photo_detail_url(instance, "random")))
    else:
        return mark_safe(u'')

@register.simple_tag
def paginator_prev(page_obj, web, instance):
    if page_obj.number <= 1:
        return mark_safe(u'')
    else:
        return mark_safe(u"<a href='%s' accesskey='p'>&lt;</a>" % (_get_url(web, instance, page_obj.number-1)))

@register.simple_tag
def paginator_next(page_obj, web, instance):
    if page_obj.number >= page_obj.paginator.num_pages:
        return mark_safe(u'')
    else:
        return mark_safe(u"<a href='%s' accesskey='n'>&gt;</a>" % (_get_url(web, instance, page_obj.number+1)))

@register.simple_tag
def paginator_number(page_obj, web, instance, i):
    if i == DOT:
        return mark_safe(u'... ')
    elif i == page_obj.number:
        return mark_safe(u'<span class="this-page">%d</span> ' % (i))
    else:
        return mark_safe(u'<a href="%s"%s>%d</a> ' % (_get_url(web, instance, i), (i == page_obj.paginator.num_pages and ' class="end"' or ''), i))

def _pagination(page_obj, web, instance):
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
        'web': web,
        'object': instance,
    }

@register.inclusion_tag('spud/pagination.html')
def pagination(page_obj, web):
    return _pagination(page_obj, web, None)

@register.inclusion_tag('spud/pagination.html')
def pagination_with_parent(page_obj, web, instance):
    return _pagination(page_obj, web, instance)

@register.simple_tag
def photo_detail_url_by_page(web, instance, page_obj, number):
    return web.photo_detail_url(instance, page_obj.start_index()+number)

@register.simple_tag
def photo_edit_url(web, instance, number):
    return web.photo_edit_url(instance, number)

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

@register.filter
def show_date(value, timezone=None):
    if timezone is None:
        timezone = settings.TIME_ZONE

    from_tz = pytz.utc
    to_tz = pytz.timezone(timezone)

    local = from_tz.localize(value)
    local = local.astimezone(to_tz)

    return mark_safe(local.date())

@register.simple_tag
def show_sex(sex):
    return mark_safe(sex_to_string(sex))

@register.simple_tag
def show_action(action):
    return mark_safe(action_to_string(action))

@register.simple_tag
def show_action_with_url(action):
    value = action_to_string(action)
    if action is None:
        action="none";
    return mark_safe("<a href='%s'>%s</a>"%(
            reverse("action_detail",kwargs={'object_id': action}),
            value))

class url_with_param_node(template.Node):
    def __init__(self, changes):
        self.changes = []
        for key, newvalue in changes:
            key = template.Variable(key)
            newvalue = template.Variable(newvalue)
            self.changes.append( (key,newvalue,) )

    def render(self, context):
        if 'request' not in context:
            raise template.TemplateSyntaxError, "request not in context"

        request = context['request']

        result = {}
        for key, newvalue in request.GET.items():
            result[key] = newvalue

        for key, newvalue in self.changes:
            key = key.resolve(context)
            newvalue = newvalue.resolve(context)
            result[key] = newvalue

        quoted = []
        for key, newvalue in result.items():
            quoted.append("%s=%s"%(urlquote(key),urlquote(newvalue)))

        return conditional_escape('?'+"&".join(quoted))

@register.tag
def url_with_param(parser, token):
    bits = token.split_contents()
    qschanges = []
    for i in bits[1:]:
        try:
            key, newvalue = i.split('=', 1);
            qschanges.append( (key,newvalue,) )
        except ValueError:
            raise template.TemplateSyntaxError, "Argument syntax wrong: should be key=value"
    return url_with_param_node(qschanges)

@register.inclusion_tag('spud/show_buttons.html', takes_context=True)
def show_list_buttons(context, web, user):
    dict = {}
    dict['buttons'] = web.get_list_buttons(user)
    return dict

@register.inclusion_tag('spud/show_buttons.html', takes_context=True)
def show_view_buttons(context, web, user, instance):
    dict = {}
    dict['buttons'] = web.get_view_buttons(user, instance)
    return dict

@register.inclusion_tag('spud/show_buttons.html', takes_context=True)
def show_object_view_buttons(context, user, instance):
    web = webs.get_web_from_object(instance)
    dict = {}
    dict['buttons'] = web.get_view_buttons(user, instance)
    return dict

@register.inclusion_tag('spud/show_buttons.html', takes_context=True)
def show_photo_buttons(context, user, web, instance, number, photo):
    dict = {}
    dict['buttons'] = web.get_photo_buttons(user, instance, number, photo)
    return dict
