# -*- coding: UTF-8 -*-
""" Run tests on feedback serializers. """
import pytest

from spud import models, serializers


@pytest.mark.django_db(transaction=True)
def test_serializer_encode(feedbacks, photos, photo):
    child = models.feedback.objects.create(
        cover_photo=photo,
        comment='description',
        parent=feedbacks['Parent'],
        rating=1,
        submit_datetime='2017-06-14T09:58:36',
        utc_offset=600,
    )
    serializer = serializers.FeedbackSerializer(child)

    expected = {
        'ascendants': [
            {
                'id': feedbacks['Parent'].pk,
                'cover_photo': {
                    'action': None,
                    'id': photos['Parent'].pk,
                    'title': 'Parent',
                    'description': u'Testing «ταБЬℓσ»',
                    'datetime': '2017-06-14T20:03:42',
                    'utc_offset': 600,
                    'place': None,
                    'action': None,
                    'thumbs': {},
                    'videos': {},
                },
                'cover_photo_pk': photos['Parent'].pk,
                'comment': u'Testing «ταБЬℓσ»',
                'ip_address': None,
                'is_public': True,
                'is_removed': False,
                'rating': 1,
                'submit_datetime': '2017-06-14T10:41:59',
                'user': None,
                'user_email': None,
                'user_name': None,
                'user_url': None,
                'utc_offset': 600,
            },
        ],
        'cover_photo': {
            'action': None,
            'id': photo.pk,
            'title': '',
            'description': None,
            'datetime': '2017-06-14T20:03:42',
            'utc_offset': 600,
            'place': None,
            'action': None,
            'thumbs': {},
            'videos': {},
        },
        'cover_photo_pk': photo.pk,
        'id': child.pk,
        'parent': feedbacks['Parent'].pk,
        'comment': 'description',
        'ip_address': None,
        'is_public': True,
        'is_removed': False,
        'rating': 1,
        'submit_datetime': '2017-06-14T09:58:36',
        'user': None,
        'user_email': None,
        'user_name': None,
        'user_url': None,
        'utc_offset': 600,
    }

    assert serializer.data == expected


@pytest.mark.django_db(transaction=True)
def test_serializer_decode(feedbacks, photo):
    data = {
        'cover_photo_pk': photo.pk,
        'comment': 'description',
        'id': 10,
        'parent': feedbacks['Parent'].pk,
        'rating': 1,
    }
    serializer = serializers.FeedbackSerializer(data=data)

    expected = {
        'cover_photo': photo,
        'comment': 'description',
        'parent': feedbacks['Parent'],
        'rating': 1,
    }
    assert serializer.is_valid()
    assert serializer.validated_data == expected
