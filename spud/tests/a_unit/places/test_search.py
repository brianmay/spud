""" Run tests on place search filters. """
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
        .prefetch_related.return_value) = expected_result

    params = {}
    result = models.place.objects.get_search_queryset(user, queryset, params)

    chained = (
       call
       .select_related('cover_photo')
       .prefetch_related('cover_photo__photo_thumb_set')
       .prefetch_related('cover_photo__photo_video_set')
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
        .filter.return_value) = expected_result

    params = {'q': ['meow']}
    result = models.place.objects.get_search_queryset(user, queryset, params)

    q = (
        MyQ(title__icontains='meow')
        | MyQ(address__icontains='meow')
        | MyQ(address2__icontains='meow')
        | MyQ(city__icontains='meow')
        | MyQ(state__icontains='meow')
        | MyQ(country__icontains='meow')
    )
    chained = (
       call
       .select_related('cover_photo')
       .prefetch_related('cover_photo__photo_thumb_set')
       .prefetch_related('cover_photo__photo_video_set')
       .filter(q)
    )
    assert queryset.mock_calls == chained.call_list()
    assert result is expected_result


@pytest.mark.django_db(transaction=True)
def test_search_children(places):
    user = MagicMock(spec=auth_models.User)
    user.is_staff = True
    queryset = MagicMock(spec=QuerySet)

    expected_result = MagicMock(spec=QuerySet)
    (queryset
        .select_related.return_value
        .prefetch_related.return_value
        .prefetch_related.return_value
        .filter.return_value) = expected_result

    params = {'instance': places['Parent'].pk, 'mode': 'children'}
    result = models.place.objects.get_search_queryset(user, queryset, params)

    chained = (
       call
       .select_related('cover_photo')
       .prefetch_related('cover_photo__photo_thumb_set')
       .prefetch_related('cover_photo__photo_video_set')
       .filter(parent=places['Parent'])
    )
    assert queryset.mock_calls == chained.call_list()
    assert result is expected_result


@pytest.mark.django_db(transaction=True)
def test_search_ascendants(places):
    user = MagicMock(spec=auth_models.User)
    user.is_staff = True
    queryset = MagicMock(spec=QuerySet)

    expected_result = MagicMock(spec=QuerySet)
    (queryset
        .select_related.return_value
        .prefetch_related.return_value
        .prefetch_related.return_value
        .filter.return_value) = expected_result

    params = {'instance': places['Parent'].pk, 'mode': 'ascendants'}
    result = models.place.objects.get_search_queryset(user, queryset, params)

    chained = (
       call
       .select_related('cover_photo')
       .prefetch_related('cover_photo__photo_thumb_set')
       .prefetch_related('cover_photo__photo_video_set')
       .filter(
           descendant_set__descendant=places['Parent'],
           descendant_set__position__gt=0)
    )
    assert queryset.mock_calls == chained.call_list()
    assert result is expected_result


@pytest.mark.django_db(transaction=True)
def test_search_descendants(places):
    user = MagicMock(spec=auth_models.User)
    user.is_staff = True
    queryset = MagicMock(spec=QuerySet)

    expected_result = MagicMock(spec=QuerySet)
    (queryset
        .select_related.return_value
        .prefetch_related.return_value
        .prefetch_related.return_value
        .filter.return_value) = expected_result

    params = {'instance': places['Parent'].pk, 'mode': 'descendants'}
    result = models.place.objects.get_search_queryset(user, queryset, params)

    chained = (
       call
       .select_related('cover_photo')
       .prefetch_related('cover_photo__photo_thumb_set')
       .prefetch_related('cover_photo__photo_video_set')
       .filter(
           ascendant_set__ascendant=places['Parent'],
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
        .filter.return_value) = expected_result

    params = {'root_only': True}
    result = models.place.objects.get_search_queryset(user, queryset, params)

    chained = (
       call
       .select_related('cover_photo')
       .prefetch_related('cover_photo__photo_thumb_set')
       .prefetch_related('cover_photo__photo_video_set')
       .filter(parent__isnull=True)
    )
    assert queryset.mock_calls == chained.call_list()
    assert result is expected_result


@pytest.mark.django_db(transaction=True)
def test_get_by_name_parent(places):
    assert places['Parent'] == models.place.objects.get_by_name('Parent')


@pytest.mark.django_db(transaction=True)
def test_get_by_name_parent_failure(places):
    place = places['Parent']
    with pytest.raises(exceptions.NameDoesNotExist):
        assert place == models.place.objects.get_by_name('WrongParent')
    with pytest.raises(exceptions.NameDoesNotExist):
        assert place == models.place.objects.get_by_name('Parent/Parent')


@pytest.mark.django_db(transaction=True)
def test_get_by_name_child_success(places):
    place_child = places['First']
    assert place_child == models.place.objects.get_by_name('First')
    assert place_child == models.place.objects.get_by_name('Parent/First')


@pytest.mark.django_db(transaction=True)
def test_get_by_name_child_failure(places):
    place_child = places['First']
    with pytest.raises(exceptions.NameDoesNotExist):
        assert place_child == models.place.objects.get_by_name('Parent/Child')
    with pytest.raises(exceptions.NameDoesNotExist):
        assert place_child == models.place.objects.get_by_name('Child/First')
