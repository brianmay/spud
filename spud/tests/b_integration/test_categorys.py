import pytest
from pytest_bdd import scenarios, when, then, parsers
import six

from spud import models

scenarios('categorys.feature')


@when('we create a category called <name>')
def step_create_category(session, name):
    url = "/api/categorys/"
    data = {
        'title': name,
        'cover_photo_pk': None,
        'description': 'description',
        'sort_name': 'sort name',
        'sort_order': 'sort order',
        'parent': None,
    }
    session.post(url, json=data)


@when('we update a category called <name>')
def step_update_category(session, categorys, name):
    desired_category = models.category.objects.get(title=name)
    url = "/api/categorys/%d/" % desired_category.id
    data = {
        'title': name,
        'cover_photo_pk': None,
        'description': 'new description',
        'sort_name': 'sort name',
        'sort_order': 'sort order',
        'parent': None,
    }
    session.put(url, json=data)


@when('we patch a category called <name>')
def step_patch_category(session, categorys, name):
    desired_category = models.category.objects.get(title=name)
    url = "/api/categorys/%d/" % desired_category.id
    data = {
        'description': 'new description',
    }
    session.patch(url, json=data)


@when('we get a category called <name>')
def step_get_category(session, categorys, name):
    desired_category = models.category.objects.get(title=name)

    url = "/api/categorys/%d/" % desired_category.id
    session.get(url)


@when('we delete a category called <name>')
def step_delete_category(session, categorys, name):
    desired_category = models.category.objects.get(title=name)

    url = "/api/categorys/%d/" % desired_category.id
    session.delete(url)


@when('we list all categorys')
def step_list_categorys(session, categorys):
    url = "/api/categorys/"
    session.get(url)


@then(parsers.cfparse(
    'the category <name> description should be {description}'))
def step_test_category_description(name, description):
    category = models.category.objects.get(title=name)
    assert category.description == description


@then('the category called <name> should exist')
def step_test_category_valid(name):
    models.category.objects.get(title=name)


@then('the category called <name> should not exist')
def step_test_category_not_exist(name):
    with pytest.raises(models.category.DoesNotExist):
        models.category.objects.get(title=name)


@then('we should get a valid category called <name>')
def step_test_r_valid_category(session, name):
    category = session.obj
    assert category['title'] == name
    assert isinstance(category['ascendants'], list)
    assert isinstance(category['cover_photo'], (type(None), dict))
    assert isinstance(category['description'], six.string_types)
    assert isinstance(category['parent'], (type(None), int))
    assert isinstance(category['sort_name'], six.string_types)
    assert isinstance(category['sort_order'], six.string_types)
    assert isinstance(category['title'], six.string_types)


@then(parsers.cfparse(
    'we should get a category with description {description}'))
def step_test_r_category_description(session, description):
    category = session.obj
    assert category['description'] == description


@then(parsers.cfparse('we should get {number:d} valid categorys'))
def step_test_r_n_results(session, number):
    data = session.obj
    assert data['count'] == number
    assert len(data['results']) == number

    for category in data['results']:
        assert isinstance(category['ascendants'], list)
        assert isinstance(category['cover_photo'], (type(None), dict))
        assert isinstance(category['description'], six.string_types)
        assert isinstance(category['parent'], (type(None), int))
        assert isinstance(category['sort_name'], six.string_types)
        assert isinstance(category['sort_order'], six.string_types)
        assert isinstance(category['title'], six.string_types)
