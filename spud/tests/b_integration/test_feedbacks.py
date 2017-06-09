import pytest
from pytest_bdd import scenarios, when, then, parsers
import six

from spud import models

scenarios('feedbacks.feature')


@when('we create a feedback')
def step_create_feedback(session, photo):
    url = "/api/feedbacks/"
    data = {
        'cover_photo_pk': photo.pk,
        'comment': 'comment',
        'rating': 10,
        'parent': None,
    }
    session.post(url, json=data)


@when('we update a feedback with id <id>')
def step_update_feedback(session, feedbacks, photo, id):
    url = "/api/feedbacks/%d/" % int(id)
    data = {
        'cover_photo_pk': photo.pk,
        'comment': 'new comment',
        'rating': -10,
        'parent': None,
    }
    session.put(url, json=data)


@when('we patch a feedback with id <id>')
def step_patch_feedback(session, feedbacks, id):
    url = "/api/feedbacks/%d/" % int(id)
    data = {
        'comment': 'new comment',
        'rating': -10,
    }
    session.patch(url, json=data)


@when('we get a feedback with id <id>')
def step_get_feedback(session, feedbacks, id):
    url = "/api/feedbacks/%d/" % int(id)
    session.get(url)


@when('we delete a feedback with id <id>')
def step_delete_feedback(session, feedbacks, id):
    url = "/api/feedbacks/%d/" % int(id)
    session.delete(url)


@when('we list all feedbacks')
def step_list_feedbacks(session, feedbacks):
    url = "/api/feedbacks/"
    session.get(url)


@then(parsers.cfparse(
    'the feedback <id> comment should be {comment}'))
def step_test_feedback_comment(id, comment):
    feedback = models.feedback.objects.get(pk=int(id))
    assert feedback.comment == comment


@then('the feedback with id <id> should exist')
def step_test_feedback_valid(id):
    models.feedback.objects.get(pk=int(id))


@then('the feedback with id <id> should not exist')
def step_test_feedback_not_exist(id):
    with pytest.raises(models.feedback.DoesNotExist):
        models.feedback.objects.get(pk=int(id))


@then('we should get a valid feedback')
def step_test_r_valid_feedback(session):
    feedback = session.obj
    assert isinstance(feedback['ascendants'], list)
    assert isinstance(feedback['cover_photo'], (type(None), dict))
    assert isinstance(feedback['comment'], six.string_types)
    assert isinstance(feedback['parent'], (type(None), int))


@then(parsers.cfparse(
    'we should get a feedback with comment {comment}'))
def step_test_r_feedback_comment(session, comment):
    feedback = session.obj
    assert feedback['comment'] == comment


@then(parsers.cfparse('we should get {number:d} valid feedbacks'))
def step_test_r_n_results(session, number):
    data = session.obj
    assert data['count'] == number
    assert len(data['results']) == number

    for feedback in data['results']:
        assert isinstance(feedback['ascendants'], list)
        assert isinstance(feedback['cover_photo'], (type(None), dict))
        assert isinstance(feedback['comment'], six.string_types)
        assert isinstance(feedback['parent'], (type(None), int))
