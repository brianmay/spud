""" Run tests on place models. """
import pytest

from spud.models import place_ascendant


@pytest.mark.django_db(transaction=True)
def test_fix_ascendants_new(places):
    place_ascendant.objects.all().delete()
    places['Parent'].fix_ascendants()
    places['First'].fix_ascendants()
    places['Second'].fix_ascendants()

    qs = place_ascendant.objects.all().order_by(
        'position', 'ascendant__title', 'descendant__title')
    assert qs.count() == 5

    assert qs[0].ascendant == places['First']
    assert qs[0].descendant == places['First']
    assert qs[0].position == 0

    assert qs[1].ascendant == places['Parent']
    assert qs[1].descendant == places['Parent']
    assert qs[1].position == 0

    assert qs[2].ascendant == places['Second']
    assert qs[2].descendant == places['Second']
    assert qs[2].position == 0

    assert qs[3].ascendant == places['Parent']
    assert qs[3].descendant == places['First']
    assert qs[3].position == 1

    assert qs[4].ascendant == places['Parent']
    assert qs[4].descendant == places['Second']
    assert qs[4].position == 1


@pytest.mark.django_db(transaction=True)
def test_fix_ascendants_replace(places):
    places['Parent'].fix_ascendants()
    places['First'].fix_ascendants()
    places['Second'].fix_ascendants()

    qs = place_ascendant.objects.all().order_by(
        'position', 'ascendant__title', 'descendant__title')
    assert qs.count() == 5

    assert qs[0].ascendant == places['First']
    assert qs[0].descendant == places['First']
    assert qs[0].position == 0

    assert qs[1].ascendant == places['Parent']
    assert qs[1].descendant == places['Parent']
    assert qs[1].position == 0

    assert qs[2].ascendant == places['Second']
    assert qs[2].descendant == places['Second']
    assert qs[2].position == 0

    assert qs[3].ascendant == places['Parent']
    assert qs[3].descendant == places['First']
    assert qs[3].position == 1

    assert qs[4].ascendant == places['Parent']
    assert qs[4].descendant == places['Second']
    assert qs[4].position == 1
