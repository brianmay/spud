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
import datetime

from django.contrib.auth.models import User
from django.core.urlresolvers import reverse
from django.http import QueryDict

from rest_framework import status
from rest_framework.test import APIClient

from spud import models


def get_json_user(user):
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


def get_json_session(user):
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
        'user': get_json_user(user),
    }


def login(client, user):
    if user is not None:
        # response = client.login(username="test", password="1234")
        # assert response

        url = reverse('session-login')
        data = {'username': user.username, 'password': '1234'}
        response = client.post(url, data, format='json')
        assert response.status_code == status.HTTP_200_OK
        assert response.data == get_json_session(user)


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
        print(obj_type, action)
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

    def test_session_detail(self, scenario):
        client = APIClient()
        user = scenario.get_user()
        login(client, user)

        # get session detail
        url = reverse('session-detail')
        response = client.get(url, format='json')
        assert response.status_code == status.HTTP_200_OK
        assert response.data == get_json_session(user)

    def test_session_login_twice(self, scenario):
        client = APIClient()
        user = scenario.get_user()
        login(client, user)

        # get session detail
        url = reverse('session-detail')
        response = client.get(url, format='json')
        assert response.status_code == status.HTTP_200_OK
        assert response.data == get_json_session(user)

        if user is not None:
            # login to website
            url = reverse('session-login')
            data = {'username': user.username, 'password': '1234'}
            response = client.post(url, data, format='json')
            assert response.status_code == status.HTTP_200_OK
            assert response.data == get_json_session(user)

            # get session detail
            url = reverse('session-detail')
            response = client.get(url, format='json')
            assert response.status_code == status.HTTP_200_OK
            assert response.data == get_json_session(user)

    def test_session_logout(self, scenario):
        client = APIClient()
        user = scenario.get_user()
        login(client, user)

        # logout
        url = reverse('session-logout')
        data = {}
        response = client.post(url, data, format='json')
        assert response.status_code == status.HTTP_200_OK
        assert response.data == get_json_session(None)

        # get session detail
        url = reverse('session-detail')
        response = client.get(url, format='json')
        assert response.status_code == status.HTTP_200_OK
        assert response.data == get_json_session(None)

        # logout - should be NOP
        url = reverse('session-logout')
        data = {}
        response = client.post(url, data, format='json')
        assert response.status_code == status.HTTP_200_OK
        assert response.data == get_json_session(None)

        # get session detail
        url = reverse('session-detail')
        response = client.get(url, format='json')
        assert response.status_code == status.HTTP_200_OK
        assert response.data == get_json_session(None)


