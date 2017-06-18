""" Run tests on album serializers. """
import datetime

import pytest

from spud import models, serializers


@pytest.mark.django_db(transaction=True)
def test_serializer_encode(albums):
    child = models.album.objects.create(
        cover_photo=None,
        description='description',
        parent=albums['Parent'],
        revised='2010-01-01 12:00:00',
        revised_utc_offset=600,
        sort_name='sort name',
        sort_order='sort order',
        title='Child',
    )
    serializer = serializers.AlbumSerializer(child)

    expected = {
        'ascendants': [
            {
                'id': albums['Parent'].pk,
                'title': 'Parent',
                'cover_photo': None,
                'cover_photo_pk': None,
            },
        ],
        'cover_photo': None,
        'cover_photo_pk': None,
        'description': 'description',
        'id': child.pk,
        'parent': albums['Parent'].pk,
        'revised': '2010-01-01 12:00:00',
        'revised_utc_offset': 600,
        'sort_name': 'sort name',
        'sort_order': 'sort order',
        'title': 'Child'
    }
    assert serializer.data == expected


@pytest.mark.django_db(transaction=True)
def test_serializer_decode(albums):
    data = {
        'cover_photo_pk': None,
        'description': 'description',
        'id': 10,
        'parent': albums['Parent'].pk,
        'revised': '2010-01-01 12:00:00',
        'revised_utc_offset': 600,
        'sort_name': 'sort name',
        'sort_order': 'sort order',
        'title': 'Child'
    }
    serializer = serializers.AlbumSerializer(data=data)

    expected = {
        'cover_photo': None,
        'description': 'description',
        'parent': albums['Parent'],
        'revised': datetime.datetime(2010, 1, 1, 12, 0),
        'revised_utc_offset': 600,
        'sort_name': 'sort name',
        'sort_order': 'sort order',
        'title': 'Child'
    }
    assert serializer.is_valid()
    assert serializer.validated_data == expected
