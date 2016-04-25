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
import os.path
import copy
from mock import ANY

from django.contrib.auth.models import User
from django.core.urlresolvers import reverse
from django.http import QueryDict

from rest_framework import status
from rest_framework.test import APIClient

from spud import models


class unordered_list(object):
    "A helper object that compares two unordered lists."

    def __init__(self, l):
        self.l = l

    def __eq__(self, other):
        t = list(self.l)   # make a mutable copy
        try:
            for elem in other:
                t.remove(elem)
        except ValueError:
            return False
        return not t

    def __ne__(self, other):
        return not self.__eq__(other)

    def __repr__(self):
        return '<unordered_list %s>' % self.l


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


def set_cover_photo(json, cover_photo):
    if cover_photo is not None:
        json.update({
            'cover_photo': {
                'id': cover_photo.pk,
                'title': cover_photo.name,
                'description': cover_photo.description,
                'datetime': cover_photo.datetime.isoformat(),
                'utc_offset': cover_photo.utc_offset,
                'place': None,
                'thumbs': {},
                'videos': {},
                'action': None,
            },
            'cover_photo_pk': cover_photo.pk,
        })
    else:
        json.update({
            'cover_photo': None,
            'cover_photo_pk': None,
        })


def album_to_json(album, user):
    json = {
        'id': album.pk,
        'ascendants': [],
        'title': album.title,
        'description': album.description,
        'sort_name': album.sort_name,
        'sort_order': album.sort_order,
        'parent': None,
    }
    set_cover_photo(json, album.cover_photo)

    parent = album.parent
    ascendants = []
    while parent is not None:
        parent_json = {
            'id': parent.pk,
            'title': parent.title,
        }
        set_cover_photo(parent_json, parent.cover_photo)
        ascendants.append(parent_json)
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


def category_to_json(category, user):
    json = {
        'id': category.pk,
        'ascendants': [],
        'title': category.title,
        'description': category.description,
        'sort_name': category.sort_name,
        'sort_order': category.sort_order,
        'parent': None,
    }
    set_cover_photo(json, category.cover_photo)

    parent = category.parent
    ascendants = []
    while parent is not None:
        parent_json = {
            'id': parent.pk,
            'title': parent.title,
        }
        set_cover_photo(parent_json, parent.cover_photo)
        ascendants.append(parent_json)
        parent = parent.parent

    if category.parent is not None:
        json.update({
            'parent': category.parent.pk,
            'ascendants': ascendants,
        })
    return json


def place_to_json(place, user):
    json = {
        'id': place.pk,
        'ascendants': [],
        'title': place.title,
        'parent': None,
        'city': place.city,
        'country': place.country,
        'notes': place.notes,
        'postcode': place.postcode,
        'state': place.state,
        'url': place.url,
        'urldesc': place.urldesc,
    }
    set_cover_photo(json, place.cover_photo)

    parent = place.parent
    ascendants = []
    while parent is not None:
        parent_json = {
            'id': parent.pk,
            'title': parent.title,
        }
        set_cover_photo(parent_json, parent.cover_photo)
        ascendants.append(parent_json)
        parent = parent.parent

    if place.parent is not None:
        json.update({
            'parent': place.parent.pk,
            'ascendants': ascendants,
        })

    if user is not None and user.is_staff:
        json.update({
            'address': None,
            'address2': None,
        })

    return json


def person_to_simplified_json(person, user):
    json = {
        'id': person.pk,
        'title': person.first_name,
    }
    set_cover_photo(json, person.cover_photo)
    return json


def person_to_json(person, user):
    grandchildren = []
    for p in person.grandchildren():
        p_json = person_to_simplified_json(p, user)
        grandchildren.append(p_json)

    children = []
    for p in person.children():
        p_json = person_to_simplified_json(p, user)
        children.append(p_json)

    parents = []
    for p in person.parents():
        p_json = person_to_simplified_json(p, user)
        parents.append(p_json)

    grandparents = []
    for p in person.grandparents():
        p_json = person_to_simplified_json(p, user)
        grandparents.append(p_json)

    spouses = []
    for p in person.spouses():
        p_json = person_to_simplified_json(p, user)
        spouses.append(p_json)

    siblings = []
    for p in person.siblings():
        p_json = person_to_simplified_json(p, user)
        siblings.append(p_json)

    cousins = []
    for p in person.cousins():
        p_json = person_to_simplified_json(p, user)
        cousins.append(p_json)

    nephews_nieces = []
    for p in person.nephews_nieces():
        p_json = person_to_simplified_json(p, user)
        nephews_nieces.append(p_json)

    uncles_aunts = []
    for p in person.uncles_aunts():
        p_json = person_to_simplified_json(p, user)
        uncles_aunts.append(p_json)

    json = {
        'id': person.pk,
        'cover_photo': None,
        'cover_photo_pk': None,
        'first_name': person.first_name,
        'middle_name': person.middle_name,
        'last_name': person.last_name,
        'called': person.called,
        'title': person.first_name,
    }
    set_cover_photo(json, person.cover_photo)

    if user is not None and user.is_staff:
        json.update({
            'children': children,
            'cousins': cousins,
            'dob': person.dob,
            'dod': person.dod,
            'email': person.email,
            'father': None,
            'father_pk': None,
            'grandchildren': grandchildren,
            'grandparents': grandparents,
            'home': None,
            'home_pk': None,
            'mother': None,
            'mother_pk': None,
            'nephews_nieces': nephews_nieces,
            'notes': person.notes,
            'parents': parents,
            'sex': person.sex,
            'siblings': siblings,
            'spouse': None,
            'spouse_pk': None,
            'spouses': spouses,
            'uncles_aunts': uncles_aunts,
            'work': None,
            'work_pk': None,
        })
        if person.father is not None:
            p_json = person_to_simplified_json(person.father, user)
            json.update({
                'father': p_json,
                'father_pk': person.father.pk,
            })
        if person.mother is not None:
            p_json = person_to_simplified_json(person.mother, user)
            json.update({
                'mother': p_json,
                'mother_pk': person.mother.pk,
            })
        if person.spouse is not None:
            p_json = person_to_simplified_json(person.spouse, user)
            json.update({
                'spouse': p_json,
                'spouse_pk': person.spouse.pk,
            })
        if person.work is not None:
            json.update({
                'work': {
                    'id': person.work.pk,
                    'title': person.work.title,
                    'address': person.work.address,
                    'address2': person.work.address2,
                    'city': person.work.city,
                    'state': person.work.state,
                    'postcode': person.work.postcode,
                    'country': person.work.country,
                    'url': person.work.url,
                    'urldesc': person.work.urldesc,
                    'notes': person.work.notes,
                    'parent': None,
                    'ascendants': [],
                },
                'work_pk': person.work.pk,
            })
            set_cover_photo(json['work'], person.work.cover_photo)
        if person.home is not None:
            json.update({
                'home': {
                    'id': person.home.pk,
                    'title': person.home.title,
                    'address': person.home.address,
                    'address2': person.home.address2,
                    'city': person.home.city,
                    'state': person.home.state,
                    'postcode': person.home.postcode,
                    'country': person.home.country,
                    'url': person.home.url,
                    'urldesc': person.home.urldesc,
                    'notes': person.home.notes,
                    'parent': None,
                    'ascendants': [],
                },
                'home_pk': person.home.pk,
            })
            set_cover_photo(json['home'], person.home.cover_photo)

    return json


