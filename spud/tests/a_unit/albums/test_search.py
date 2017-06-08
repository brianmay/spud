""" Run tests on album search filters. """
from django.contrib.auth import models as auth_models
from django.db.models import QuerySet

from mock import call, MagicMock, ANY
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
    result = models.album.objects.get_search_queryset(user, queryset, params)

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
    result = models.album.objects.get_search_queryset(user, queryset, params)

    q = MyQ(title__icontains='meow') | MyQ(description__icontains='meow')
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
def test_search_children(albums):
    user = MagicMock(spec=auth_models.User)
    user.is_staff = True
    queryset = MagicMock(spec=QuerySet)

    expected_result = MagicMock(spec=QuerySet)
    (queryset
        .select_related.return_value
        .prefetch_related.return_value
        .prefetch_related.return_value
        .filter.return_value) = expected_result

    params = {'instance': albums['Parent'].pk, 'mode': 'children'}
    result = models.album.objects.get_search_queryset(user, queryset, params)

    chained = (
       call
       .select_related('cover_photo')
       .prefetch_related('cover_photo__photo_thumb_set')
       .prefetch_related('cover_photo__photo_video_set')
       .filter(parent=albums['Parent'])
    )
    assert queryset.mock_calls == chained.call_list()
    assert result is expected_result


@pytest.mark.django_db(transaction=True)
def test_search_ascendants(albums):
    user = MagicMock(spec=auth_models.User)
    user.is_staff = True
    queryset = MagicMock(spec=QuerySet)

    expected_result = MagicMock(spec=QuerySet)
    (queryset
        .select_related.return_value
        .prefetch_related.return_value
        .prefetch_related.return_value
        .filter.return_value) = expected_result

    params = {'instance': albums['Parent'].pk, 'mode': 'ascendants'}
    result = models.album.objects.get_search_queryset(user, queryset, params)

    chained = (
       call
       .select_related('cover_photo')
       .prefetch_related('cover_photo__photo_thumb_set')
       .prefetch_related('cover_photo__photo_video_set')
       .filter(
           descendant_set__descendant=albums['Parent'],
           descendant_set__position__gt=0)
    )
    assert queryset.mock_calls == chained.call_list()
    assert result is expected_result


@pytest.mark.django_db(transaction=True)
def test_search_descendants(albums):
    user = MagicMock(spec=auth_models.User)
    user.is_staff = True
    queryset = MagicMock(spec=QuerySet)

    expected_result = MagicMock(spec=QuerySet)
    (queryset
        .select_related.return_value
        .prefetch_related.return_value
        .prefetch_related.return_value
        .filter.return_value) = expected_result

    params = {'instance': albums['Parent'].pk, 'mode': 'descendants'}
    result = models.album.objects.get_search_queryset(user, queryset, params)

    chained = (
       call
       .select_related('cover_photo')
       .prefetch_related('cover_photo__photo_thumb_set')
       .prefetch_related('cover_photo__photo_video_set')
       .filter(
           ascendant_set__ascendant=albums['Parent'],
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
    result = models.album.objects.get_search_queryset(user, queryset, params)

    chained = (
       call
       .select_related('cover_photo')
       .prefetch_related('cover_photo__photo_thumb_set')
       .prefetch_related('cover_photo__photo_video_set')
       .filter(parent__isnull=True)
    )
    assert queryset.mock_calls == chained.call_list()
    assert result is expected_result


def test_search_needs_revision():
    user = MagicMock(spec=auth_models.User)
    user.is_staff = True
    queryset = MagicMock(spec=QuerySet)

    expected_result = MagicMock(spec=QuerySet)
    (queryset
        .select_related.return_value
        .prefetch_related.return_value
        .prefetch_related.return_value
        .filter.return_value
        .annotate.return_value
        .order_by.return_value) = expected_result

    params = {'needs_revision': True}
    result = models.album.objects.get_search_queryset(user, queryset, params)

    chained = (
       call
       .select_related('cover_photo')
       .prefetch_related('cover_photo__photo_thumb_set')
       .prefetch_related('cover_photo__photo_video_set')
       .filter(MyQ(revised__lt=ANY) | MyQ(revised__isnull=True))
       .annotate(null_revised=ANY)
       .order_by('null_revised', 'revised', '-pk')
    )
    assert queryset.mock_calls == chained.call_list()
    assert result is expected_result


@pytest.mark.django_db(transaction=True)
def test_get_by_name_parent(albums):
    assert albums['Parent'] == models.album.objects.get_by_name('Parent')


@pytest.mark.django_db(transaction=True)
def test_get_by_name_parent_failure(albums):
    album = albums['Parent']
    with pytest.raises(exceptions.NameDoesNotExist):
        assert album == models.album.objects.get_by_name('WrongParent')
    with pytest.raises(exceptions.NameDoesNotExist):
        assert album == models.album.objects.get_by_name('Parent/Parent')


@pytest.mark.django_db(transaction=True)
def test_get_by_name_child_success(albums):
    album_child = albums['First']
    assert album_child == models.album.objects.get_by_name('First')
    assert album_child == models.album.objects.get_by_name('Parent/First')


@pytest.mark.django_db(transaction=True)
def test_get_by_name_child_failure(albums):
    album_child = albums['First']
    with pytest.raises(exceptions.NameDoesNotExist):
        assert album_child == models.album.objects.get_by_name('Parent/Child')
    with pytest.raises(exceptions.NameDoesNotExist):
        assert album_child == models.album.objects.get_by_name('Child/First')
