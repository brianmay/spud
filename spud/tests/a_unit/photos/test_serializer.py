# -*- coding: UTF-8 -*-
""" Run tests on photo serializers. """
import datetime
from mock import ANY

import pytest

from spud import models, serializers


@pytest.mark.django_db(transaction=True)
def test_serializer_encode(photos):
    child = models.photo.objects.create(
        description=u'description «ταБЬℓσ»',
        title=u'Child «ταБЬℓσ»',
        utc_offset=600,
        datetime="2015-11-22T12:00:00",
        level=10,
    )
    serializer = serializers.PhotoSerializer(child)

    expected = {
        'description': u'description «ταБЬℓσ»',
        'id': child.pk,
        'title': u'Child «ταБЬℓσ»',
        'action': None,
        'albums': [],
        'albums_pk': [],
        'aperture': None,
        'camera_make': None,
        'camera_model': None,
        'categorys': [],
        'categorys_pk': [],
        'ccd_width': None,
        'comment': None,
        'compression': None,
        'datetime': '2015-11-22T12:00:00',
        'exposure': None,
        'feedbacks': [],
        'flash_used': None,
        'focal_length': None,
        'focus_dist': None,
        'iso_equiv': None,
        'level': 10,
        'metering_mode': None,
        'name': '',
        'orig_url': '/images/orig/',
        'path': '',
        'persons': [],
        'persons_pk': [],
        'photographer': None,
        'photographer_pk': None,
        'place': None,
        'place_pk': None,
        'rating': None,
        'relations': [],
        'size': None,
        'thumbs': {},
        'timestamp': ANY,
        'utc_offset': 600,
        'videos': {},
        'view': None,
    }
    assert serializer.data == expected


@pytest.mark.django_db(transaction=True)
def test_serializer_decode(photos):
    data = {
        'cover_photo_pk': None,
        'description': u'description «ταБЬℓσ»',
        'id': 10,
        'title': u'Child «ταБЬℓσ»',
        'utc_offset': 600,
        'datetime': '2015-11-22T12:00:00',
        'level': 5,
    }
    serializer = serializers.PhotoSerializer(data=data)

    expected = {
        'description': u'description «ταБЬℓσ»',
        'title': u'Child «ταБЬℓσ»',
        'add_persons_pk': None,
        'datetime': datetime.datetime(2015, 11, 22, 12, 0),
        'level': 5,
        'photo_person_set': None,
        'rem_persons_pk': None,
        'utc_offset': 600,
    }
    serializer.is_valid()
    print(serializer.errors)
    assert serializer.is_valid()
    assert serializer.validated_data == expected