def feedback_to_json(feedback, user):
    json = {
        'id': feedback.pk,
        'comment': feedback.comment,
        'ip_address': feedback.ip_address,
        'is_public': feedback.is_public,
        'is_removed': feedback.is_removed,
        'rating': feedback.rating,
        'submit_datetime': ANY,
        'user': feedback.user,
        'user_email': feedback.user_email,
        'user_name': feedback.user_name,
        'user_url': feedback.user_url,
        'utc_offset': feedback.utc_offset,
        'parent': None,
        'ascendants': [],
    }
    set_cover_photo(json, feedback.cover_photo)

    parent = feedback.parent
    ascendants = []
    while parent is not None:
        parent_json = {
            'id': parent.pk,
            'rating': parent.rating,
            'comment': parent.comment,
            'user_name': parent.user_name,
            'user_email': parent.user_email,
            'user_url': parent.user_url,
            'submit_datetime': ANY,
            'utc_offset': parent.utc_offset,
            'ip_address': parent.ip_address,
            'is_public': parent.is_public,
            'is_removed': parent.is_removed,
            'user': parent.user,
        }
        set_cover_photo(parent_json, parent.cover_photo)
        ascendants.append(parent_json)
        parent = parent.parent

    if feedback.parent is not None:
        json.update({
            'parent': feedback.parent.pk,
            'ascendants': ascendants,
        })

    return json


def photo_relation_to_json(photo_relation, user):
    json = {
        'id': photo_relation.pk,
        'photo_1': {
            'id': photo_relation.photo_1.pk,
            'title': photo_relation.photo_1.name,
            'description': photo_relation.photo_1.description,
            'datetime': photo_relation.photo_1.datetime.isoformat(),
            'utc_offset': photo_relation.photo_1.utc_offset,
            'place': None,
            'thumbs': {},
            'videos': {},
            'action': photo_relation.photo_1.action,
        },
        'photo_1_pk': photo_relation.photo_1.pk,
        'photo_2': {
            'id': photo_relation.photo_2.pk,
            'title': photo_relation.photo_2.name,
            'description': photo_relation.photo_2.description,
            'datetime': photo_relation.photo_2.datetime.isoformat(),
            'utc_offset': photo_relation.photo_2.utc_offset,
            'place': None,
            'thumbs': {},
            'videos': {},
            'action': photo_relation.photo_2.action,
        },
        'photo_2_pk': photo_relation.photo_2.pk,
        'desc_1': photo_relation.desc_1,
        'desc_2': photo_relation.desc_2,
    }
    return json


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

    def get_test_lists(self, user):
        raise NotImplementedError()

    def get_test_updates(self, user):
        raise NotImplementedError()

    def get_test_deletes(self):
        raise NotImplementedError()

    def model_to_json(self, obj, user):
        raise NotImplementedError()

    def pks_to_json(self, pks, user):
        result = []
        for pk in pks:
            if pk is not None:
                obj = self.objs[pk]
                json = self.model_to_json(obj, user)
            else:
                json = None
            result.append(json)
        return result

    def get_list_url(self):
        return reverse('%s-list' % self.name)

    def get_detail_url(self, pk):
        return reverse('%s-detail' % self.name, args=[pk])

    def test_obj_create(self, scenario):
        client = APIClient()
        user = scenario.get_user()
        login(client, user)

        url = self.get_list_url()
        creates = self.get_test_creates(user)

        for json, expected in creates:
            response = client.post(url, json, format='json')
            if scenario.check_response(response, self.name, 'create'):
                assert response.status_code == status.HTTP_201_CREATED
                expected['id'] = response.data['id']
                assert response.data == expected

                # check obj exists
                obj = self.model.objects.get(pk=response.data['id'])
                assert self.model_to_json(obj, user) == expected

    def test_obj_list(self, scenario):
        client = APIClient()
        user = scenario.get_user()
        login(client, user)
        self.create_test_db(user)
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
                assert response.data["count"] == len(expected_list)

                results = response.data["results"]
                assert len(results) == len(expected_list)
                for data, expected in zip(results, expected_list):
                    if expected is not None:
                        assert data == expected

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
                if response.status_code != status.HTTP_204_NO_CONTENT \
                        and response.status_code != status.HTTP_404_NOT_FOUND:
                    # check obj still exists and unchanged
                    json = self.model_to_json(obj, user)
                    obj2 = self.model.objects.get(pk=obj.pk)
                    json2 = self.model_to_json(obj2, user)
                    assert json == json2
                else:
                    # check obj is deleted
                    with pytest.raises(self.model.DoesNotExist):
                        self.model.objects.get(pk=obj.pk)

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

        for pk, update, expected in updates:
            # we need to get the current version as a previous update may have
            # changed it
            url = self.get_detail_url(pk)
            response = client.get(url, format='json')
            json = response.data
            json.update(update)

            url = self.get_detail_url(pk)
            response = client.put(url, json, format='json')
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
        return [(json, json)]

    def get_test_lists(self, user):
        l = [
            ({}, self.pks_to_json([None] + self.pks, user)),
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
            title="My 1st Album",
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
        return [(json, json)]

    def get_test_lists(self, user):
        l = [
            ({}, self.pks_to_json(self.pks, user)),
            ({'q': '2nd'}, self.pks_to_json([self.pks[1]], user)),
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
        return album_to_json(album, user)


@pytest.mark.django_db(transaction=True)
class TestCategorys(BaseTest):
    name = "category"
    model = models.category

    def create_test_db(self, user):
        result = {}
        self.pks = []

        # create category without parent
        category = models.category.objects.create(
            parent=None,
            title="My 1st Category",
            description="My description",
            cover_photo=None,
            sort_name="date",
            sort_order="2015-11-08",
        )
        result[category.pk] = category
        self.pks.append(category.pk)

        # create category with parent
        parent = category
        category = models.category.objects.create(
            parent=parent,
            title="My 2nd Category",
            description="My 2nd description",
            cover_photo=None,
            sort_name="date",
            sort_order="2015-11-09",
        )
        result[category.pk] = category
        self.pks.append(category.pk)

        # create category with parent that has a parent
        parent = category
        category = models.category.objects.create(
            parent=parent,
            title="My 3rd Category",
            description="My 3rd description",
            cover_photo=None,
            sort_name="date",
            sort_order="2015-11-10",
        )
        result[category.pk] = category
        self.pks.append(category.pk)

        # return results
        self.objs = result
        return result

    def get_test_creates(self, user):
        json = {
            'cover_photo': None,
            'cover_photo_pk': None,
            'ascendants': [],
            'title': 'My Category',
            'description': 'My description',
            'sort_name': 'date',
            'sort_order': '2015-11-08',
            'parent': None,
        }
        return [(json, json)]

    def get_test_lists(self, user):
        l = [
            ({}, self.pks_to_json(self.pks, user)),
            ({'q': '2nd'}, self.pks_to_json([self.pks[1]], user)),
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
                'detail': 'Cannot delete category with children'}),
            (a2, status.HTTP_403_FORBIDDEN, {
                'detail': 'Cannot delete category with children'}),
            (a3, status.HTTP_204_NO_CONTENT, None),
            (a2, status.HTTP_204_NO_CONTENT, None),
            (a1, status.HTTP_204_NO_CONTENT, None),
        ]
        return d

    def model_to_json(self, category, user):
        return category_to_json(category, user)


