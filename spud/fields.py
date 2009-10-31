from django import forms
from django.forms.util import ValidationError

from spud import models

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
