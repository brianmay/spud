""" Run tests on category serializers. """
import pytest

from spud import models, serializers


@pytest.mark.django_db(transaction=True)
def test_serializer_encode(categorys):
    child = models.category.objects.create(
        cover_photo=None,
        description='description',
        parent=categorys['Parent'],
        sort_name='sort name',
        sort_order='sort order',
        title='Child',
    )
    serializer = serializers.CategorySerializer(child)

    expected = {
        'ascendants': [
            {
                'id': categorys['Parent'].pk,
                'title': 'Parent',
                'cover_photo': None,
                'cover_photo_pk': None,
            },
        ],
        'cover_photo': None,
        'cover_photo_pk': None,
        'description': 'description',
        'id': child.pk,
        'parent': categorys['Parent'].pk,
        'sort_name': 'sort name',
        'sort_order': 'sort order',
        'title': 'Child'
    }
    assert serializer.data == expected


@pytest.mark.django_db(transaction=True)
def test_serializer_decode(categorys):
    data = {
        'cover_photo_pk': None,
        'description': 'description',
        'id': 10,
        'parent': categorys['Parent'].pk,
        'sort_name': 'sort name',
        'sort_order': 'sort order',
        'title': 'Child'
    }
    serializer = serializers.CategorySerializer(data=data)

    expected = {
        'cover_photo': None,
        'description': 'description',
        'parent': categorys['Parent'],
        'sort_name': 'sort name',
        'sort_order': 'sort order',
        'title': 'Child'
    }
    assert serializer.is_valid()
    assert serializer.validated_data == expected