@pytest.mark.django_db(transaction=True)
class TestPlaces(BaseTest):
    name = "place"
    model = models.place

    def create_test_db(self, user):
        result = {}
        self.pks = []

        # create place without parent
        place = models.place.objects.create(
            parent=None,
            title="My 1st Place",
            cover_photo=None,
        )
        result[place.pk] = place
        self.pks.append(place.pk)

        # create place with parent
        parent = place
        place = models.place.objects.create(
            parent=parent,
            title="My 2nd Place",
            cover_photo=None,
        )
        result[place.pk] = place
        self.pks.append(place.pk)

        # create place with parent that has a parent
        parent = place
        place = models.place.objects.create(
            parent=parent,
            title="My 3rd Place",
            cover_photo=None,
        )
        result[place.pk] = place
        self.pks.append(place.pk)

        # return results
        self.objs = result
        return result

    def get_test_creates(self, user):
        json = {
            'cover_photo': None,
            'cover_photo_pk': None,
            'ascendants': [],
            'title': 'My Place',
            'parent': None,
            'address': None,
            'address2': None,
            'city': None,
            'country': None,
            'notes': None,
            'postcode': None,
            'state': None,
            'url': None,
            'urldesc': None,
        }
        return [(json, json)]

    def get_test_lists(self, user):
        l = [
            ({}, self.pks_to_json(self.pks, user)),
            ({'q': '2nd'}, self.pks_to_json([self.pks[1]], user)),
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
                'detail': 'Cannot delete place with children'}),
            (a2, status.HTTP_403_FORBIDDEN, {
                'detail': 'Cannot delete place with children'}),
            (a3, status.HTTP_204_NO_CONTENT, None),
            (a2, status.HTTP_204_NO_CONTENT, None),
            (a1, status.HTTP_204_NO_CONTENT, None),
        ]
        return d

    def model_to_json(self, place, user):
        return place_to_json(place, user)


