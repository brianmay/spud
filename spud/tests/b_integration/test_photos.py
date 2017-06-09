import pytest
from pytest_bdd import scenarios, when, then, parsers
import six
import os

from spud import models

scenarios('photos.feature')


@when('we create a photo called <name> using <filename>')
def step_create_photo(session, name, filename, data_files):
    url = "/api/photos/"
    data = {
        'title': name,
        'description': 'description',
        'utc_offset': 660,
        'datetime': '2012-12-20 12:34:56',
        'level': 0,
    }
    files = {'photo': open(os.path.join(data_files, filename), 'rb')}
    session.post(url, data=data, files=files)


@when('we update a photo called <name>')
def step_update_photo(session, photos, name):
    desired_photo = models.photo.objects.get(title=name)
    url = "/api/photos/%d/" % desired_photo.id
    data = {
        'title': name,
        'description': 'new description',
        'utc_offset': 660,
        'datetime': '2012-12-20 12:34:56',
        'level': 0,
    }
    session.put(url, json=data)


@when('we patch a photo called <name>')
def step_patch_photo(session, photos, name):
    desired_photo = models.photo.objects.get(title=name)
    url = "/api/photos/%d/" % desired_photo.id
    data = {
        'description': 'new description',
    }
    session.patch(url, json=data)


@when('we get a photo called <name>')
def step_get_photo(session, photos, name):
    desired_photo = models.photo.objects.get(title=name)

    url = "/api/photos/%d/" % desired_photo.id
    session.get(url)


@when('we delete a photo called <name>')
def step_delete_photo(session, photos, name):
    desired_photo = models.photo.objects.get(title=name)

    url = "/api/photos/%d/" % desired_photo.id
    session.delete(url)


@when('we list all photos')
def step_list_photos(session, photos):
    url = "/api/photos/"
    session.get(url)


@then(parsers.cfparse(
    'the photo <name> description should be {description}'))
def step_test_photo_description(name, description):
    photo = models.photo.objects.get(title=name)
    assert photo.description == description


@then('the photo called <name> should exist')
def step_test_photo_valid(name):
    models.photo.objects.get(title=name)


@then('the photo called <name> should not exist')
def step_test_photo_not_exist(name):
    with pytest.raises(models.photo.DoesNotExist):
        models.photo.objects.get(title=name)


@then('we should get a valid photo called <name>')
def step_test_r_valid_photo(session, name):
    photo = session.obj
    assert photo['title'] == name
    assert isinstance(photo['description'], six.string_types)
    assert isinstance(photo['title'], six.string_types)


@then(parsers.cfparse(
    'we should get a photo with description {description}'))
def step_test_r_photo_description(session, description):
    photo = session.obj
    assert photo['description'] == description


@then(parsers.cfparse('we should get {number:d} valid photos'))
def step_test_r_n_results(session, number):
    data = session.obj
    assert data['count'] == number
    assert len(data['results']) == number

    for photo in data['results']:
        assert isinstance(photo['description'], six.string_types)
        assert isinstance(photo['title'], six.string_types)
