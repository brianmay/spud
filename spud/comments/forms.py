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

from django import forms
from django.contrib.comments.forms import CommentForm as djangoCommentForm
from spud.comments.models import CommentWithRating

RATING_CHOICES = (
    ('6', '6 - acceptable'),
    ('7', '7 - good'),
    ('8', '8 - very good'),
    ('9', '9 - perfect'),
    ('10', '10 - sell it'),
    ('1', '1 - delete'),
    ('2', '2 - think about deleting'),
    ('3', '3 - has some value'),
    ('4', '4 - barely acceptable'),
    ('5', '5 - can\'t decide'),
)

class CommentForm(djangoCommentForm):
    rating = forms.ChoiceField(choices=RATING_CHOICES)

    def get_comment_model(self):
        # Use our custom comment model instead of the built-in one.
        return CommentWithRating

    def get_comment_create_data(self):
        # Use the data of the superclass, and add in the title field
        data = super(CommentForm, self).get_comment_create_data()
        data['rating'] = self.cleaned_data['rating']
        return data

