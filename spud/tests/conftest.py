# -*- coding: utf-8 -*-

import datetime

from django.contrib.auth.models import User
import pytest

from spud import models


@pytest.fixture
def users():
    results = {}
    results['authenticated'] = User.objects.create_user(
        username='authenticated',
        email='authenticated@example.org',
        password='1234',
        first_name='First',
        last_name='Last'
    )
    results['superuser'] = User.objects.create_superuser(
        username='superuser',
        email='superuser@example.org',
        password='super1234',
        first_name='First Super',
        last_name='Last Super'
    )
    return results


@pytest.fixture
def albums():
    results = {}

    results['Parent'] = models.album.objects.create(
        title='Parent',
        cover_photo=None,
        description='Testing «ταБЬℓσ»',
        sort_name='sort name',
        sort_order='sort order',
        revised='2010-01-01 12:00:00',
        revised_utc_offset=600,
        parent=None,
    )
    results['First'] = models.album.objects.create(
        title='First',
        cover_photo=None,
        description='Testing «ταБЬℓσ»',
        sort_name='sort name',
        sort_order='sort order',
        revised='2010-01-01 12:00:00',
        revised_utc_offset=600,
        parent=results['Parent'],
    )
    results['Second'] = models.album.objects.create(
        title='Second',
        cover_photo=None,
        description='Testing «ταБЬℓσ»',
        sort_name='sort name',
        sort_order='sort order',
        revised='2010-01-01 12:00:00',
        revised_utc_offset=600,
        parent=results['Parent'],
    )
    return results


@pytest.fixture
def categorys():
    results = {}

    results['Parent'] = models.category.objects.create(
        title='Parent',
        cover_photo=None,
        description='Testing «ταБЬℓσ»',
        sort_name='sort name',
        sort_order='sort order',
        parent=None,
    )
    results['First'] = models.category.objects.create(
        title='First',
        cover_photo=None,
        description='Testing «ταБЬℓσ»',
        sort_name='sort name',
        sort_order='sort order',
        parent=results['Parent'],
    )
    results['Second'] = models.category.objects.create(
        title='Second',
        cover_photo=None,
        description='Testing «ταБЬℓσ»',
        sort_name='sort name',
        sort_order='sort order',
        parent=results['Parent'],
    )
    return results


@pytest.fixture
def persons():
    results = {}

    results['Parent'] = models.person.objects.create(
        first_name='Parent',
        cover_photo=None,
        notes='Testing «ταБЬℓσ»',
    )
    results['First'] = models.person.objects.create(
        first_name='First',
        cover_photo=None,
        notes='Testing «ταБЬℓσ»',
        mother=results['Parent'],
    )
    results['Second'] = models.person.objects.create(
        first_name='Second',
        cover_photo=None,
        notes='Testing «ταБЬℓσ»',
        father=results['Parent'],
    )
    return results


@pytest.fixture
def places():
    results = {}

    results['Parent'] = models.place.objects.create(
        title='Parent',
        cover_photo=None,
        notes='Testing «ταБЬℓσ»',
        parent=None,
    )
    results['First'] = models.place.objects.create(
        title='First',
        cover_photo=None,
        notes='Testing «ταБЬℓσ»',
        parent=results['Parent'],
    )
    results['Second'] = models.place.objects.create(
        title='Second',
        cover_photo=None,
        notes='Testing «ταБЬℓσ»',
        parent=results['Parent'],
    )
    return results


@pytest.fixture
def photo():
    return models.photo.objects.create(
        level=0,
        utc_offset=600,
        datetime=datetime.datetime.now(),
    )


@pytest.fixture
def feedbacks(photo):
    results = {}

    results['Parent'] = models.feedback.objects.create(
        pk=1,
        cover_photo=photo,
        comment='Testing «ταБЬℓσ»',
        rating=0,
        parent=None,
    )
    results['First'] = models.feedback.objects.create(
        pk=2,
        cover_photo=photo,
        comment='Testing «ταБЬℓσ»',
        rating=0,
        parent=results['Parent'],
    )
    results['Second'] = models.feedback.objects.create(
        pk=3,
        cover_photo=photo,
        comment='Testing «ταБЬℓσ»',
        rating=0,
        parent=results['Parent'],
    )
    return results