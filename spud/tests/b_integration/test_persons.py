import pytest
from pytest_bdd import scenarios, when, then, parsers
import six

from spud import models

scenarios('persons.feature')


@when('we create a person called <name>')
def step_create_person(session, name):
    url = "/api/persons/"
    data = {
        'first_name': name,
        'cover_photo_pk': None,
        'notes': 'notes',
    }
    session.post(url, json=data)


@when('we update a person called <name>')
def step_update_person(session, persons, name):
    desired_person = models.person.objects.get(first_name=name)
    url = "/api/persons/%d/" % desired_person.id
    data = {
        'first_name': name,
        'cover_photo_pk': None,
        'notes': 'new notes',
    }
    session.put(url, json=data)


@when('we patch a person called <name>')
def step_patch_person(session, persons, name):
    desired_person = models.person.objects.get(first_name=name)
    url = "/api/persons/%d/" % desired_person.id
    data = {
        'notes': 'new notes',
    }
    session.patch(url, json=data)


@when('we get a person called <name>')
def step_get_person(session, persons, name):
    desired_person = models.person.objects.get(first_name=name)

    url = "/api/persons/%d/" % desired_person.id
    session.get(url)


@when('we delete a person called <name>')
def step_delete_person(session, persons, name):
    desired_person = models.person.objects.get(first_name=name)

    url = "/api/persons/%d/" % desired_person.id
    session.delete(url)


@when('we list all persons')
def step_list_persons(session, persons):
    url = "/api/persons/"
    session.get(url)


@then(parsers.cfparse(
    'the person <name> notes should be {notes}'))
def step_test_person_notes(name, notes):
    person = models.person.objects.get(first_name=name)
    assert person.notes == notes


@then('the person called <name> should exist')
def step_test_person_valid(name):
    models.person.objects.get(first_name=name)


@then('the person called <name> should not exist')
def step_test_person_not_exist(name):
    with pytest.raises(models.person.DoesNotExist):
        models.person.objects.get(first_name=name)


@then('we should get a valid person called <name> with <fields>')
def step_test_r_valid_person(session, name, fields):
    person = session.obj
    assert person['title'] == name
    assert person['first_name'] == name
    assert isinstance(person['cover_photo'], (type(None), dict))
    assert isinstance(person['title'], six.string_types)
    assert isinstance(person['first_name'], six.string_types)
    if fields == "restricted":
        assert 'ascendants' not in person
        assert 'notes' not in person
        assert 'mother' not in person
        assert 'father' not in person
    else:
        assert isinstance(person['ascendants'], list)
        assert isinstance(person['notes'], six.string_types)
        assert isinstance(person['mother'], (type(None), dict))
        assert isinstance(person['father'], (type(None), dict))


@then(parsers.cfparse(
    'we should get a person with notes {notes}'))
def step_test_r_person_notes(session, notes):
    person = session.obj
    assert person.get('notes') == notes


@then(parsers.cfparse('we should get {number:d} valid persons with <fields>'))
def step_test_r_n_results(session, number, fields):
    data = session.obj
    assert data['count'] == number
    assert len(data['results']) == number

    for person in data['results']:
        assert isinstance(person['cover_photo'], (type(None), dict))
        assert isinstance(person['title'], six.string_types)