class BaseTest(object):
    scenarios = [scenario_unauth, scenario_user, scenario_superuser]

    def create_test_db(self, user):
        raise NotImplementedError()

    def get_test_creates(self, user):
        raise NotImplementedError()

    def get_test_updates(self, user):
        raise NotImplementedError()

    def get_test_deletes(self):
        raise NotImplementedError()

    def model_to_json(self, obj, user):
        raise NotImplementedError()

    def get_list_url(self):
        return reverse('%s-list' % self.name)

    def get_detail_url(self, pk):
        return reverse('%s-detail' % self.name, args=[pk])

    def test_obj_create(self, scenario):
        client = APIClient()
        user = scenario.get_user()
        login(client, user)

        # create obj without parent
        url = self.get_list_url()
        json = self.get_test_creates(user)
        response = client.post(url, json, format='json')
        if scenario.check_response(response, self.name, 'create'):
            assert response.status_code == status.HTTP_201_CREATED
            json['id'] = response.data['id']
            assert response.data == json

            # check obj exists
            obj = self.model.objects.get(pk=response.data['id'])
            assert self.model_to_json(obj, user) == json

    def test_obj_list(self, scenario):
        client = APIClient()
        user = scenario.get_user()
        login(client, user)
        objs = self.create_test_db(user)
        lists = self.get_test_lists(user)

        for params, expected_list in lists:
            qd = QueryDict("", mutable=True)
            for key, value in params.items():
                qd[key] = value

            # list all objs
            url = self.get_list_url() + "?" + qd.urlencode()
            response = client.get(url, format='json')
            if scenario.check_response(response, self.name, 'list'):
                assert response.status_code == status.HTTP_200_OK
                assert len(response.data) == len(expected_list)
                print(response.data, expected_list)
                for data, expected in zip(response.data, expected_list):
                    if expected is not None:
                        assert data["id"] == expected
                        obj = objs[data["id"]]
                        assert data == self.model_to_json(obj, user)

    def test_obj_delete(self, scenario):
        client = APIClient()
        user = scenario.get_user()
        login(client, user)

        objs = self.create_test_db(user)
        deletes = self.get_test_deletes()

        for pk, expected_status, expected_data in deletes:
            obj = objs[pk]

            url = self.get_detail_url(pk)
            response = client.delete(url, format='json')
            if scenario.check_response(response, self.name, 'delete'):
                assert response.status_code == expected_status
                assert response.data == expected_data
                if response.status_code != status.HTTP_204_NO_CONTENT:
                    # check obj still exists and unchanged
                    json = self.model_to_json(obj, user)
                    obj2 = self.model.objects.get(pk=obj.pk)
                    json2 = self.model_to_json(obj2, user)
                    assert json == json2
                else:
                    # check obj is deleted
                    with pytest.raises(self.model.DoesNotExist):
                        self.model.objects.get(pk=obj.pk)

    def test_obj_detail(self, scenario):
        client = APIClient()
        user = scenario.get_user()
        login(client, user)
        objs = self.create_test_db(user)

        for obj in objs.values():
            url = self.get_detail_url(obj.pk)
            response = client.get(url, format='json')
            if scenario.check_response(response, self.name, 'detail'):
                assert response.status_code == status.HTTP_200_OK
                assert response.data == self.model_to_json(obj, user)

    def test_obj_detail_notfound(self, scenario):
        client = APIClient()
        user = scenario.get_user()
        login(client, user)

        # get obj detail
        url = self.get_detail_url(999)
        response = client.get(url, format='json')
        if scenario.check_response(response, self.name, 'detail'):
            assert response.status_code == status.HTTP_404_NOT_FOUND
            assert response.data == {'detail': 'Not found.'}

    def test_obj_put(self, scenario):
        client = APIClient()
        user = scenario.get_user()
        login(client, user)

        objs = self.create_test_db(user)
        updates = self.get_test_updates(user)

        for pk, _, expected in updates:
            obj = objs[pk]

            url = self.get_detail_url(obj.pk)
            response = client.put(url, expected, format='json')
            if scenario.check_response(response, self.name, 'change'):
                assert response.status_code == status.HTTP_200_OK
                assert response.data == expected

    def test_obj_patch(self, scenario):
        client = APIClient()
        user = scenario.get_user()
        login(client, user)

        objs = self.create_test_db(user)
        updates = self.get_test_updates(user)

        for pk, update, expected in updates:
            obj = objs[pk]

            url = self.get_detail_url(obj.pk)
            response = client.patch(url, update, format='json')
            if scenario.check_response(response, self.name, 'change'):
                assert response.status_code == status.HTTP_200_OK
                assert response.data == expected


@pytest.mark.django_db(transaction=True)
class TestUsers(BaseTest):
    name = "user"
    model = User

    def create_test_db(self, user):
        result = {}
        self.pks = []

        # create album without parent
        obj = User.objects.create_user(
            'deleteme', 'delete@example.org', '1234')
        result[obj.pk] = obj
        self.pks.append(obj.pk)

        # return results
        self.objs = result
        return result

    def get_test_creates(self, user):
        json = {
            'username': 'newuser',
            'email': '',
            'first_name': '',
            'groups': [],
            'last_name': '',
        }
        return json

    def get_test_lists(self, user):
        l = [
            ({}, [None, self.pks[0]]),
        ]
        return l

    def get_test_updates(self, user):
        l = []
        for pk in self.pks:
            obj = self.objs[pk]
            expected = self.model_to_json(obj, user)
            expected.update({'email': 'deleted@example.org'})
            l.append((pk, {'email': 'deleted@example.org'}, expected))
        return l

    def get_test_deletes(self):
        l = []
        for pk in self.pks:
            l.append((pk, status.HTTP_204_NO_CONTENT, None))
        return l

    def model_to_json(self, obj, user):
        json = {
            'username': obj.username,
            'first_name': obj.first_name,
            'last_name': obj.last_name,
            'email': obj.email,
            'groups': [],
            'id': obj.pk,
        }
        return json


