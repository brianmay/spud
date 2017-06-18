import requests
import pytest
from pytest_bdd import given, when, then, parsers


def pytest_bdd_apply_tag(tag, function):
    if tag == "django_db":
        marker = pytest.mark.django_db(transaction=True)
        marker(function)
        return True
    else:
        # Fall back to pytest-bdd's default behavior
        return None


class Session(object):
    def __init__(self, live_server):
        self.token = None
        self.obj = None
        self.r = None
        self.live_server = live_server

    @property
    def headers(self):
        headers = {}
        if self.token is not None:
            headers.update({"Authorization": "Token "+self.token})
        return headers

    def process_response(self, r):
        print(r.text)
        assert r.status_code != 500
        self.r = r
        if r.headers.get('content-type') == "application/json":
            self.obj = r.json()
        else:
            self.obj = None
        return self.obj

    def get(self, url, **kwargs):
        url = self.live_server.url + url
        r = requests.get(url, headers=self.headers, **kwargs)
        return self.process_response(r)

    def delete(self, url, **kwargs):
        url = self.live_server.url + url
        r = requests.delete(url, headers=self.headers, **kwargs)
        return self.process_response(r)

    def post(self, url, **kwargs):
        url = self.live_server.url + url
        r = requests.post(url, headers=self.headers, **kwargs)
        return self.process_response(r)

    def put(self, url, **kwargs):
        url = self.live_server.url + url
        r = requests.put(url, headers=self.headers, **kwargs)
        return self.process_response(r)

    def patch(self, url, **kwargs):
        url = self.live_server.url + url
        r = requests.patch(url, headers=self.headers, **kwargs)
        return self.process_response(r)


@pytest.fixture()
def session(live_server):
    session = Session(live_server)
    return session


@given('we dont login')
def step_no_login(session):
    session.token = None
    session.obj = None
    session.r = None


@given(parsers.cfparse('we login as {username} with {password}'))
@given('we login as <username> with <password>')
def step_login(session, users, username, password, settings):
    settings.DEBUG = True
    session.token = None
    session.obj = None
    session.r = None

    if username == "anonymous":
        return

    url = "/api/session/login/"
    data = {'username': username, 'password': password}
    result = session.post(url, json=data)

    session.token = result['token']


@when('we logout')
def step_logout(session):
    session.token = None
    session.obj = None


@when('we request the session')
def step_request_session(session):
    url = "/api/session/"
    result = session.get(url)

    assert session.token == result.get('token', None)


@then(parsers.cfparse('the session permissions should be {permissions}'))
@then('the session permissions should be <permissions>')
def step_test_permissions(session, permissions):
    type_list = [
        'albums',
        'categorys',
        'persons',
        'places',
        'photos',
        'feedbacks',
    ]

    if permissions == "all":
        expected_value = True
    elif permissions == "none":
        expected_value = False
    else:
        assert False

    perms = session.obj.get('perms', {})
    for obj_type in type_list:
        obj_perms = perms.get(obj_type, {})
        assert obj_perms.get('can_create', False) == expected_value
        assert obj_perms.get('can_change', False) == expected_value
        assert obj_perms.get('can_delete', False) == expected_value


@then('the session user should not be set')
def step_test_no_user(session):
    user = session.obj.get('user')
    assert user is None


@then(parsers.cfparse('the session username should be {username}'))
@then('the session username should be <username>')
def step_test_username(session, username):
    user = session.obj['user']
    assert user.get('username') == username


@then(parsers.cfparse('the session first name should be {first_name}'))
@then('the session first name should be <first_name>')
def step_test_first_name(session, first_name):
    user = session.obj['user']
    assert user.get('first_name') == first_name


@then(parsers.cfparse('the session last name should be {last_name}'))
@then('the session last name should be <last_name>')
def step_test_last_name(session, last_name):
    user = session.obj['user']
    assert user.get('last_name') == last_name


@then(parsers.cfparse('we should get the error: {error}'))
@then('we should get the error: <error>')
def step_status_error(session, error):
    assert session.r.status_code == 403

    got_json = session.obj
    expected_json = {'detail': error}
    assert got_json == expected_json


@then('we should get a successful result')
def step_status_200(session):
    assert session.r.status_code == 200


@then('we should get a created result')
def step_status_201(session):
    assert session.r.status_code == 201


@then('we should get a no content result')
def step_status_204(session):
    assert session.r.status_code == 204
