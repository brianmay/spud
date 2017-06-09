import pytest
from pytest_bdd import scenarios, when, then, parsers
import six

from spud import models

scenarios('relations.feature')


@when('we create a relation between <photo_1> and <photo_2>')
def step_create_relation(session, photo_1, photo_2, photos):
    url = "/api/relations/"

    photo_1 = photos[photo_1]
    photo_2 = photos[photo_2]

    data = {
        'photo_1_pk': photo_1.id,
        'desc_1': 'photo 1 description',
        'photo_2_pk': photo_2.id,
        'desc_2': 'photo 2 description',
    }
    print(data)
    session.post(url, json=data)


@when('we update a relation between <photo_1> and <photo_2>')
def step_update_relation(session, relations, photo_1, photo_2, photos):
    photo_1 = photos[photo_1]
    photo_2 = photos[photo_2]
    desired_relation = models.photo_relation.objects.get(
        photo_1=photo_1, photo_2=photo_2)

    url = "/api/relations/%d/" % desired_relation.id
    data = {
        'photo_1_pk': photo_1.id,
        'desc_1': 'photo 1 new description',
        'photo_2_pk': photo_2.id,
        'desc_2': 'photo 2 new description',
    }
    session.put(url, json=data)


@when('we patch a relation between <photo_1> and <photo_2>')
def step_patch_relation(session, relations, photo_1, photo_2, photos):
    photo_1 = photos[photo_1]
    photo_2 = photos[photo_2]
    desired_relation = models.photo_relation.objects.get(
            photo_1=photo_1, photo_2=photo_2)

    url = "/api/relations/%d/" % desired_relation.id
    data = {
        'desc_1': 'photo 1 new description',
        'desc_2': 'photo 2 new description',
    }
    session.patch(url, json=data)


@when('we get a relation between <photo_1> and <photo_2>')
def step_get_relation(session, relations, photo_1, photo_2, photos):
    photo_1 = photos[photo_1]
    photo_2 = photos[photo_2]
    desired_relation = models.photo_relation.objects.get(
            photo_1=photo_1, photo_2=photo_2)

    url = "/api/relations/%d/" % desired_relation.id
    session.get(url)


@when('we delete a relation between <photo_1> and <photo_2>')
def step_delete_relation(session, relations, photo_1, photo_2, photos):
    photo_1 = photos[photo_1]
    photo_2 = photos[photo_2]
    desired_relation = models.photo_relation.objects.get(
            photo_1=photo_1, photo_2=photo_2)

    url = "/api/relations/%d/" % desired_relation.id
    session.delete(url)


@when('we list all relations')
def step_list_relations(session, relations):
    url = "/api/relations/"
    session.get(url)


@then(parsers.cfparse(
    'the relation between <photo_1> and <photo_2> '
    'description 1 should be {description}'))
def step_test_relation_description_1(photo_1, photo_2, description, photos):
    photo_1 = photos[photo_1]
    photo_2 = photos[photo_2]
    relation = models.photo_relation.objects.get(
            photo_1=photo_1, photo_2=photo_2)
    assert relation.desc_1 == description


@then(parsers.cfparse(
    'the relation between <photo_1> and <photo_2> '
    'description 2 should be {description}'))
def step_test_relation_description_2(photo_1, photo_2, description, photos):
    photo_1 = photos[photo_1]
    photo_2 = photos[photo_2]
    relation = models.photo_relation.objects.get(
            photo_1=photo_1, photo_2=photo_2)
    assert relation.desc_2 == description


@then('the relation between <photo_1> and <photo_2> should exist')
def step_test_relation_valid(photo_1, photo_2, photos):
    photo_1 = photos[photo_1]
    photo_2 = photos[photo_2]
    models.photo_relation.objects.get(
        photo_1=photo_1, photo_2=photo_2)


@then('the relation between <photo_1> and <photo_2> should not exist')
def step_test_relation_not_exist(photo_1, photo_2, photos):
    photo_1 = photos[photo_1]
    photo_2 = photos[photo_2]
    with pytest.raises(models.photo_relation.DoesNotExist):
        models.photo_relation.objects.get(
            photo_1=photo_1, photo_2=photo_2)


@then('we should get a valid relation between <photo_1> and <photo_2>')
def step_test_r_valid_relation(session, photo_1, photo_2, photos):
    photo_1 = photos[photo_1]
    photo_2 = photos[photo_2]

    relation = session.obj
    assert relation['photo_1']['id'] == photo_1.id
    assert relation['photo_2']['id'] == photo_2.id
    assert isinstance(relation['desc_1'], six.string_types)
    assert isinstance(relation['desc_2'], six.string_types)


@then(parsers.cfparse(
    'we should get a relation with description 1 {description}'))
def step_test_r_relation_description_1(session, description):
    relation = session.obj
    assert relation['desc_1'] == description


@then(parsers.cfparse(
    'we should get a relation with description 2 {description}'))
def step_test_r_relation_description_2(session, description):
    relation = session.obj
    assert relation['desc_2'] == description


@then(parsers.cfparse('we should get {number:d} valid relations'))
def step_test_r_n_results(session, number):
    data = session.obj
    assert data['count'] == number
    assert len(data['results']) == number

    for relation in data['results']:
        assert isinstance(relation['photo_1'], (type(None), dict))
        assert isinstance(relation['photo_2'], (type(None), dict))
        assert isinstance(relation['desc_1'], six.string_types)
        assert isinstance(relation['desc_2'], six.string_types)