@pytest.mark.django_db(transaction=True)
class TestAlbums(BaseTest):
    name = "album"
    model = models.album

    def create_test_db(self, user):
        result = {}
        self.pks = []

        # create album without parent
        album = models.album.objects.create(
            parent=None,
            title="My Album",
            description="My description",
            cover_photo=None,
            sort_name="date",
            sort_order="2015-11-08",
            revised=datetime.datetime(year=2015, month=11, day=8),
            revised_utc_offset=600,
        )
        result[album.pk] = album
        self.pks.append(album.pk)

        # create album with parent
        parent = album
        album = models.album.objects.create(
            parent=parent,
            title="My 2nd Album",
            description="My 2nd description",
            cover_photo=None,
            sort_name="date",
            sort_order="2015-11-09",
            revised=datetime.datetime(year=2015, month=11, day=10),
            revised_utc_offset=600,
        )
        result[album.pk] = album
        self.pks.append(album.pk)

        # create album with parent that has a parent
        parent = album
        album = models.album.objects.create(
            parent=parent,
            title="My 3rd Album",
            description="My 3rd description",
            cover_photo=None,
            sort_name="date",
            sort_order="2015-11-10",
            revised=datetime.datetime(year=2015, month=11, day=10),
            revised_utc_offset=600,
        )
        result[album.pk] = album
        self.pks.append(album.pk)

        # return results
        self.objs = result
        return result

    def get_test_creates(self, user):
        json = {
            'cover_photo': None,
            'cover_photo_pk': None,
            'ascendants': [],
            'title': 'My Album',
            'description': 'My description',
            'sort_name': 'date',
            'sort_order': '2015-11-08',
            'parent': None,
            'revised': '2015-11-08T00:00:00',
            'revised_utc_offset': 600,
        }
        return json

    def get_test_lists(self, user):
        l = [
            ({}, self.pks),
            ({'q': '2nd'}, [self.pks[1]]),
        ]
        return l

    def get_test_updates(self, user):
        a1, a2, a3 = self.pks

        obj = self.objs[a1]
        expected1 = self.model_to_json(obj, user)
        expected1['title'] = 'My new title #1'

        obj = self.objs[a2]
        expected2 = self.model_to_json(obj, user)
        expected2['title'] = 'My new title #2'
        expected2['ascendants'][0]['title'] = 'My new title #1'

        obj = self.objs[a3]
        expected3 = self.model_to_json(obj, user)
        expected3['title'] = 'My new title #3'
        expected3['ascendants'][0]['title'] = 'My new title #2'
        expected3['ascendants'][1]['title'] = 'My new title #1'

        return [
            (a1, {'title': 'My new title #1'}, expected1),
            (a2, {'title': 'My new title #2'}, expected2),
            (a3, {'title': 'My new title #3'}, expected3),
        ]

    def get_test_deletes(self):
        a1, a2, a3 = self.pks
        d = [
            (a1, status.HTTP_403_FORBIDDEN, {
                'detail': 'Cannot delete album with children'}),
            (a2, status.HTTP_403_FORBIDDEN, {
                'detail': 'Cannot delete album with children'}),
            (a3, status.HTTP_204_NO_CONTENT, None),
            (a2, status.HTTP_204_NO_CONTENT, None),
            (a1, status.HTTP_204_NO_CONTENT, None),
        ]
        return d

    def model_to_json(self, album, user):
        json = {
            'id': album.pk,
            'cover_photo': None,
            'cover_photo_pk': None,
            'ascendants': [],
            'title': album.title,
            'description': album.description,
            'sort_name': album.sort_name,
            'sort_order': album.sort_order,
            'parent': None,
        }
        if album.cover_photo is not None:
            json.update({
                'cover_photo': album.cover_photo.title,
                'cover_photo_pk': album.cover_photo.pk,
            })

        parent = album.parent
        ascendants = []
        while parent is not None:
            ascendants.append({
                'id': parent.pk,
                'title': parent.title,
                'cover_photo': None,
                'cover_photo_pk': None,
            })
            if parent.cover_photo is not None:
                json.update({
                    'cover_photo': parent.cover_photo.title,
                    'cover_photo_pk': parent.cover_photo.pk,
                })
            parent = parent.parent

        if album.parent is not None:
            json.update({
                'parent': album.parent.pk,
                'ascendants': ascendants,
            })
        if user is not None and user.is_staff:
            json.update({
                'revised': album.revised.isoformat(),
                'revised_utc_offset': album.revised_utc_offset,
            })
        return json