@pytest.mark.django_db(transaction=True)
class TestPersons(BaseTest):
    name = "person"
    model = models.person

    def create_test_db(self, user):
        result = {}
        self.pks = []

        place = models.place.objects.create(
            parent=None,
            title="My 1st Place",
            cover_photo=None,
        )

        person = models.person.objects.create(
            first_name="My Grandfather",
            sex="1",
            cover_photo=None,
            home=place,
        )
        grandfather = person
        result[person.pk] = person
        self.pks.append(person.pk)

        person = models.person.objects.create(
            first_name="My Grandmother",
            sex="2",
            cover_photo=None,
            spouse=grandfather,
            work=place,
        )
        grandmother = person
        result[person.pk] = person
        self.pks.append(person.pk)

        person = models.person.objects.create(
            first_name="My Father",
            sex="1",
            cover_photo=None,
        )
        father = person
        result[person.pk] = person
        self.pks.append(person.pk)

        person = models.person.objects.create(
            first_name="My Mother",
            father=grandfather,
            mother=grandmother,
            cover_photo=None,
            spouse=father,
        )
        mother = person
        result[person.pk] = person
        self.pks.append(person.pk)

        person = models.person.objects.create(
            first_name="Me",
            sex="1",
            father=father,
            mother=mother,
            cover_photo=None,
        )
        me = person
        result[person.pk] = person
        self.pks.append(person.pk)

        person = models.person.objects.create(
            first_name="My Child",
            father=me,
            mother=mother,
            cover_photo=None,
        )
        result[person.pk] = person
        self.pks.append(person.pk)

        # return results
        self.objs = result
        return result

    def get_test_creates(self, user):
        json = {
            'cover_photo': None,
            'cover_photo_pk': None,
            'first_name': 'My Person',
            'last_name': None,
            'called': None,
            'children': [],
            'cousins': [],
            'dob': None,
            'dod': None,
            'email': None,
            'father': None,
            'father_pk': None,
            'grandchildren': [],
            'grandparents': [],
            'home': None,
            'home_pk': None,
            'middle_name': None,
            'mother': None,
            'mother_pk': None,
            'nephews_nieces': [],
            'notes': None,
            'parents': [],
            'sex': '1',
            'siblings': [],
            'spouse': None,
            'spouse_pk': None,
            'spouses': [],
            'title': 'My Person',
            'uncles_aunts': [],
            'work': None,
            'work_pk': None,
        }
        return [(json, json)]

    def get_test_lists(self, user):
        grandfather, grandmother, father, mother, me, child = self.pks
        expected_list = self.pks_to_json([
            me, child, father, grandfather, grandmother, mother], user)

        for expected in expected_list:
            del expected['first_name']
            del expected['middle_name']
            del expected['last_name']
            del expected['called']
            if user is not None and user.is_staff:
                del expected['children']
                del expected['cousins']
                del expected['dob']
                del expected['dod']
                del expected['email']
                del expected['father']
                del expected['father_pk']
                del expected['grandchildren']
                del expected['grandparents']
                del expected['home']
                del expected['home_pk']
                del expected['mother']
                del expected['mother_pk']
                del expected['nephews_nieces']
                del expected['notes']
                del expected['parents']
                del expected['sex']
                del expected['siblings']
                del expected['spouse']
                del expected['spouse_pk']
                del expected['spouses']
                del expected['uncles_aunts']
                del expected['work']
                del expected['work_pk']

        l = [
            ({}, expected_list),
        ]
        return l

    def get_test_updates(self, user):
        grandfather, grandmother, father, mother, me, child = self.pks

        obj = self.objs[grandfather]
        expected1 = self.model_to_json(obj, user)
        expected1['title'] = 'My new title #1'
        if user is not None and user.is_staff:
            expected1['first_name'] = 'My new title #1'

        obj = self.objs[grandmother]
        expected2 = self.model_to_json(obj, user)
        expected2['title'] = 'My new title #2'
        if user is not None and user.is_staff:
            expected2['first_name'] = 'My new title #2'
            expected2['spouse']['title'] = 'My new title #1'
            expected2['spouses'][0]['title'] = 'My new title #1'

        obj = self.objs[mother]
        expected3 = self.model_to_json(obj, user)
        expected3['title'] = 'My new title #3'
        if user is not None and user.is_staff:
            expected3['first_name'] = 'My new title #3'
            expected3['father']['title'] = 'My new title #1'
            expected3['mother']['title'] = 'My new title #2'
            expected3['parents'][0]['title'] = 'My new title #1'
            expected3['parents'][1]['title'] = 'My new title #2'

        return [
            (grandfather, {'first_name': 'My new title #1'}, expected1),
            (grandmother, {'first_name': 'My new title #2'}, expected2),
            (mother, {'first_name': 'My new title #3'}, expected3),
        ]

    def get_test_deletes(self):
        grandfather, grandmother, father, mother, me, child = self.pks
        d = [
            (grandfather, status.HTTP_403_FORBIDDEN, {
                'detail': 'Cannot delete person that is a father, '
                'Cannot delete person that is a spouse'}),
            (grandmother, status.HTTP_403_FORBIDDEN, {
                'detail': 'Cannot delete person that is a mother'}),
            (father, status.HTTP_403_FORBIDDEN, {
                'detail': 'Cannot delete person that is a father, '
                'Cannot delete person that is a spouse'}),
            (mother, status.HTTP_403_FORBIDDEN, {
                'detail': 'Cannot delete person that is a mother'}),
            (me, status.HTTP_403_FORBIDDEN, {
                'detail': 'Cannot delete person that is a father'}),
            (child, status.HTTP_204_NO_CONTENT, None),
            (me, status.HTTP_204_NO_CONTENT, None),
            (mother, status.HTTP_204_NO_CONTENT, None),
            (father, status.HTTP_204_NO_CONTENT, None),
            (grandmother, status.HTTP_204_NO_CONTENT, None),
            (grandfather, status.HTTP_204_NO_CONTENT, None),
        ]
        return d

    def model_to_json(self, person, user):
        return person_to_json(person, user)


