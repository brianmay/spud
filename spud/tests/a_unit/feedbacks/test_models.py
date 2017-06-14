""" Run tests on feedback models. """
import pytest

from spud.models import feedback_ascendant


@pytest.mark.django_db(transaction=True)
def test_fix_ascendants_new(feedbacks):
    feedback_ascendant.objects.all().delete()
    feedbacks['Parent'].fix_ascendants()
    feedbacks['First'].fix_ascendants()
    feedbacks['Second'].fix_ascendants()

    qs = feedback_ascendant.objects.all().order_by(
        'position', 'ascendant__rating', 'descendant__rating')
    assert qs.count() == 5

    assert qs[0].ascendant == feedbacks['First']
    assert qs[0].descendant == feedbacks['First']
    assert qs[0].position == 0

    assert qs[1].ascendant == feedbacks['Parent']
    assert qs[1].descendant == feedbacks['Parent']
    assert qs[1].position == 0

    assert qs[2].ascendant == feedbacks['Second']
    assert qs[2].descendant == feedbacks['Second']
    assert qs[2].position == 0

    assert qs[3].ascendant == feedbacks['Parent']
    assert qs[3].descendant == feedbacks['First']
    assert qs[3].position == 1

    assert qs[4].ascendant == feedbacks['Parent']
    assert qs[4].descendant == feedbacks['Second']
    assert qs[4].position == 1


@pytest.mark.django_db(transaction=True)
def test_fix_ascendants_replace(feedbacks):
    feedbacks['Parent'].fix_ascendants()
    feedbacks['First'].fix_ascendants()
    feedbacks['Second'].fix_ascendants()

    qs = feedback_ascendant.objects.all().order_by(
        'position', 'ascendant__rating', 'descendant__rating')
    assert qs.count() == 5

    assert qs[0].ascendant == feedbacks['First']
    assert qs[0].descendant == feedbacks['First']
    assert qs[0].position == 0

    assert qs[1].ascendant == feedbacks['Parent']
    assert qs[1].descendant == feedbacks['Parent']
    assert qs[1].position == 0

    assert qs[2].ascendant == feedbacks['Second']
    assert qs[2].descendant == feedbacks['Second']
    assert qs[2].position == 0

    assert qs[3].ascendant == feedbacks['Parent']
    assert qs[3].descendant == feedbacks['First']
    assert qs[3].position == 1

    assert qs[4].ascendant == feedbacks['Parent']
    assert qs[4].descendant == feedbacks['Second']
    assert qs[4].position == 1
