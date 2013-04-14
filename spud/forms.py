# spud - keep track of photos
# Copyright (C) 2008-2013 Brian May
#
# This program is free software: you can redistribute it and/or modify
# it under the terms of the GNU General Public License as published by
# the Free Software Foundation, either version 3 of the License, or
# (at your option) any later version.
#
# This program is distributed in the hope that it will be useful,
# but WITHOUT ANY WARRANTY; without even the implied warranty of
# MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
# GNU General Public License for more details.
#
# You should have received a copy of the GNU General Public License
# along with this program.  If not, see <http://www.gnu.org/licenses/>.

from spud import models, fields
from django import forms
from django.conf import settings

PHOTO_ACTION = (
    ('', '----'),
    ('none', 'none'),
    ('D', 'delete'),
    ('R', 'regenerate thumbnail'),
    ('M', 'move photo'),
    ('auto', 'rotate automatic'),
    ('90', 'rotate 90 degrees clockwise'),
    ('180', 'rotate 180 degrees clockwise'),
    ('270', 'rotate 270 degrees clockwise'),
)

class photo_form(forms.ModelForm):
    photo_id = forms.IntegerField(widget=forms.HiddenInput())
    photographer = fields.select_field('person', required=False)
    location = fields.select_field('place', required=False)

    class Meta:
        model = models.photo
        fields = ('photo_id', 'title','photographer','location','view','description','comment','utc_offset','datetime','action')

class photo_update_form(forms.Form):
    updates = fields.photo_update_field(widget=forms.Textarea,required=False)

class place_form(forms.ModelForm):
    parent_place = fields.select_field('place', required=False)
    cover_photo = fields.select_field('photo', required=False)
    class Meta:
        model = models.place

class album_form(forms.ModelForm):
    parent_album = fields.select_field('album', required=False)
    cover_photo = fields.select_field('photo', required=False)
    class Meta:
        model = models.album

class category_form(forms.ModelForm):
    parent_category = fields.select_field('category', required=False)
    cover_photo = fields.select_field('photo', required=False)
    class Meta:
        model = models.category

class person_form(forms.ModelForm):
    home = fields.select_field('place', required=False)
    work = fields.select_field('place', required=False)
    father = fields.select_field('person', required=False)
    mother = fields.select_field('person', required=False)
    spouse = fields.select_field('person', required=False)
    cover_photo = fields.select_field('photo', required=False)

    class Meta:
        model = models.person

class photo_person_form(forms.ModelForm):
    person = fields.select_field('person', required=True)

    class Meta:
        model = models.photo_person

class photo_relation_form(forms.ModelForm):
    photo_1 = fields.select_field('photo', required=True)
    desc_1 = forms.CharField(required=False)
    photo_2 = fields.select_field('photo', required=True)
    desc_2 = forms.CharField(required=False)

    class Meta:
        model = models.photo_relation

class search_album_form(forms.Form):
    album = fields.select_field('album', required=True)

class search_category_form(forms.Form):
    category = fields.select_field('category', required=True)

class search_place_form(forms.Form):
    place = fields.select_field('place', required=True)

class search_person_form(forms.Form):
    person = fields.select_field('person', required=True)

class search_date_form(forms.Form):
    date = forms.DateField(required=True)

class search_form(forms.Form):
    first_date = forms.DateTimeField(required=False)
    last_date = forms.DateTimeField(required=False)
    timezone = fields.timezone_field(required=False)
    lower_rating = forms.FloatField(required=False)
    upper_rating = forms.FloatField(required=False)
    title = forms.RegexField(required=False,regex="^[A-Za-z0-9=,;!_ \'\.-]*$")
    photographer = fields.select_field('person', required=False)
    person = fields.select_multiple_field('person', required=False)
    person_none = forms.BooleanField(required=False)
    location = fields.select_field('place', required=False)
    location_descendants = forms.BooleanField(required=False)
    location_none = forms.BooleanField(required=False)
    album = fields.select_multiple_field('album', required=False)
    album_descendants = forms.BooleanField(required=False)
    album_none = forms.BooleanField(required=False)
    category = fields.select_multiple_field('category', required=False)
    category_descendants = forms.BooleanField(required=False)
    category_none = forms.BooleanField(required=False)
    action = forms.ChoiceField(required=False,choices=PHOTO_ACTION)
    path = forms.RegexField(required=False,regex="^[A-Za-z0-9=,;!_ \'\.\/-]*$")
    name = forms.RegexField(required=False,regex="^[A-Za-z0-9=,;!_ \'\.-]*$")
    camera_make = forms.CharField(required=False)
    camera_model = forms.CharField(required=False)
    first_id = forms.IntegerField(required=False)
    last_id = forms.IntegerField(required=False)

class settings_form(forms.Form):
    photos_per_page = forms.IntegerField()
    default_list_size = forms.ChoiceField(choices=settings.LIST_SIZES)
    default_view_size = forms.ChoiceField(choices=settings.VIEW_SIZES)
    default_click_size = forms.ChoiceField(choices=settings.CLICK_SIZES)