@pytest.mark.django_db(transaction=True)
class TestFeedbacks(BaseTest):
    name = "feedback"
    model = models.feedback

    def create_test_db(self, user):
        result = {}
        self.pks = []

        photo1 = models.photo.objects.create(
            name="test.jpg", path="a/b/c",
            level=0,
            datetime=datetime.datetime(2015, 11, 21), utc_offset=600)
        photo2 = models.photo.objects.create(
            name="test.jpg", path="a/b/c",
            level=0,
            datetime=datetime.datetime(2015, 11, 21), utc_offset=600)

        # create feedback without parent
        feedback = models.feedback.objects.create(
            parent=None,
            comment="My 1st Feedback",
            cover_photo=photo1,
            rating=10,
        )
        result[feedback.pk] = feedback
        self.pks.append(feedback.pk)

        # create feedback with parent
        parent = feedback
        feedback = models.feedback.objects.create(
            parent=parent,
            comment="My 2nd Feedback",
            cover_photo=photo2,
            rating=1,
        )
        result[feedback.pk] = feedback
        self.pks.append(feedback.pk)

        # create feedback with parent that has a parent
        parent = feedback
        feedback = models.feedback.objects.create(
            parent=parent,
            comment="My 3rd Feedback",
            cover_photo=photo2,
            rating=0,
        )
        result[feedback.pk] = feedback
        self.pks.append(feedback.pk)

        # return results
        self.objs = result
        return result

    def get_test_creates(self, user):
        photo = models.photo.objects.create(
            name="test.jpg", path="a/b/c",
            level=0,
            datetime=datetime.datetime(2015, 11, 21), utc_offset=600)

        json = {
            'comment': "This is my comment",
            'ip_address': "1.2.3.4",
            'is_public': True,
            'is_removed': False,
            'rating': 0,
            'user': None,
            'user_email': "secret@example.org",
            'user_name': "It is a secret",
            'user_url': "http://www.example.org/",
            'parent': None,
            'ascendants': [],
        }
        set_cover_photo(json, photo)

        expected = dict(json)
        expected.update({
            'submit_datetime': ANY,
            'utc_offset': ANY,
        })

        return [(json, expected)]

    def get_test_lists(self, user):
        l = [
            ({}, self.pks_to_json(self.pks, user)),
            ({'q': '2nd'}, self.pks_to_json([self.pks[1]], user)),
        ]
        return l

    def get_test_updates(self, user):
        a1, a2, a3 = self.pks

        obj = self.objs[a1]
        expected1 = self.model_to_json(obj, user)
        expected1['comment'] = 'My new title #1'

        obj = self.objs[a2]
        expected2 = self.model_to_json(obj, user)
        expected2['comment'] = 'My new title #2'
        expected2['ascendants'][0]['comment'] = 'My new title #1'

        obj = self.objs[a3]
        expected3 = self.model_to_json(obj, user)
        expected3['comment'] = 'My new title #3'
        expected3['ascendants'][0]['comment'] = 'My new title #2'
        expected3['ascendants'][1]['comment'] = 'My new title #1'

        return [
            (a1, {'comment': 'My new title #1'}, expected1),
            (a2, {'comment': 'My new title #2'}, expected2),
            (a3, {'comment': 'My new title #3'}, expected3),
        ]

    def get_test_deletes(self):
        a1, a2, a3 = self.pks
        d = [
            (a1, status.HTTP_204_NO_CONTENT, None),
            (a2, status.HTTP_404_NOT_FOUND, {'detail': 'Not found.'}),
            (a3, status.HTTP_404_NOT_FOUND, {'detail': 'Not found.'}),
        ]
        return d

    def model_to_json(self, feedback, user):
        return feedback_to_json(feedback, user)


@pytest.mark.django_db(transaction=True)
class TestPhotoRelations(BaseTest):
    name = "photo_relation"
    model = models.photo_relation

    def create_test_db(self, user):
        result = {}
        self.pks = []

        photo1 = models.photo.objects.create(
            name="test.jpg", path="a/b/c",
            level=0,
            datetime=datetime.datetime(2015, 11, 21), utc_offset=600)
        photo2 = models.photo.objects.create(
            name="test.jpg", path="a/b/c",
            level=0,
            datetime=datetime.datetime(2015, 11, 21), utc_offset=600)

        photo_relation = models.photo_relation.objects.create(
            photo_1=photo1,
            photo_2=photo2,
            desc_1="description 1",
            desc_2="description 2",
        )
        result[photo_relation.pk] = photo_relation
        self.pks.append(photo_relation.pk)

        # return results
        self.objs = result
        return result

    def get_test_creates(self, user):
        photo1 = models.photo.objects.create(
            name="test.jpg", path="a/b/c",
            level=0,
            datetime=datetime.datetime(2015, 11, 21), utc_offset=600)
        photo2 = models.photo.objects.create(
            name="test.jpg", path="a/b/c",
            level=0,
            datetime=datetime.datetime(2015, 11, 21), utc_offset=600)

        json = {
            'photo_1': {
                'id': photo1.pk,
                'title': photo1.name,
                'description': photo1.description,
                'datetime': photo1.datetime.isoformat(),
                'utc_offset': photo1.utc_offset,
                'place': None,
                'thumbs': {},
                'videos': {},
                'action': None,
            },
            'photo_1_pk': photo1.pk,
            'photo_2': {
                'id': photo2.pk,
                'title': photo2.name,
                'description': photo2.description,
                'datetime': photo2.datetime.isoformat(),
                'utc_offset': photo2.utc_offset,
                'place': None,
                'thumbs': {},
                'videos': {},
                'action': None,
            },
            'photo_2_pk': photo2.pk,
            'desc_1': 'description 1',
            'desc_2': 'description 2',
        }
        return [(json, json)]

    def get_test_lists(self, user):
        l = [
            ({}, self.pks_to_json(self.pks, user)),
        ]
        return l

    def get_test_updates(self, user):
        pr = self.pks[0]

        obj = self.objs[pr]
        expected1 = self.model_to_json(obj, user)
        expected1['desc_1'] = 'My new desc #1'
        expected1['desc_2'] = 'My new desc #2'

        return [
            (pr,
             {'desc_1': 'My new desc #1', 'desc_2': 'My new desc #2'},
             expected1),
        ]

    def get_test_deletes(self):
        pr = self.pks[0]
        d = [
            (pr, status.HTTP_204_NO_CONTENT, None),
        ]
        return d

    def model_to_json(self, photo_relation, user):
        return photo_relation_to_json(photo_relation, user)


