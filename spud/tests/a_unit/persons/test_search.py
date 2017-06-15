""" Run tests on person search filters. """
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
        .select_related.return_value) = expected_result

    params = {}
    result = models.person.objects.get_search_queryset(
        user, queryset, params, 'detail')

    chained = (
       call
       .select_related('cover_photo')
       .prefetch_related('cover_photo__photo_thumb_set')
       .prefetch_related('cover_photo__photo_video_set')
       .select_related('mother', 'father', 'spouse', 'home', 'work')
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
        .select_related.return_value
        .filter.return_value) = expected_result

    params = {'q': ['meow']}
    result = models.person.objects.get_search_queryset(
        user, queryset, params, 'detail')

    q = (
        MyQ(first_name__icontains='meow')
        | MyQ(middle_name__icontains='meow')
        | MyQ(last_name__icontains='meow')
        | MyQ(called__icontains='meow')
    )
    chained = (
       call
       .select_related('cover_photo')
       .prefetch_related('cover_photo__photo_thumb_set')
       .prefetch_related('cover_photo__photo_video_set')
       .select_related('mother', 'father', 'spouse', 'home', 'work')
       .filter(q)
    )
    assert queryset.mock_calls == chained.call_list()
    assert result is expected_result


@pytest.mark.django_db(transaction=True)
def test_search_children(persons):
    user = MagicMock(spec=auth_models.User)
    user.is_staff = True
    queryset = MagicMock(spec=QuerySet)

    expected_result = MagicMock(spec=QuerySet)
    (queryset
        .select_related.return_value
        .prefetch_related.return_value
        .prefetch_related.return_value
        .select_related.return_value
        .filter.return_value) = expected_result

    params = {'instance': persons['Parent'].pk, 'mode': 'children'}
    result = models.person.objects.get_search_queryset(
        user, queryset, params, 'detail')

    chained = (
       call
       .select_related('cover_photo')
       .prefetch_related('cover_photo__photo_thumb_set')
       .prefetch_related('cover_photo__photo_video_set')
       .select_related('mother', 'father', 'spouse', 'home', 'work')
       .filter(MyQ(mother=persons['Parent']) | MyQ(father=persons['Parent']))
    )
    assert queryset.mock_calls == chained.call_list()
    assert result is expected_result


@pytest.mark.django_db(transaction=True)
def test_search_ascendants(persons):
    user = MagicMock(spec=auth_models.User)
    user.is_staff = True
    queryset = MagicMock(spec=QuerySet)

    expected_result = MagicMock(spec=QuerySet)
    (queryset
        .select_related.return_value
        .prefetch_related.return_value
        .prefetch_related.return_value
        .select_related.return_value
        .filter.return_value) = expected_result

    params = {'instance': persons['Parent'].pk, 'mode': 'ascendants'}
    result = models.person.objects.get_search_queryset(
        user, queryset, params, 'detail')

    chained = (
       call
       .select_related('cover_photo')
       .prefetch_related('cover_photo__photo_thumb_set')
       .prefetch_related('cover_photo__photo_video_set')
       .select_related('mother', 'father', 'spouse', 'home', 'work')
       .filter(
           descendant_set__descendant=persons['Parent'],
           descendant_set__position__gt=0)
    )
    assert queryset.mock_calls == chained.call_list()
    assert result is expected_result


@pytest.mark.django_db(transaction=True)
def test_search_descendants(persons):
    user = MagicMock(spec=auth_models.User)
    user.is_staff = True
    queryset = MagicMock(spec=QuerySet)

    expected_result = MagicMock(spec=QuerySet)
    (queryset
        .select_related.return_value
        .prefetch_related.return_value
        .prefetch_related.return_value
        .select_related.return_value
        .filter.return_value) = expected_result

    params = {'instance': persons['Parent'].pk, 'mode': 'descendants'}
    result = models.person.objects.get_search_queryset(
        user, queryset, params, 'detail')

    chained = (
       call
       .select_related('cover_photo')
       .prefetch_related('cover_photo__photo_thumb_set')
       .prefetch_related('cover_photo__photo_video_set')
       .select_related('mother', 'father', 'spouse', 'home', 'work')
       .filter(
           ascendant_set__ascendant=persons['Parent'],
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
        .prefetch_related.return_value
        .select_related.return_value
        .filter.return_value) = expected_result

    params = {'root_only': True}
    result = models.person.objects.get_search_queryset(
        user, queryset, params, 'detail')

    chained = (
       call
       .select_related('cover_photo')
       .prefetch_related('cover_photo__photo_thumb_set')
       .prefetch_related('cover_photo__photo_video_set')
       .select_related('mother', 'father', 'spouse', 'home', 'work')
       .filter(mother__isnull=True, father__isnull=True)
    )
    assert queryset.mock_calls == chained.call_list()
    assert result is expected_result


@pytest.mark.django_db(transaction=True)
def test_get_by_name_parent(persons):
    assert persons['Parent'] == models.person.objects.get_by_name('Parent')


@pytest.mark.django_db(transaction=True)
def test_get_by_name_parent_failure(persons):
    person = persons['Parent']
    with pytest.raises(exceptions.NameDoesNotExist):
        assert person == models.person.objects.get_by_name('WrongParent')
    with pytest.raises(exceptions.NameDoesNotExist):
        assert person == models.person.objects.get_by_name('Parent/Parent')


@pytest.mark.django_db(transaction=True)
def test_get_by_name_child_success(persons):
    person_child = persons['First']
    assert person_child == models.person.objects.get_by_name('First')
    assert person_child == models.person.objects.get_by_name(
        'Parent/First')


@pytest.mark.django_db(transaction=True)
def test_get_by_name_child_failure(persons):
    person_child = persons['First']
    with pytest.raises(exceptions.NameDoesNotExist):
        assert person_child == models.person.objects.get_by_name(
            'Parent/Child')
    with pytest.raises(exceptions.NameDoesNotExist):
        assert person_child == models.person.objects.get_by_name(
            'Child/First')
