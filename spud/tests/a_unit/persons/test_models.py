""" Run tests on person models. """
import pytest

from spud.models import person_ascendant


@pytest.mark.django_db(transaction=True)
def test_fix_ascendants_new(persons):
    person_ascendant.objects.all().delete()
    persons['Parent'].fix_ascendants()
    persons['First'].fix_ascendants()
    persons['Second'].fix_ascendants()

    qs = person_ascendant.objects.all().order_by(
        'position', 'ascendant__first_name', 'descendant__first_name')
    assert qs.count() == 5

    assert qs[0].ascendant == persons['First']
    assert qs[0].descendant == persons['First']
    assert qs[0].position == 0

    assert qs[1].ascendant == persons['Parent']
    assert qs[1].descendant == persons['Parent']
    assert qs[1].position == 0

    assert qs[2].ascendant == persons['Second']
    assert qs[2].descendant == persons['Second']
    assert qs[2].position == 0

    assert qs[3].ascendant == persons['Parent']
    assert qs[3].descendant == persons['First']
    assert qs[3].position == 1

    assert qs[4].ascendant == persons['Parent']
    assert qs[4].descendant == persons['Second']
    assert qs[4].position == 1


@pytest.mark.django_db(transaction=True)
def test_fix_ascendants_replace(persons):
    persons['Parent'].fix_ascendants()
    persons['First'].fix_ascendants()
    persons['Second'].fix_ascendants()

    qs = person_ascendant.objects.all().order_by(
        'position', 'ascendant__first_name', 'descendant__first_name')
    assert qs.count() == 5

    assert qs[0].ascendant == persons['First']
    assert qs[0].descendant == persons['First']
    assert qs[0].position == 0

    assert qs[1].ascendant == persons['Parent']
    assert qs[1].descendant == persons['Parent']
    assert qs[1].position == 0

    assert qs[2].ascendant == persons['Second']
    assert qs[2].descendant == persons['Second']
    assert qs[2].position == 0

    assert qs[3].ascendant == persons['Parent']
    assert qs[3].descendant == persons['First']
    assert qs[3].position == 1

    assert qs[4].ascendant == persons['Parent']
    assert qs[4].descendant == persons['Second']
    assert qs[4].position == 1
