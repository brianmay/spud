import pytest
from pytest_bdd import scenarios, when, then, parsers
import six

from spud import models

scenarios('places.feature')


@when('we create a place called <name>')
def step_create_place(session, name):
    url = "/api/places/"
    data = {
        'title': name,
        'cover_photo_pk': None,
        'notes': 'notes',
        'parent': None,
    }
    session.post(url, json=data)


@when('we update a place called <name>')
def step_update_place(session, places, name):
    desired_place = models.place.objects.get(title=name)
    url = "/api/places/%d/" % desired_place.id
    data = {
        'title': name,
        'cover_photo_pk': None,
        'notes': 'new notes',
        'parent': None,
    }
    session.put(url, json=data)


@when('we patch a place called <name>')
def step_patch_place(session, places, name):
    desired_place = models.place.objects.get(title=name)
    url = "/api/places/%d/" % desired_place.id
    data = {
        'notes': 'new notes',
    }
    session.patch(url, json=data)


@when('we get a place called <name>')
def step_get_place(session, places, name):
    desired_place = models.place.objects.get(title=name)

    url = "/api/places/%d/" % desired_place.id
    session.get(url)


@when('we delete a place called <name>')
def step_delete_place(session, places, name):
    desired_place = models.place.objects.get(title=name)

    url = "/api/places/%d/" % desired_place.id
    session.delete(url)


@when('we list all places')
def step_list_places(session, places):
    url = "/api/places/"
    session.get(url)


@then(parsers.cfparse(
    'the place <name> notes should be {notes}'))
def step_test_place_notes(name, notes):
    place = models.place.objects.get(title=name)
    assert place.notes == notes


@then('the place called <name> should exist')
def step_test_place_valid(name):
    models.place.objects.get(title=name)


@then('the place called <name> should not exist')
def step_test_place_not_exist(name):
    with pytest.raises(models.place.DoesNotExist):
        models.place.objects.get(title=name)


@then('we should get a valid place called <name>')
def step_test_r_valid_place(session, name):
    place = session.obj
    assert place['title'] == name
    assert isinstance(place['ascendants'], list)
    assert isinstance(place['cover_photo'], (type(None), dict))
    assert isinstance(place['notes'], six.string_types)
    assert isinstance(place['parent'], (type(None), int))
    assert isinstance(place['title'], six.string_types)


@then(parsers.cfparse(
    'we should get a place with notes {notes}'))
def step_test_r_place_notes(session, notes):
    place = session.obj
    assert place['notes'] == notes


@then(parsers.cfparse('we should get {number:d} valid places'))
def step_test_r_n_results(session, number):
    data = session.obj
    assert data['count'] == number
    assert len(data['results']) == number

    for place in data['results']:
        assert isinstance(place['ascendants'], list)
        assert isinstance(place['cover_photo'], (type(None), dict))
        assert isinstance(place['notes'], six.string_types)
        assert isinstance(place['parent'], (type(None), int))
        assert isinstance(place['title'], six.string_types)
