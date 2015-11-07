# spud - keep track of photos
# Copyright (C) 2008-2013 Brian May
#
# This program is free software: you can redistribute it and/or modify
# it under the terms of the GNU General Public License as published by
# the Free Software Foundation, either version 3 of the License, or
# (at your option) any later version.
#
# This program is distributed in the hope that it will be useful,
# but WITHOUT ANY WARRANTY; without even the implied warranty of
# MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
# GNU General Public License for more details.
#
# You should have received a copy of the GNU General Public License
# along with this program.  If not, see <http://www.gnu.org/licenses/>.
import pytest
from django.contrib.auth.models import User
from django.core.urlresolvers import reverse

from rest_framework import status
from rest_framework.test import APIClient


@pytest.fixture
def client():
    return APIClient()


def get_expected_user(user):
    if user is None:
        return None

    return {
        'username': user.username,
        'first_name': "",
        'last_name': "",
        'email': "test@example.org",
        'groups': [],
        'id': user.id,
    }


def get_expected_session(user):
    if user is None:
        return {
            "perms": {}
        }

    perms = {}
    if not user.is_superuser:
        perms = {
            'categorys': {
                'can_change': False,
                'can_delete': False,
                'can_create': False,
            },
            'places': {
                'can_change': False,
                'can_delete': False,
                'can_create': False,
            },
            'photos': {
                'can_change': False,
                'can_delete': False,
                'can_create': False,
            },
            'persons': {
                'can_change': False,
                'can_delete': False,
                'can_create': False,
            },
            'albums': {
                'can_change': False,
                'can_delete': False,
                'can_create': False,
            },
            'feedbacks': {
                'can_change': False,
                'can_delete': False,
                'can_create': False,
            },
        }
    else:
        perms = {
            'categorys': {
                'can_change': True,
                'can_delete': True,
                'can_create': True,
            },
            'places': {
                'can_change': True,
                'can_delete': True,
                'can_create': True,
            },
            'photos': {
                'can_change': True,
                'can_delete': True,
                'can_create': True,
            },
            'persons': {
                'can_change': True,
                'can_delete': True,
                'can_create': True,
            },
            'albums': {
                'can_change': True,
                'can_delete': True,
                'can_create': True
            },
            'feedbacks': {
                'can_change': True,
                'can_delete': True,
                'can_create': True,
            },
        }

    return {
        'perms': perms,
        'user': get_expected_user(user),
    }


def login(client, user):
    if user is not None:
        # response = client.login(username="test", password="1234")
        # assert response

        url = reverse('session-login')
        data = {'username': user.username, 'password': '1234'}
        response = client.post(url, data, format='json')
        assert response.status_code == status.HTTP_200_OK
        assert response.data == get_expected_session(user)


def pytest_generate_tests(metafunc):
    idlist = []
    argvalues = []
    for scenario in metafunc.cls.scenarios:
        idlist.append(scenario[0])
        items = scenario[1].items()
        argnames = [x[0] for x in items]
        argvalues.append(([x[1] for x in items]))
    metafunc.parametrize(argnames, argvalues, ids=idlist, scope="class")


class BaseTests(object):
    pass


class UnauthTests(BaseTests):
    def get_user(self):
        return None

    def check_authorized(self, obj_type, action):
        if obj_type == 'user':
            return False
        if action == 'list':
            return True
        if action == 'detail':
            return True
        return False

    def check_response(self, response, obj_type, action):
        ok = self.check_authorized(obj_type, action)

        if not ok:
            assert response.status_code == status.HTTP_403_FORBIDDEN
            assert response.data == {
                'detail': 'Authentication credentials were not provided.'}
            return False

        return True


class UserTests(BaseTests):
    def get_user(self):
        return User.objects.create_user('test1', 'test@example.org', '1234')

    def check_authorized(self, obj_type, action):
        if obj_type == 'user':
            return False
        return True

    def check_response(self, response, obj_type, action):
        ok = self.check_authorized(obj_type, action)

        if not ok:
            assert response.status_code == status.HTTP_403_FORBIDDEN
            assert response.data == {
                'detail': 'You do not have permission to perform this action.'}
            return False

        return True


class SuperuserTests(object):
    def get_user(self):
        return User.objects.create_superuser(
            'test2', 'test@example.org', '1234')

    def check_authorized(self, obj_type, action):
        return True

    def check_response(self, response, obj_type, action):
        return True

scenario_unauth = ('scenario_unauth', {'scenario': UnauthTests()})
scenario_user = ('scenario_user', {'scenario': UserTests()})
scenario_superuser = ('scenario_superuser', {'scenario': SuperuserTests()})


