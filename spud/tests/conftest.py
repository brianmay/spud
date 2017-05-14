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
        description='description',
        sort_name='sort name',
        sort_order='sort order',
        revised='2010-01-01 12:00:00',
        revised_utc_offset=600,
        parent=None,
    )
    results['First'] = models.album.objects.create(
        title='First',
        cover_photo=None,
        description='description',
        sort_name='sort name',
        sort_order='sort order',
        revised='2010-01-01 12:00:00',
        revised_utc_offset=600,
        parent=results['Parent'],
    )
    results['Second'] = models.album.objects.create(
        title='Second',
        cover_photo=None,
        description='description',
        sort_name='sort name',
        sort_order='sort order',
        revised='2010-01-01 12:00:00',
        revised_utc_offset=600,
        parent=results['Parent'],
    )
    return results
