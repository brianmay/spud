from spud import models, fields
from django import forms
from ajax_select.fields import AutoCompleteSelectMultipleField, AutoCompleteSelectField

PHOTO_STATUS = (
    ('','none'),
    ('D', 'delete'),
    ('R', 'review'),
    ('K', 'keep'),
)

PHOTO_ROTATE = (
    ('','none'),
    ('auto', 'automatic'),
    ('90', '90 degrees clockwise'),
    ('180', '180 degrees clockwise'),
    ('270', '270 degrees clockwise'),
)

class photo_form(forms.ModelForm):
    photographer = AutoCompleteSelectField('person', required=False)
    location = AutoCompleteSelectField('place', required=False)

    class Meta:
        model = models.photo
        fields = ('title','photographer','location','view','description','comment','timezone','datetime','status')

class photo_extra_form(forms.Form):
    photo_id = forms.IntegerField(widget=forms.HiddenInput())
    albums = AutoCompleteSelectMultipleField('album', required=False)
    categorys = AutoCompleteSelectMultipleField('category', required=False)
    rotate = forms.ChoiceField(required=False,choices=PHOTO_ROTATE)

class place_form(forms.ModelForm):
    parent_place = AutoCompleteSelectField('place', required=False)
    class Meta:
        model = models.place
        exclude = ('coverphoto')

class album_form(forms.ModelForm):
    parent_album = AutoCompleteSelectField('album', required=False)
    class Meta:
        model = models.album
        exclude = ('coverphoto')

class category_form(forms.ModelForm):
    parent_category = AutoCompleteSelectField('category', required=False)
    class Meta:
        model = models.category
        exclude = ('coverphoto')

class person_form(forms.ModelForm):
    home = AutoCompleteSelectField('place', required=False)
    work = AutoCompleteSelectField('place', required=False)
    father = AutoCompleteSelectField('person', required=False)
    mother = AutoCompleteSelectField('person', required=False)
    spouse = AutoCompleteSelectField('person', required=False)

    class Meta:
        model = models.person
        exclude = ('coverphoto')

class photo_person_form(forms.ModelForm):
    person = AutoCompleteSelectField('person', required=True)

    class Meta:
        model = models.photo_person

class photo_relation_form(forms.ModelForm):
    photo_1 = fields.photo_field()
    desc_1 = forms.CharField(required=False)
    photo_2 = fields.photo_field()
    desc_2 = forms.CharField(required=False)

    class Meta:
        model = models.photo_relation

class search_person_form(forms.Form):
    person = AutoCompleteSelectField('person', required=True)

class search_date_form(forms.Form):
    date = forms.DateField(required=True)

class search_form(forms.Form):
    first_date = forms.DateField(required=False)
    last_date = forms.DateField(required=False)
    lower_rating = forms.FloatField(required=False)
    upper_rating = forms.FloatField(required=False)
    title = forms.CharField(required=False)
    photographer = AutoCompleteSelectField('person', required=False)
    person = AutoCompleteSelectMultipleField('person', required=False)
    location = AutoCompleteSelectField('place', required=False)
    location_descendants = forms.BooleanField(required=False)
    album = AutoCompleteSelectMultipleField('album', required=False)
    album_descendants = forms.BooleanField(required=False)
    category = AutoCompleteSelectMultipleField('category', required=False)
    category_descendants = forms.BooleanField(required=False)
    status = forms.ChoiceField(required=False,choices=PHOTO_STATUS)
    path = forms.CharField(required=False)
    name = forms.CharField(required=False)

class queer_form(forms.ModelForm):
    update_photographer = AutoCompleteSelectField('person', required=False)
    update_location = AutoCompleteSelectField('place', required=False)
    add_albums = AutoCompleteSelectMultipleField('album', required=False)
    delete_albums = AutoCompleteSelectMultipleField('album', required=False)
    add_categorys = AutoCompleteSelectMultipleField('category', required=False)
    delete_categorys = AutoCompleteSelectMultipleField('category', required=False)
    add_persons = AutoCompleteSelectMultipleField('person', required=False)
    delete_persons = AutoCompleteSelectMultipleField('person', required=False)

    class Meta:
        model = models.queer

