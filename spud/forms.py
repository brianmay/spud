from spud import models, fields
from django import forms
from ajax_select.fields import AutoCompleteSelectMultipleField, AutoCompleteSelectField

PHOTO_ACTION = (
    ('', '----'),
    ('none', 'none'),
    ('D', 'delete'),
    ('R', 'regenerate thumbnail'),
    ('M', 'move photo'),
    ('AUTO', 'rotate automatic'),
    ('90', 'rotate 90 degrees clockwise'),
    ('180', 'rotate 180 degrees clockwise'),
    ('270', 'rotate 270 degrees clockwise'),
)

class photo_form(forms.ModelForm):
    photographer = AutoCompleteSelectField('person', required=False)
    location = AutoCompleteSelectField('place', required=False)

    class Meta:
        model = models.photo
        fields = ('title','photographer','location','view','description','comment','timezone','datetime','action')

class photo_extra_form(forms.Form):
    photo_id = forms.IntegerField(widget=forms.HiddenInput())
    updates = fields.photo_update_field(widget=forms.Textarea,required=False)

class place_form(forms.ModelForm):
    parent_place = AutoCompleteSelectField('place', required=False)
    coverphoto = AutoCompleteSelectField('photo', required=False)
    class Meta:
        model = models.place

class album_form(forms.ModelForm):
    parent_album = AutoCompleteSelectField('album', required=False)
    coverphoto = AutoCompleteSelectField('photo', required=False)
    class Meta:
        model = models.album

class category_form(forms.ModelForm):
    parent_category = AutoCompleteSelectField('category', required=False)
    coverphoto = AutoCompleteSelectField('photo', required=False)
    class Meta:
        model = models.category

class person_form(forms.ModelForm):
    home = AutoCompleteSelectField('place', required=False)
    work = AutoCompleteSelectField('place', required=False)
    father = AutoCompleteSelectField('person', required=False)
    mother = AutoCompleteSelectField('person', required=False)
    spouse = AutoCompleteSelectField('person', required=False)
    coverphoto = AutoCompleteSelectField('photo', required=False)

    class Meta:
        model = models.person

class photo_person_form(forms.ModelForm):
    person = AutoCompleteSelectField('person', required=True)

    class Meta:
        model = models.photo_person

class photo_relation_form(forms.ModelForm):
    photo_1 = AutoCompleteSelectField('photo', required=False)
    desc_1 = forms.CharField(required=False)
    photo_2 = AutoCompleteSelectField('photo', required=False)
    desc_2 = forms.CharField(required=False)

    class Meta:
        model = models.photo_relation

class search_album_form(forms.Form):
    album = AutoCompleteSelectField('album', required=True)

class search_category_form(forms.Form):
    category = AutoCompleteSelectField('category', required=True)

class search_place_form(forms.Form):
    place = AutoCompleteSelectField('place', required=True)

class search_person_form(forms.Form):
    person = AutoCompleteSelectField('person', required=True)

class search_date_form(forms.Form):
    date = forms.DateField(required=True)

class search_form(forms.Form):
    first_date = forms.DateField(required=False)
    last_date = forms.DateField(required=False)
    lower_rating = forms.FloatField(required=False)
    upper_rating = forms.FloatField(required=False)
    title = forms.RegexField(required=False,regex="^[A-Za-z0-9=,;!_ \'\.-]*$")
    photographer = AutoCompleteSelectField('person', required=False)
    person = AutoCompleteSelectMultipleField('person', required=False)
    person_none = forms.BooleanField(required=False)
    location = AutoCompleteSelectField('place', required=False)
    location_descendants = forms.BooleanField(required=False)
    location_none = forms.BooleanField(required=False)
    album = AutoCompleteSelectMultipleField('album', required=False)
    album_descendants = forms.BooleanField(required=False)
    album_none = forms.BooleanField(required=False)
    category = AutoCompleteSelectMultipleField('category', required=False)
    category_descendants = forms.BooleanField(required=False)
    category_none = forms.BooleanField(required=False)
    action = forms.ChoiceField(required=False,choices=PHOTO_ACTION)
    path = forms.RegexField(required=False,regex="^[A-Za-z0-9=,;!_ \'\.\/-]*$")
    name = forms.RegexField(required=False,regex="^[A-Za-z0-9=,;!_ \'\.-]*$")
    camera_make = forms.CharField(required=False)
    camera_model = forms.CharField(required=False)

