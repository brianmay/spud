# -*- coding: utf-8 -*- 

import pytz
import datetime

from django import template
from django.utils.safestring import mark_safe
from django.utils.http import urlquote
from django.core.urlresolvers import reverse
from django.utils.html import conditional_escape
from django.template import RequestContext

from spud.models import sex_to_string, action_to_string
from spud import webs

register = template.Library()

DOT = '.'

@register.simple_tag
def get_description(instance):
    web = webs.get_web_from_object(instance)
    return web.get_description(instance)

@register.simple_tag
def get_photo_thumb_url(photo, size):
    web = webs.photo_web()
    return mark_safe(web.get_thumb_url(photo, size))

@register.simple_tag
def get_photo_view_url(instance, size):
    web = webs.photo_web()
    return mark_safe(web.get_view_url(instance, size))

@register.simple_tag
def get_photo_edit_url(instance, size):
    web = webs.photo_web()
    return mark_safe(web.get_edit_url(instance, size))

@register.simple_tag
def photo_relation_add_url(instance):
    web = webs.photo_web()
    return mark_safe(web.photo_relation_add_url(instance))

@register.inclusion_tag('spud/show_error_list.html')
def show_error_list(error_list):
    return {
        'error_list': error_list,
    };

@register.inclusion_tag('spud/show_photo_list.html')
def show_photo_list(page_obj, web, parent, list_size, view_size):
        return {
                'page_obj': page_obj,
                'web': web,
                'parent': parent,
                'list_size': list_size,
                'view_size': view_size,
                };

def _get_url(web, instance, i, size):
    return web.photo_detail_url(instance, i, size)

def _get_thumb_url(web, instance, i, size):
    try:
        photo = web.get_photo_list(instance)[i-1]
        photo_web = webs.photo_web()
        return photo_web.get_thumb_url(photo, size)
    except IndexError, e:
        return None

@register.simple_tag
def photo_paginator_random(page_obj, web, instance, size):
    if instance is not None:
        return mark_safe(u"<a href='%s' class='relative' accesskey='r'>R</a>" % (web.photo_detail_url(instance, "random", size)))
    else:
        return mark_safe(u'')

@register.simple_tag
def photo_url_prev(page_obj, web, instance, size):
    if page_obj.number <= 1:
        return None
    else:
        return mark_safe(_get_url(web, instance, page_obj.number-1, size))

@register.simple_tag
def photo_url_next(page_obj, web, instance, size):
    if page_obj.number >= page_obj.paginator.num_pages:
        return None
    else:
        return mark_safe(_get_url(web, instance, page_obj.number+1, size))

@register.simple_tag
def photo_thumb_url_prev(page_obj, web, instance, size):
    if page_obj.number <= 1:
        return None
    else:
        return mark_safe(_get_thumb_url(web, instance, page_obj.number-1, size))

@register.simple_tag
def photo_thumb_url_next(page_obj, web, instance, size):
    if page_obj.number >= page_obj.paginator.num_pages:
        return None
    else:
        return mark_safe(_get_thumb_url(web, instance, page_obj.number+1, size))

@register.simple_tag
def photo_paginator_prev(page_obj, web, instance, size):
    if page_obj.number <= 1:
        return mark_safe(u'')
    else:
        return mark_safe(u"<a href='%s' class='relative' accesskey='p'>&lt;</a>" % (_get_url(web, instance, page_obj.number-1, size)))

@register.simple_tag
def photo_paginator_next(page_obj, web, instance, size):
    if page_obj.number >= page_obj.paginator.num_pages:
        return mark_safe(u'')
    else:
        return mark_safe(u"<a href='%s' class='relative' accesskey='n'>&gt;</a>" % (_get_url(web, instance, page_obj.number+1, size)))


@register.simple_tag
def photo_paginator_number(page_obj, web, instance, i, size):
    if i == DOT:
        return mark_safe(u'<span class="dots">... </span>')
    elif i == page_obj.number:
        return mark_safe(u'<span class="this-page">%d</span> ' % (i))
    else:
        return mark_safe(u'<a href="%s"%s>%d</a> ' % (_get_url(web, instance, i, size), (i == page_obj.paginator.num_pages and ' class="end"' or ''), i))

@register.inclusion_tag('spud/pagination.html')
def photo_pagination(page_obj, web, instance, size):
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
        'size': size,
    }

@register.simple_tag
def photo_detail_url_by_page(web, instance, page_obj, number, size):
    return web.photo_detail_url(instance, page_obj.start_index()+number, size)

@register.simple_tag
def photo_edit_url(web, instance, number, size):
    return web.photo_edit_url(instance, number, size)

@register.inclusion_tag('spud/photo_edit_buttons.html')
def photo_edit_buttons(page_obj):
        return { 'page_obj': page_obj };

@register.filter
def show_datetime(value, utc_offset):
    from_tz = pytz.utc
    to_tz = pytz.FixedOffset(utc_offset)
    to_offset =  datetime.timedelta(minutes=utc_offset)

    local = from_tz.localize(value)
    local = (local + to_offset).replace(tzinfo=to_tz)

    if utc_offset < 0:
        tz_string = "-%02d%02d"%(-utc_offset/60,-utc_offset%60)
        object_id = "%s-%02d%02d"%(local.date(),-utc_offset/60,-utc_offset%60)
    else:
        tz_string = "+%02d%02d"%(utc_offset/60,utc_offset%60)
        object_id = "%s+%02d%02d"%(local.date(),utc_offset/60,utc_offset%60)

    return mark_safe(u"<a href='%s'>%s</a> %s (%s)" % (
            reverse("date_detail",kwargs={'object_id':object_id}),
            local.date(),local.time(),tz_string))

@register.filter
def show_date(value, utc_offset):
    from_tz = pytz.utc
    to_tz = pytz.FixedOffset(utc_offset)
    to_offset =  datetime.timedelta(minutes=utc_offset)

    local = from_tz.localize(value)
    local = (local + to_offset).replace(tzinfo=to_tz)

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

@register.inclusion_tag('django_webs/show_buttons.html', takes_context=True)
def show_photo_buttons(context, user, web, instance, number, photo, size):
    dict = {}
    dict['buttons'] = web.get_photo_buttons(user, instance, number, photo, size)
    return dict

@register.inclusion_tag('spud/show_update_form.html', takes_context=True)
def show_update_form(context):
    dict = {}
    dict['update_form'] = context['update_form']
    dict['persons'] = context['persons']
    dict['albums'] = context['albums']
    dict['categorys'] = context['categorys']
    dict['places'] = context['places']
    return dict
