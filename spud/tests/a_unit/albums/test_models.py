""" Run tests on album models. """
import pytest

from spud.models import album_ascendant


@pytest.mark.django_db(transaction=True)
def test_fix_ascendants_new(albums):
    album_ascendant.objects.all().delete()
    albums['Parent'].fix_ascendants()
    albums['First'].fix_ascendants()
    albums['Second'].fix_ascendants()

    qs = album_ascendant.objects.all().order_by(
        'position', 'ascendant__title', 'descendant__title')
    assert qs.count() == 5

    assert qs[0].ascendant == albums['First']
    assert qs[0].descendant == albums['First']
    assert qs[0].position == 0

    assert qs[1].ascendant == albums['Parent']
    assert qs[1].descendant == albums['Parent']
    assert qs[1].position == 0

    assert qs[2].ascendant == albums['Second']
    assert qs[2].descendant == albums['Second']
    assert qs[2].position == 0

    assert qs[3].ascendant == albums['Parent']
    assert qs[3].descendant == albums['First']
    assert qs[3].position == 1

    assert qs[4].ascendant == albums['Parent']
    assert qs[4].descendant == albums['Second']
    assert qs[4].position == 1


@pytest.mark.django_db(transaction=True)
def test_fix_ascendants_replace(albums):
    albums['Parent'].fix_ascendants()
    albums['First'].fix_ascendants()
    albums['Second'].fix_ascendants()

    qs = album_ascendant.objects.all().order_by(
        'position', 'ascendant__title', 'descendant__title')
    assert qs.count() == 5

    assert qs[0].ascendant == albums['First']
    assert qs[0].descendant == albums['First']
    assert qs[0].position == 0

    assert qs[1].ascendant == albums['Parent']
    assert qs[1].descendant == albums['Parent']
    assert qs[1].position == 0

    assert qs[2].ascendant == albums['Second']
    assert qs[2].descendant == albums['Second']
    assert qs[2].position == 0

    assert qs[3].ascendant == albums['Parent']
    assert qs[3].descendant == albums['First']
    assert qs[3].position == 1

    assert qs[4].ascendant == albums['Parent']
    assert qs[4].descendant == albums['Second']
    assert qs[4].position == 1
