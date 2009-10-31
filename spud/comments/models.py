from django.db import models
from django.contrib.comments.models import Comment

class CommentWithRating(Comment):
    rating = models.IntegerField()