@pytest.mark.django_db(transaction=True)
class TestSessions(object):
    scenarios = [scenario_unauth, scenario_user, scenario_superuser]

    def test_session_detail(self, client, scenario):
        user = scenario.get_user()
        login(client, user)

        url = reverse('session-detail')
        response = client.get(url, format='json')
        assert response.status_code == status.HTTP_200_OK
        assert response.data == get_expected_session(user)

    def test_session_login_twice(self, client, scenario):
        user = scenario.get_user()
        login(client, user)

        url = reverse('session-detail')
        response = client.get(url, format='json')
        assert response.status_code == status.HTTP_200_OK
        assert response.data == get_expected_session(user)

        if user is not None:
            url = reverse('session-login')
            data = {'username': user.username, 'password': '1234'}
            response = client.post(url, data, format='json')
            assert response.status_code == status.HTTP_200_OK
            assert response.data == get_expected_session(user)

            url = reverse('session-detail')
            response = client.get(url, format='json')
            assert response.status_code == status.HTTP_200_OK
            assert response.data == get_expected_session(user)

    def test_session_logout(self, client, scenario):
        user = scenario.get_user()
        login(client, user)

        url = reverse('session-logout')
        data = {}
        response = client.post(url, data, format='json')
        assert response.status_code == status.HTTP_200_OK
        assert response.data == get_expected_session(None)

        url = reverse('session-detail')
        response = client.get(url, format='json')
        assert response.status_code == status.HTTP_200_OK
        assert response.data == get_expected_session(None)

        url = reverse('session-logout')
        data = {}
        response = client.post(url, data, format='json')
        assert response.status_code == status.HTTP_200_OK
        assert response.data == get_expected_session(None)

        url = reverse('session-detail')
        response = client.get(url, format='json')
        assert response.status_code == status.HTTP_200_OK
        assert response.data == get_expected_session(None)


@pytest.mark.django_db(transaction=True)
class TestUsers(object):
    scenarios = [scenario_unauth, scenario_user, scenario_superuser]

    def test_user_list(self, client, scenario):
        user = scenario.get_user()
        login(client, user)

        url = reverse('user-list')
        response = client.get(url, format='json')
        if scenario.check_response(response, 'user', 'list'):
            assert response.status_code == status.HTTP_200_OK
            assert response.data == [
                get_expected_user(user)
            ]

    def test_user_create_delete(self, client, scenario):
        user = scenario.get_user()
        login(client, user)

        url = reverse('user-list')
        data = {'username': 'newuser', 'password': '1234'}
        response = client.post(url, data, format='json')
        if scenario.check_response(response, 'user', 'create'):
            assert response.status_code == status.HTTP_201_CREATED
            assert response.data == {
                'username': 'newuser',
                'email': '',
                'id': response.data['id'],
                'first_name': '',
                'groups': [],
                'last_name': '',
            }
            pk = response.data['id']
        else:
            pk = 1

        url = reverse('user-detail', args=[pk])
        response = client.delete(url, format='json')
        if scenario.check_response(response, 'user', 'delete'):
            assert response.status_code == status.HTTP_204_NO_CONTENT
            assert response.data is None

        url = reverse('user-detail', args=[pk])
        response = client.get(url, format='json')
        if scenario.check_response(response, 'user', 'detail'):
            assert response.status_code == status.HTTP_404_NOT_FOUND
            assert response.data == {'detail': 'Not found.'}

    def test_user_detail(self, client, scenario):
        user = scenario.get_user()
        login(client, user)

        pk = 1
        if user is not None:
            pk = user.pk

        url = reverse('user-detail', args=[pk])
        response = client.get(url, format='json')
        if scenario.check_response(response, 'user', 'detail'):
            assert response.status_code == status.HTTP_200_OK
            assert response.data == get_expected_user(user)

    def test_user_put(self, client, scenario):
        user = scenario.get_user()
        login(client, user)

        pk = 1
        if user is not None:
            pk = user.pk

        data = {'email': 'silly@example.org'}
        expected = get_expected_user(user) or {}
        expected.update(data)

        url = reverse('user-detail', args=[pk])
        response = client.put(url, expected, format='json')
        if scenario.check_response(response, 'user', 'change'):
            assert response.status_code == status.HTTP_200_OK
            assert response.data == expected

    def test_user_patch(self, client, scenario):
        user = scenario.get_user()
        login(client, user)

        pk = 1
        if user is not None:
            pk = user.pk

        data = {'email': 'silly@example.org'}
        expected = get_expected_user(user) or {}
        expected.update(data)

        url = reverse('user-detail', args=[pk])
        response = client.patch(url, data, format='json')
        if scenario.check_response(response, 'user', 'change'):
            assert response.status_code == status.HTTP_200_OK
            assert response.data == expected
