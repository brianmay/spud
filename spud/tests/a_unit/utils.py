""" Helper functions for unit tests. """
from django.db.models import Q


class MyQ(Q):
    def __eq__(self, other):
        if not isinstance(other, Q):
            return False
        if self.connector != other.connector:
            return False
        if self.children != other.children:
            return False
        if self.negated != other.negated:
            return False
        return True
