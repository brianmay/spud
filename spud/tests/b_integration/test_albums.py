import pytest
from pytest_bdd import scenarios, when, then, parsers
import six

from spud import models

scenarios('albums.feature')


@when('we create an album called <name>')
def step_create_album(session, name):
    url = "/api/albums/"
    data = {
        'title': name,
        'cover_photo_pk': None,
        'description': 'description',
        'sort_name': 'sort name',
        'sort_order': 'sort order',
        'revised': '2010-01-01 12:00:00',
        'revised_utc_offset': 600,
        'parent': None,
    }
    session.post(url, json=data)


@when('we update an album called <name>')
def step_update_album(session, albums, name):
    desired_album = models.album.objects.get(title=name)
    url = "/api/albums/%d/" % desired_album.id
    data = {
        'title': name,
        'cover_photo_pk': None,
        'description': 'new description',
        'sort_name': 'sort name',
        'sort_order': 'sort order',
        'revised': '2010-01-01 12:00:00',
        'revised_utc_offset': 600,
        'parent': None,
    }
    session.put(url, json=data)


@when('we patch an album called <name>')
def step_patch_album(session, albums, name):
    desired_album = models.album.objects.get(title=name)
    url = "/api/albums/%d/" % desired_album.id
    data = {
        'description': 'new description',
    }
    session.patch(url, json=data)


@when('we get an album called <name>')
def step_get_album(session, albums, name):
    desired_album = models.album.objects.get(title=name)

    url = "/api/albums/%d/" % desired_album.id
    session.get(url)


@when('we delete an album called <name>')
def step_delete_album(session, albums, name):
    desired_album = models.album.objects.get(title=name)

    url = "/api/albums/%d/" % desired_album.id
    session.delete(url)


@when('we list all albums')
def step_list_albums(session, albums):
    url = "/api/albums/"
    session.get(url)


@then(parsers.cfparse('the album <name> description should be {description}'))
def step_test_album_description(name, description):
    album = models.album.objects.get(title=name)
    assert album.description == description


@then('the album called <name> should exist')
def step_test_album_valid(name):
    models.album.objects.get(title=name)


@then('the album called <name> should not exist')
def step_test_album_not_exist(name):
    with pytest.raises(models.album.DoesNotExist):
        models.album.objects.get(title=name)


@then('we should get a valid album called <name> with <fields>')
def step_test_r_valid_album(session, name, fields):
    album = session.obj
    assert album['title'] == name
    assert isinstance(album['ascendants'], list)
    assert isinstance(album['cover_photo'], (type(None), dict))
    assert isinstance(album['description'], six.string_types)
    assert isinstance(album['parent'], (type(None), int))
    assert isinstance(album['sort_name'], six.string_types)
    assert isinstance(album['sort_order'], six.string_types)
    assert isinstance(album['title'], six.string_types)
    if fields == "restricted":
        assert 'revised' not in album
        assert 'revised_utc_offset' not in album
    else:
        assert isinstance(album['revised'], (type(None), six.string_types))
        assert isinstance(album['revised_utc_offset'], int)


@then(parsers.cfparse('we should get an album with description {description}'))
def step_test_r_album_description(session, description):
    album = session.obj
    assert album['description'] == description


@then(parsers.cfparse('we should get {number:d} valid albums with <fields>'))
def step_test_r_n_results(session, number, fields):
    data = session.obj
    assert data['count'] == number
    assert len(data['results']) == number

    for album in data['results']:
        assert isinstance(album['ascendants'], list)
        assert isinstance(album['cover_photo'], (type(None), dict))
        assert isinstance(album['description'], six.string_types)
        assert isinstance(album['parent'], (type(None), int))
        assert isinstance(album['sort_name'], six.string_types)
        assert isinstance(album['sort_order'], six.string_types)
        assert isinstance(album['title'], six.string_types)
        if fields == "restricted":
            assert 'revised' not in album
            assert 'revised_utc_offset' not in album
        else:
            assert isinstance(album['revised'], (type(None), six.string_types))
            assert isinstance(album['revised_utc_offset'], int)
