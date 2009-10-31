from spud.comments.models import CommentWithRating
from spud.comments.forms import CommentForm

def get_model():
    return CommentWithRating

def get_form():
    return CommentForm
