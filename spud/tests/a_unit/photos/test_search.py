""" Run tests on photo search filters. """
from django.contrib.auth import models as auth_models
from django.db.models import QuerySet

from mock import call, MagicMock
import pytest

from spud import models, exceptions
from ..utils import MyQ


def test_search_all():
    user = MagicMock(spec=auth_models.User)
    user.is_staff = True
    queryset = MagicMock(spec=QuerySet)

    expected_result = MagicMock(spec=QuerySet)
    (queryset
        .select_related.return_value
        .prefetch_related.return_value
        .prefetch_related.return_value
        .prefetch_related.return_value
        .prefetch_related.return_value
        .prefetch_related.return_value
        .prefetch_related.return_value
        .prefetch_related.return_value
        .prefetch_related.return_value
        .prefetch_related.return_value
        .prefetch_related.return_value
        .prefetch_related.return_value
        .prefetch_related.return_value
        .prefetch_related.return_value
        .prefetch_related.return_value
        .prefetch_related.return_value
        .prefetch_related.return_value
        .prefetch_related.return_value
        .prefetch_related.return_value
        .prefetch_related.return_value
        .filter.return_value
        .filter.return_value) = expected_result

    params = {}
    result = models.photo.objects.get_search_queryset(
        user, queryset, params, 'detail')

    chained = (
       call
       .select_related('place')
       .prefetch_related('photo_thumb_set')
       .prefetch_related('photo_video_set')
       .prefetch_related('place__cover_photo')
       .prefetch_related('place__cover_photo__photo_thumb_set')
       .prefetch_related('place__cover_photo__photo_video_set')
       .prefetch_related('feedbacks')
       .prefetch_related('albums')
       .prefetch_related('albums__cover_photo')
       .prefetch_related('albums__cover_photo__photo_thumb_set')
       .prefetch_related('albums__cover_photo__photo_video_set')
       .prefetch_related('categorys')
       .prefetch_related('categorys__cover_photo')
       .prefetch_related('categorys__cover_photo__photo_thumb_set')
       .prefetch_related('categorys__cover_photo__photo_video_set')
       .prefetch_related('photo_person_set')
       .prefetch_related('photo_person_set__person')
       .prefetch_related('photo_person_set__person__cover_photo')
       .prefetch_related(
           'photo_person_set__person__cover_photo__photo_thumb_set')
       .prefetch_related(
           'photo_person_set__person__cover_photo__photo_video_set')
       .filter(MyQ())
       .filter(MyQ())
    )
    assert queryset.mock_calls == chained.call_list()
    assert result is expected_result


def test_search_q():
    user = MagicMock(spec=auth_models.User)
    user.is_staff = True
    queryset = MagicMock(spec=QuerySet)

    expected_result = MagicMock(spec=QuerySet)
    (queryset
        .select_related.return_value
        .prefetch_related.return_value
        .prefetch_related.return_value
        .prefetch_related.return_value
        .prefetch_related.return_value
        .prefetch_related.return_value
        .prefetch_related.return_value
        .prefetch_related.return_value
        .prefetch_related.return_value
        .prefetch_related.return_value
        .prefetch_related.return_value
        .prefetch_related.return_value
        .prefetch_related.return_value
        .prefetch_related.return_value
        .prefetch_related.return_value
        .prefetch_related.return_value
        .prefetch_related.return_value
        .prefetch_related.return_value
        .prefetch_related.return_value
        .prefetch_related.return_value
        .filter.return_value
        .filter.return_value
        .filter.return_value) = expected_result

    params = {'q': ['meow']}
    result = models.photo.objects.get_search_queryset(
        user, queryset, params, 'detail')

    q = (
        MyQ(name__icontains='meow')
        | MyQ(title__icontains='meow')
        | MyQ(description__icontains='meow')
    )
    chained = (
       call
       .select_related('place')
       .prefetch_related('photo_thumb_set')
       .prefetch_related('photo_video_set')
       .prefetch_related('place__cover_photo')
       .prefetch_related('place__cover_photo__photo_thumb_set')
       .prefetch_related('place__cover_photo__photo_video_set')
       .prefetch_related('feedbacks')
       .prefetch_related('albums')
       .prefetch_related('albums__cover_photo')
       .prefetch_related('albums__cover_photo__photo_thumb_set')
       .prefetch_related('albums__cover_photo__photo_video_set')
       .prefetch_related('categorys')
       .prefetch_related('categorys__cover_photo')
       .prefetch_related('categorys__cover_photo__photo_thumb_set')
       .prefetch_related('categorys__cover_photo__photo_video_set')
       .prefetch_related('photo_person_set')
       .prefetch_related('photo_person_set__person')
       .prefetch_related('photo_person_set__person__cover_photo')
       .prefetch_related(
           'photo_person_set__person__cover_photo__photo_thumb_set')
       .prefetch_related(
           'photo_person_set__person__cover_photo__photo_video_set')
       .filter(MyQ())
       .filter(MyQ())
       .filter(q)
    )
    assert queryset.mock_calls == chained.call_list()
    assert result is expected_result


