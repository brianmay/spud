""" Run tests on person serializers. """
import pytest

from spud import models, serializers


@pytest.mark.django_db(transaction=True)
def test_serializer_encode(persons):
    child = models.person.objects.create(
        cover_photo=None,
        mother=persons['Parent'],
        first_name='Child',
    )
    serializer = serializers.PersonSerializer(child)

    expected = {
        'ascendants': [
            {
                'id': persons['Parent'].pk,
                'title': 'Parent',
                'cover_photo': None,
                'cover_photo_pk': None,
            },
        ],
        'cover_photo': None,
        'cover_photo_pk': None,
        'id': child.pk,
        'mother': {
            'id': persons['Parent'].pk,
            'title': 'Parent',
            'cover_photo': None,
            'cover_photo_pk': None,
        },
        'parents': [
            {
                'id': persons['Parent'].pk,
                'title': 'Parent',
                'cover_photo': None,
                'cover_photo_pk': None,
            }
        ],
        'first_name': 'Child',
        'called': None,
        'children': [],
        'cousins': [],
        'dob': None,
        'dod': None,
        'email': None,
        'father': None,
        'father_pk': None,
        'grandchildren': [],
        'grandparents': [],
        'home': None,
        'home_pk': None,
        'last_name': None,
        'middle_name': None,
        'mother_pk': persons['Parent'].pk,
        'nephews_nieces': [],
        'notes': None,
        'sex': None,
        'siblings': [
            {
                'id': persons['First'].pk,
                'title': 'First',
                'cover_photo': None,
                'cover_photo_pk': None,
            },
            {
                'id': persons['Second'].pk,
                'title': 'Second',
                'cover_photo': None,
                'cover_photo_pk': None,
            },
        ],
        'spouse': None,
        'spouse_pk': None,
        'spouses': [],
        'title': 'Child',
        'uncles_aunts': [],
        'work': None,
        'work_pk': None
    }

    assert serializer.data == expected


@pytest.mark.django_db(transaction=True)
def test_serializer_decode(persons):
    data = {
        'cover_photo_pk': None,
        'description': 'description',
        'id': 10,
        'mother_pk': persons['Parent'].pk,
        'first_name': 'Child'
    }
    serializer = serializers.PersonSerializer(data=data)

    expected = {
        'cover_photo': None,
        'mother': persons['Parent'],
        'first_name': 'Child'
    }
    serializer.is_valid()
    print(serializer.errors)
    assert serializer.is_valid()
    assert serializer.validated_data == expected