@pytest.mark.django_db(transaction=True)
class TestPhotos(BaseTest):
    name = "photo"
    model = models.photo

    def create_test_db(self, user):
        result = {}
        self.pks = []

        self.album = models.album.objects.create(
            parent=None,
            title="My 1st Album",
            description="My description",
            cover_photo=None,
            sort_name="date",
            sort_order="2015-11-08",
            revised=datetime.datetime(year=2015, month=11, day=8),
            revised_utc_offset=600,
        )

        self.album2 = models.album.objects.create(
            parent=None,
            title="My 2nd Album",
            description="My 2nd description",
            cover_photo=None,
            sort_name="date",
            sort_order="2015-11-08",
            revised=datetime.datetime(year=2015, month=11, day=8),
            revised_utc_offset=600,
        )

        self.category = models.category.objects.create(
            parent=None,
            title="My 1st Category",
            description="My description",
            cover_photo=None,
            sort_name="date",
            sort_order="2015-11-08",
        )

        self.category2 = models.category.objects.create(
            parent=None,
            title="My 2nd Category",
            description="My 2nd description",
            cover_photo=None,
            sort_name="date",
            sort_order="2015-11-08",
        )

        self.place = models.place.objects.create(
            parent=None,
            title="My 1st Place",
            cover_photo=None,
        )

        self.person = models.person.objects.create(
            first_name="My Grandfather",
            sex="1",
            cover_photo=None,
            home=self.place,
        )

        self.person2 = models.person.objects.create(
            first_name="My Grandmother",
            sex="2",
            cover_photo=None,
            home=self.place,
            spouse=self.person,
        )

        photo = models.photo.objects.create(
            name="test.jpg", path="a/b/c",
            level=0,
            datetime=datetime.datetime(2015, 11, 21), utc_offset=600)
        result[photo.pk] = photo
        self.pks.append(photo.pk)

        photo = models.photo.objects.create(
            name="test.jpg", path="a/b/c",
            level=0,
            datetime=datetime.datetime(2015, 11, 21), utc_offset=600,
            place=self.place,
            photographer=self.person,
            )
        result[photo.pk] = photo
        self.pks.append(photo.pk)

        models.photo_album.objects.create(photo=photo, album=self.album)
        models.photo_category.objects.create(photo=photo,
                                             category=self.category)
        models.photo_person.objects.create(
            photo=photo, person=self.person, position=0)
        models.photo_thumb.objects.create(
            photo=photo, size="normal", width=100, height=100)
        models.photo_video.objects.create(
            photo=photo, size="normal", width=100, height=100,
            format="avi", extension="avi")

        # return results
        self.objs = result
        return result

    def get_test_creates(self, user):
        album1 = models.album.objects.create(
            parent=None,
            title="My 1st Album",
            description="My description",
            cover_photo=None,
            sort_name="date",
            sort_order="2015-11-08",
            revised=datetime.datetime(year=2015, month=11, day=8),
            revised_utc_offset=600,
        )

        album2 = models.album.objects.create(
            parent=None,
            title="My 1st Album",
            description="My description",
            cover_photo=None,
            sort_name="date",
            sort_order="2015-11-09",
            revised=datetime.datetime(year=2015, month=11, day=8),
            revised_utc_offset=600,
        )

        category1 = models.category.objects.create(
            parent=None,
            title="My 1st Category",
            description="My description",
            cover_photo=None,
            sort_name="date",
            sort_order="2015-11-08",
        )

        category2 = models.category.objects.create(
            parent=None,
            title="My 1st Category",
            description="My description",
            cover_photo=None,
            sort_name="date",
            sort_order="2015-11-09",
        )

        place = models.place.objects.create(
            parent=None,
            title="My 1st Place",
            cover_photo=None,
        )

        person1 = models.person.objects.create(
            first_name="My Grandfather",
            sex="1",
            cover_photo=None,
            home=place,
        )

        person2 = models.person.objects.create(
            first_name="My Grandmother",
            sex="2",
            cover_photo=None,
            home=place,
            spouse=person1,
        )

        result = []
        json = {
            'title': 'My Photo',
            'photo': "177A0782.JPG",
            'description': 'My Description',
            'datetime': "2015-11-22T11:00:00",
            'utc_offset': 600,
            'albums_pk': [album1.pk, album2.pk],
            'categorys_pk': [category1.pk, category2.pk],
            'place_pk': place.pk,
            'persons_pk': [person2.pk, person1.pk],
            'photographer_pk': person1.pk,
            'level': 1,
        }

        expected = dict(json)
        del expected['photo']
        expected.update({
            'thumbs': {
                'large': {
                    'id': ANY,
                    'url': '/images/thumb/large/2015/11/22/177A0782.jpg',
                    'size': 'large',
                    'width': 960,
                    'height': 640,
                    'photo': ANY,
                },
                'mid': {
                    'id': ANY,
                    'url': '/images/thumb/mid/2015/11/22/177A0782.jpg',
                    'size': 'mid',
                    'width': 480,
                    'height': 320,
                    'photo': ANY,
                },
                'thumb': {
                    'id': ANY,
                    'url': '/images/thumb/thumb/2015/11/22/177A0782.jpg',
                    'size': 'thumb',
                    'width': 120,
                    'height': 80,
                    'photo': ANY,
                },
            },
            'videos': {},
            'action': None,
            'albums': [
                album_to_json(album1, user),
                album_to_json(album2, user),
            ],
            'aperture': 'F4.0',
            'camera_make': 'Canon',
            'camera_model': 'Canon EOS 5D Mark III',
            'categorys': [
                category_to_json(category1, user),
                category_to_json(category2, user),
            ],
            'ccd_width': None,
            'comment': None,
            'compression': None,
            'exposure': '0.025',
            'feedbacks': [],
            'flash_used': 'N',
            'focal_length': '24',
            'focus_dist': '4.65227002571893',
            'iso_equiv': '2500',
            'metering_mode': 'pattern',
            'name': '177A0782.JPG',
            'orig_url': '/images/orig/2015/11/22/177A0782.JPG',
            'path': '2015/11/22',
            'persons': [
                person_to_simplified_json(person2, user),
                person_to_simplified_json(person1, user),
            ],
            'photographer': person_to_simplified_json(person1, user),
            'place': place_to_json(place, user),
            'rating': None,
            'relations': [],
            'size': 7784354,
            'timestamp': ANY,
            'view': None
        })
        result.append((json, expected))

        json = {
            'title': 'My Video',
            'photo': "177A4628.MOV",
            'description': 'My Description',
            'datetime': "2015-11-22T12:00:00",
            'utc_offset': 600,
            'albums_pk': [album1.pk, album2.pk],
            'categorys_pk': [category1.pk, category2.pk],
            'place_pk': place.pk,
            'persons_pk': [person2.pk, person1.pk],
            'photographer_pk': person1.pk,
            'level': 1,
        }

        expected = dict(json)
        del expected['photo']
        expected.update({
            'thumbs': {
                'large': {
                    'id': ANY,
                    'url': '/images/thumb/large/2015/11/22/177A4628.jpg',
                    'size': 'large',
                    'width': 960,
                    'height': 540,
                    'photo': ANY,
                },
                'mid': {
                    'id': ANY,
                    'url': '/images/thumb/mid/2015/11/22/177A4628.jpg',
                    'size': 'mid',
                    'width': 480,
                    'height': 270,
                    'photo': ANY,
                },
                'thumb': {
                    'id': ANY,
                    'url': '/images/thumb/thumb/2015/11/22/177A4628.jpg',
                    'size': 'thumb',
                    'width': 120,
                    'height': 67,
                    'photo': ANY,
                },
            },
            'videos': {
                '320': unordered_list([
                    {
                        'id': ANY,
                        'url': '/images/video/320/2015/11/22/177A4628.webm',
                        'size': '320',
                        'width': 568,
                        'height': 320,
                        'format': 'video/webm',
                        'extension': 'webm',
                        'photo': ANY,
                    },
                    {
                        'id': ANY,
                        'url': '/images/video/320/2015/11/22/177A4628.mp4',
                        'size': '320',
                        'width': 568,
                        'height': 320,
                        'format': 'video/mp4',
                        'extension': 'mp4',
                        'photo': ANY,
                    },
                    {
                        'id': ANY,
                        'url': '/images/video/320/2015/11/22/177A4628.ogv',
                        'size': '320',
                        'width': 568,
                        'height': 320,
                        'format': 'video/ogg',
                        'extension': 'ogv',
                        'photo': ANY,
                    },
                ])
            },
            'action': None,
            'albums': [
                album_to_json(album1, user),
                album_to_json(album2, user),
            ],
            'aperture': 'F22.0',
            'camera_make': 'Canon',
            'camera_model': 'Canon EOS 5D Mark III',
            'categorys': [
                category_to_json(category1, user),
                category_to_json(category2, user),
            ],
            'ccd_width': None,
            'comment': None,
            'compression': None,
            'exposure': None,
            'feedbacks': [],
            'flash_used': 'N',
            'focal_length': '28',
            'focus_dist': '1.15131934983926',
            'iso_equiv': '0',
            'metering_mode': 'center weighted average',
            'name': '177A4628.MOV',
            'orig_url': '/images/orig/2015/11/22/177A4628.MOV',
            'path': '2015/11/22',
            'persons': [
                person_to_simplified_json(person2, user),
                person_to_simplified_json(person1, user),
            ],
            'photographer': person_to_simplified_json(person1, user),
            'place': place_to_json(place, user),
            'rating': None,
            'relations': [],
            'size': 3372332,
            'timestamp': ANY,
            'view': None
        })

        result.append((json, expected))

        return result

    def test_obj_create(self, scenario, data_files, settings, tmpdir):
        settings.IMAGE_PATH = tmpdir.dirname

        client = APIClient()
        user = scenario.get_user()
        login(client, user)

        url = self.get_list_url()
        creates = self.get_test_creates(user)

        for json, expected in creates:

            filename = os.path.join(data_files, json['photo'])
            with open(filename, 'rb') as f:
                json['photo'] = f
                response = client.post(url, json, format="multipart")

            if scenario.check_response(response, self.name, 'create'):
                assert response.status_code == status.HTTP_201_CREATED
                expected['id'] = response.data['id']
                assert response.data == expected

                # check obj exists
                obj = self.model.objects.get(pk=response.data['id'])
                assert self.model_to_json(obj, user) == expected

    def get_test_lists(self, user):
        json_list = self.pks_to_json(self.pks, user)
        for json in json_list:
            del json['albums']
            del json['albums_pk']
            del json['aperture']
            del json['camera_make']
            del json['camera_model']
            del json['categorys']
            del json['categorys_pk']
            del json['ccd_width']
            del json['comment']
            del json['compression']
            del json['exposure']
            del json['feedbacks']
            del json['flash_used']
            del json['focal_length']
            del json['focus_dist']
            del json['iso_equiv']
            del json['level']
            del json['metering_mode']
            del json['path']
            del json['persons']
            del json['persons_pk']
            del json['photographer']
            del json['photographer_pk']
            del json['place_pk']
            del json['rating']
            del json['relations']
            del json['size']
            del json['timestamp']
            del json['view']
            del json['name']
            if json['place'] is not None:
                if user is not None and user.is_staff:
                    del json['place']['address']
                    del json['place']['address2']
                del json['place']['ascendants']
                del json['place']['city']
                del json['place']['country']
                del json['place']['cover_photo']
                del json['place']['cover_photo_pk']
                del json['place']['notes']
                del json['place']['parent']
                del json['place']['postcode']
                del json['place']['state']
                del json['place']['url']
                del json['place']['urldesc']
            if user is not None and user.is_staff:
                del json['orig_url']
        l = [
            ({}, json_list),
        ]
        return l

    def get_test_updates(self, user):
        p = self.pks[0]

        obj = self.objs[p]
        expected = self.model_to_json(obj, user)

        def update(dict):
            expected.update(dict)
            tmp = copy.deepcopy(expected)
            return tmp

        return [
            # name is read only
            (p,
             {'name': 'My new name.jpg'},
             update({})),

            # update description
            (p,
             {'description': 'My new description'},
             update({'description': 'My new description'})),

            # -------------
            # set albums
            (p,
             {'albums_pk': [self.album.pk]},
             update({
                 'albums': [album_to_json(self.album, user)],
                 'albums_pk': [self.album.pk]})),

            # set albums
            (p,
             {'albums_pk': []},
             update({
                 'albums': [],
                 'albums_pk': []})),

            # add album
            (p,
             {'add_albums_pk':  [self.album2.pk]},
             update({
                 'albums': [album_to_json(self.album2, user)],
                 'albums_pk': [self.album2.pk]})),

            # add album
            (p,
             {'add_albums_pk':  [self.album.pk]},
             update({
                 'albums': unordered_list([
                     album_to_json(self.album2, user),
                     album_to_json(self.album, user)]),
                 'albums_pk': unordered_list([
                     self.album2.pk, self.album.pk])})),

            # remove album
            (p,
             {'rem_albums_pk':  [self.album2.pk]},
             update({
                 'albums': [album_to_json(self.album, user)],
                 'albums_pk': [self.album.pk]})),

            # remove album
            (p,
             {'rem_albums_pk':  [self.album.pk]},
             update({
                 'albums': [],
                 'albums_pk': []})),


            # -------------
            # set categorys
            (p,
             {'categorys_pk': [self.category.pk]},
             update({
                 'categorys': [category_to_json(self.category, user)],
                 'categorys_pk': [self.category.pk]})),

            # set categorys
            (p,
             {'categorys_pk': []},
             update({
                 'categorys': [],
                 'categorys_pk': []})),

            # add category
            (p,
             {'add_categorys_pk':  [self.category2.pk]},
             update({
                 'categorys': [category_to_json(self.category2, user)],
                 'categorys_pk': [self.category2.pk]})),

            # add category
            (p,
             {'add_categorys_pk':  [self.category.pk]},
             update({
                 'categorys': unordered_list([
                     category_to_json(self.category2, user),
                     category_to_json(self.category, user)]),
                 'categorys_pk': unordered_list([
                     self.category2.pk, self.category.pk])})),

            # remove category
            (p,
             {'rem_categorys_pk':  [self.category2.pk]},
             update({
                 'categorys': [category_to_json(self.category, user)],
                 'categorys_pk': [self.category.pk]})),

            # remove category
            (p,
             {'rem_categorys_pk':  [self.category.pk]},
             update({
                 'categorys': [],
                 'categorys_pk': []})),


            # -------------
            # set persons
            (p,
             {'persons_pk': [self.person.pk]},
             update({
                 'persons': [person_to_simplified_json(self.person, user)],
                 'persons_pk': [self.person.pk]})),

            # set persons
            (p,
             {'persons_pk': []},
             update({
                 'persons': [],
                 'persons_pk': []})),

            # add person
            (p,
             {'add_persons_pk':  [self.person2.pk]},
             update({
                 'persons': [person_to_simplified_json(self.person2, user)],
                 'persons_pk': [self.person2.pk]})),

            # add person
            (p,
             {'add_persons_pk':  [self.person.pk]},
             update({
                 'persons': [
                     person_to_simplified_json(self.person2, user),
                     person_to_simplified_json(self.person, user)],
                 'persons_pk': [self.person2.pk, self.person.pk]})),

            # remove person
            (p,
             {'rem_persons_pk':  [self.person2.pk]},
             update({
                 'persons': [person_to_simplified_json(self.person, user)],
                 'persons_pk': [self.person.pk]})),

            # remove person
            (p,
             {'rem_persons_pk':  [self.person.pk]},
             update({
                 'persons': [],
                 'persons_pk': []})),
        ]

    def get_test_deletes(self):
        p = self.pks[0]
        d = [
            (p, status.HTTP_204_NO_CONTENT, None),
        ]
        return d

    def model_to_json(self, photo, user):
        json = {
            'id': photo.pk,
            'title': photo.title or photo.name,
            'name': photo.name,
            'description': photo.description,
            'datetime': photo.datetime.isoformat(),
            'utc_offset': photo.utc_offset,
            'place': None,
            'place_pk': None,
            'thumbs': {},
            'videos': {},
            'action': photo.action,
            'albums': [],
            'albums_pk': [],
            'aperture': photo.aperture,
            'camera_make': photo.camera_make,
            'camera_model': photo.camera_model,
            'categorys': [],
            'categorys_pk': [],
            'ccd_width': photo.ccd_width,
            'comment': photo.comment,
            'compression': photo.compression,
            'exposure': photo.exposure,
            'feedbacks': [],
            'flash_used': photo.flash_used,
            'focal_length': photo.focal_length,
            'focus_dist': photo.focus_dist,
            'iso_equiv': photo.iso_equiv,
            'level': photo.level,
            'metering_mode': photo.metering_mode,
            'path': photo.path,
            'persons': [],
            'persons_pk': [],
            'photographer': None,
            'photographer_pk': None,
            'rating': photo.rating,
            'relations': [],
            'size': photo.size,
            'timestamp': ANY,
            'view': photo.view,
        }

        if photo.photographer is not None:
            json.update({
                'photographer': person_to_simplified_json(
                    photo.photographer, user),
                'photographer_pk': photo.photographer.pk,
            })

        if photo.place is not None:
            json.update({
                'place': place_to_json(photo.place, user),
                'place_pk': photo.place.pk,
            })

        for pa in photo.photo_album_set.all():
            album_json = album_to_json(pa.album, user)
            json['albums_pk'].append(pa.album.pk)
            json['albums'].append(album_json)

        for pc in photo.photo_category_set.all():
            category_json = category_to_json(pc.category, user)
            json['categorys_pk'].append(pc.category.pk)
            json['categorys'].append(category_json)

        for pp in photo.photo_person_set.all():
            person_json = person_to_simplified_json(pp.person, user)
            json['persons_pk'].append(pp.person.pk)
            json['persons'].append(person_json)

        for pt in photo.photo_thumb_set.all():
            json['thumbs'][pt.size] = {
                'id': pt.pk,
                'url': pt.get_url(),
                'size': pt.size,
                'width': pt.width,
                'height': pt.height,
                'photo': pt.photo.pk,
            }
        for pv in photo.photo_video_set.all():
            if pv.size not in json['videos']:
                json['videos'][pv.size] = []
            json['videos'][pv.size].append({
                'id': pv.pk,
                'url': pv.get_url(),
                'size': pv.size,
                'width': pv.width,
                'height': pv.height,
                'photo': pv.photo.pk,
                'format': pv.format,
                'extension': pv.extension,
            })

        if user is not None and user.is_staff:
            json.update({
                'orig_url': photo.get_orig_url(),
            })

        return json
