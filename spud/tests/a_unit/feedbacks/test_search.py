""" Run tests on feedback search filters. """
import pytest
from django.contrib.auth import models as auth_models
from django.db.models import QuerySet
from mock import MagicMock, call

from spud import models

from ..utils import MyQ


def test_search_all():
    user = MagicMock(spec=auth_models.User)
    user.is_staff = True
    queryset = MagicMock(spec=QuerySet)

    expected_result = MagicMock(spec=QuerySet)
    (queryset
        .select_related.return_value
        .prefetch_related.return_value) = expected_result

    params = {}
    result = models.feedback.objects.get_search_queryset(
        user, queryset, params)

    chained = (
       call
       .select_related('cover_photo')
       .prefetch_related('cover_photo__photo_file_set')
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
        .filter.return_value) = expected_result

    params = {'q': ['meow']}
    result = models.feedback.objects.get_search_queryset(
        user, queryset, params)

    q = (
        MyQ(comment__icontains='meow')
        | MyQ(user__username__icontains='meow')
        | MyQ(user_name__icontains='meow')
    )
    chained = (
       call
       .select_related('cover_photo')
       .prefetch_related('cover_photo__photo_file_set')
       .filter(q)
    )
    assert queryset.mock_calls == chained.call_list()
    assert result is expected_result


@pytest.mark.django_db(transaction=True)
def test_search_children(feedbacks):
    user = MagicMock(spec=auth_models.User)
    user.is_staff = True
    queryset = MagicMock(spec=QuerySet)

    expected_result = MagicMock(spec=QuerySet)
    (queryset
        .select_related.return_value
        .prefetch_related.return_value
        .filter.return_value) = expected_result

    params = {'instance': feedbacks['Parent'].pk, 'mode': 'children'}
    result = models.feedback.objects.get_search_queryset(
        user, queryset, params)

    chained = (
       call
       .select_related('cover_photo')
       .prefetch_related('cover_photo__photo_file_set')
       .filter(parent=feedbacks['Parent'])
    )
    assert queryset.mock_calls == chained.call_list()
    assert result is expected_result


@pytest.mark.django_db(transaction=True)
def test_search_ascendants(feedbacks):
    user = MagicMock(spec=auth_models.User)
    user.is_staff = True
    queryset = MagicMock(spec=QuerySet)

    expected_result = MagicMock(spec=QuerySet)
    (queryset
        .select_related.return_value
        .prefetch_related.return_value
        .filter.return_value) = expected_result

    params = {'instance': feedbacks['Parent'].pk, 'mode': 'ascendants'}
    result = models.feedback.objects.get_search_queryset(
        user, queryset, params)

    chained = (
       call
       .select_related('cover_photo')
       .prefetch_related('cover_photo__photo_file_set')
       .filter(
           descendant_set__descendant=feedbacks['Parent'],
           descendant_set__position__gt=0)
    )
    assert queryset.mock_calls == chained.call_list()
    assert result is expected_result


@pytest.mark.django_db(transaction=True)
def test_search_descendants(feedbacks):
    user = MagicMock(spec=auth_models.User)
    user.is_staff = True
    queryset = MagicMock(spec=QuerySet)

    expected_result = MagicMock(spec=QuerySet)
    (queryset
        .select_related.return_value
        .prefetch_related.return_value
        .filter.return_value) = expected_result

    params = {'instance': feedbacks['Parent'].pk, 'mode': 'descendants'}
    result = models.feedback.objects.get_search_queryset(
        user, queryset, params)

    chained = (
       call
       .select_related('cover_photo')
       .prefetch_related('cover_photo__photo_file_set')
       .filter(
           ascendant_set__ascendant=feedbacks['Parent'],
           ascendant_set__position__gt=0)
    )
    assert queryset.mock_calls == chained.call_list()
    assert result is expected_result


def test_search_root_only():
    user = MagicMock(spec=auth_models.User)
    user.is_staff = True
    queryset = MagicMock(spec=QuerySet)

    expected_result = MagicMock(spec=QuerySet)
    (queryset
        .select_related.return_value
        .prefetch_related.return_value
        .filter.return_value) = expected_result

    params = {'root_only': True}
    result = models.feedback.objects.get_search_queryset(
        user, queryset, params)

    chained = (
       call
       .select_related('cover_photo')
       .prefetch_related('cover_photo__photo_file_set')
       .filter(parent__isnull=True)
    )
    assert queryset.mock_calls == chained.call_list()
    assert result is expected_result
