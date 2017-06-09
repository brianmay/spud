""" Run tests on place serializers. """
import pytest

from spud import models, serializers


@pytest.mark.django_db(transaction=True)
def test_serializer_encode(places):
    child = models.place.objects.create(
        cover_photo=None,
        parent=places['Parent'],
        title='Jonathan B Blaxcell',
        address='PO Box 1234',
        address2='16 Bayfield Street',
        city='Little Swanport',
        country='Australia',
        notes='My God it is a fake!',
        postcode='7190',
        state='Tasmania',
        url='http://www.fakeaddressgenerator.com/World/au_address_generator',
        urldesc='Fake Address',
    )
    serializer = serializers.PlaceSerializer(child)

    expected = {
        'ascendants': [
            {
                'id': places['Parent'].pk,
                'title': 'Parent',
                'cover_photo': None,
                'cover_photo_pk': None,
            },
        ],
        'cover_photo': None,
        'cover_photo_pk': None,
        'id': child.pk,
        'parent': places['Parent'].pk,
        'title': 'Jonathan B Blaxcell',
        'address': 'PO Box 1234',
        'address2': '16 Bayfield Street',
        'city': 'Little Swanport',
        'country': 'Australia',
        'notes': 'My God it is a fake!',
        'postcode': '7190',
        'state': 'Tasmania',
        'url':
            'http://www.fakeaddressgenerator.com/World/au_address_generator',
        'urldesc': 'Fake Address',
    }
    assert serializer.data == expected


@pytest.mark.django_db(transaction=True)
def test_serializer_decode(places):
    data = {
        'cover_photo_pk': None,
        'id': 10,
        'parent': places['Parent'].pk,
        'title': 'Jonathan B Blaxcell',
        'address': 'PO Box 1234',
        'address2': '16 Bayfield Street',
        'city': 'Little Swanport',
        'country': 'Australia',
        'notes': 'My God it is a fake!',
        'postcode': '7190',
        'state': 'Tasmania',
        'url':
            'http://www.fakeaddressgenerator.com/World/au_address_generator',
        'urldesc': 'Fake Address',
    }
    serializer = serializers.PlaceSerializer(data=data)

    expected = {
        'cover_photo': None,
        'parent': places['Parent'],
        'title': 'Jonathan B Blaxcell',
        'address': 'PO Box 1234',
        'address2': '16 Bayfield Street',
        'city': 'Little Swanport',
        'country': 'Australia',
        'notes': 'My God it is a fake!',
        'postcode': '7190',
        'state': 'Tasmania',
        'url':
            'http://www.fakeaddressgenerator.com/World/au_address_generator',
        'urldesc': 'Fake Address',
    }
    assert serializer.is_valid()
    assert serializer.validated_data == expected