@pytest.mark.django_db(transaction=True)
def test_search_related(photos):
    user = MagicMock(spec=auth_models.User)
    user.is_staff = True
    queryset = MagicMock(spec=QuerySet)

    expected_result = MagicMock(spec=QuerySet)
    (queryset
        .select_related.return_value
        .prefetch_related.return_value
        .prefetch_related.return_value
        .prefetch_related.return_value
        .prefetch_related.return_value
        .prefetch_related.return_value
        .prefetch_related.return_value
        .prefetch_related.return_value
        .prefetch_related.return_value
        .prefetch_related.return_value
        .prefetch_related.return_value
        .prefetch_related.return_value
        .prefetch_related.return_value
        .prefetch_related.return_value
        .prefetch_related.return_value
        .prefetch_related.return_value
        .prefetch_related.return_value
        .prefetch_related.return_value
        .prefetch_related.return_value
        .prefetch_related.return_value
        .filter.return_value
        .filter.return_value
        .filter.return_value
        .distinct.return_value) = expected_result

    params = {'instance': photos['Parent'].pk, 'mode': 'children'}
    result = models.photo.objects.get_search_queryset(
        user, queryset, params, 'detail')

    chained = (
       call
       .select_related('place')
       .prefetch_related('photo_thumb_set')
       .prefetch_related('photo_video_set')
       .prefetch_related('place__cover_photo')
       .prefetch_related('place__cover_photo__photo_thumb_set')
       .prefetch_related('place__cover_photo__photo_video_set')
       .prefetch_related('feedbacks')
       .prefetch_related('albums')
       .prefetch_related('albums__cover_photo')
       .prefetch_related('albums__cover_photo__photo_thumb_set')
       .prefetch_related('albums__cover_photo__photo_video_set')
       .prefetch_related('categorys')
       .prefetch_related('categorys__cover_photo')
       .prefetch_related('categorys__cover_photo__photo_thumb_set')
       .prefetch_related('categorys__cover_photo__photo_video_set')
       .prefetch_related('photo_person_set')
       .prefetch_related('photo_person_set__person')
       .prefetch_related('photo_person_set__person__cover_photo')
       .prefetch_related(
           'photo_person_set__person__cover_photo__photo_thumb_set')
       .prefetch_related(
           'photo_person_set__person__cover_photo__photo_video_set')
       .filter(MyQ())
       .filter(MyQ())
       .filter(
           MyQ(relations_1__photo_2=photos['Parent'])
           | MyQ(relations_2__photo_1=photos['Parent']))
       .distinct()
    )
    assert queryset.mock_calls == chained.call_list()
    assert result is expected_result


@pytest.mark.django_db(transaction=True)
def test_get_by_name_parent(photos):
    assert photos['Parent'] == models.photo.objects.get_by_name('Parent')


@pytest.mark.django_db(transaction=True)
def test_get_by_name_parent_failure(photos):
    photo = photos['Parent']
    with pytest.raises(exceptions.NameDoesNotExist):
        assert photo == models.photo.objects.get_by_name('WrongParent')


@pytest.mark.django_db(transaction=True)
def test_get_by_name_child_success(photos):
    photo_child = photos['First']
    assert photo_child == models.photo.objects.get_by_name('First')
