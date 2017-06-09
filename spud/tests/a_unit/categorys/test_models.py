""" Run tests on category models. """
import pytest

from spud.models import category_ascendant


@pytest.mark.django_db(transaction=True)
def test_fix_ascendants_new(categorys):
    category_ascendant.objects.all().delete()
    categorys['Parent'].fix_ascendants()
    categorys['First'].fix_ascendants()
    categorys['Second'].fix_ascendants()

    qs = category_ascendant.objects.all().order_by(
        'position', 'ascendant__title', 'descendant__title')
    assert qs.count() == 5

    assert qs[0].ascendant == categorys['First']
    assert qs[0].descendant == categorys['First']
    assert qs[0].position == 0

    assert qs[1].ascendant == categorys['Parent']
    assert qs[1].descendant == categorys['Parent']
    assert qs[1].position == 0

    assert qs[2].ascendant == categorys['Second']
    assert qs[2].descendant == categorys['Second']
    assert qs[2].position == 0

    assert qs[3].ascendant == categorys['Parent']
    assert qs[3].descendant == categorys['First']
    assert qs[3].position == 1

    assert qs[4].ascendant == categorys['Parent']
    assert qs[4].descendant == categorys['Second']
    assert qs[4].position == 1


@pytest.mark.django_db(transaction=True)
def test_fix_ascendants_replace(categorys):
    categorys['Parent'].fix_ascendants()
    categorys['First'].fix_ascendants()
    categorys['Second'].fix_ascendants()

    qs = category_ascendant.objects.all().order_by(
        'position', 'ascendant__title', 'descendant__title')
    assert qs.count() == 5

    assert qs[0].ascendant == categorys['First']
    assert qs[0].descendant == categorys['First']
    assert qs[0].position == 0

    assert qs[1].ascendant == categorys['Parent']
    assert qs[1].descendant == categorys['Parent']
    assert qs[1].position == 0

    assert qs[2].ascendant == categorys['Second']
    assert qs[2].descendant == categorys['Second']
    assert qs[2].position == 0

    assert qs[3].ascendant == categorys['Parent']
    assert qs[3].descendant == categorys['First']
    assert qs[3].position == 1

    assert qs[4].ascendant == categorys['Parent']
    assert qs[4].descendant == categorys['Second']
    assert qs[4].position == 1
