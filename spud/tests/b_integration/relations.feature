@django_db
Feature: Testing relations

    Scenario Outline: Create relation with error
        Given we login as <username> with <password>
        When we create a relation between <photo_1> and <photo_2>
        Then we should get the error: <error>
        And the relation between <photo_1> and <photo_2> should not exist

    Examples:
        | username        | password  | photo_1 | photo_2 | error                                              |
        | anonymous       | none      | First   | Second  | Authentication credentials were not provided.      |
        | authenticated   | 1234      | First   | Second  | You do not have permission to perform this action. |

    Scenario Outline: Create relation
        Given we login as <username> with <password>
        When we create a relation between <photo_1> and <photo_2>
        Then we should get a created result
        And we should get a valid relation between <photo_1> and <photo_2>
        And the relation between <photo_1> and <photo_2> should exist
        And the relation between <photo_1> and <photo_2> description 1 should be photo 1 description
        And the relation between <photo_1> and <photo_2> description 2 should be photo 2 description

    Examples:
        | username        | password  | photo_1 | photo_2 |
        | superuser       | super1234 | First   | Second  |

    Scenario Outline: Update relation with error
        Given we login as <username> with <password>
        When we update a relation between <photo_1> and <photo_2>
        Then we should get the error: <error>
        And the relation between <photo_1> and <photo_2> should exist
        And the relation between <photo_1> and <photo_2> description 1 should be Parent Photo
        And the relation between <photo_1> and <photo_2> description 2 should be First Photo

    Examples:
        | username        | password  | photo_1 | photo_2  | error                                              |
        | anonymous       | none      | Parent  | First    | Authentication credentials were not provided.      |
        | authenticated   | 1234      | Parent  | First    | You do not have permission to perform this action. |

    Scenario Outline: Update relation
        Given we login as <username> with <password>
        When we update a relation between <photo_1> and <photo_2>
        Then we should get a successful result
        And we should get a valid relation between <photo_1> and <photo_2>
        And we should get a relation with description 1 photo 1 new description
        And we should get a relation with description 2 photo 2 new description
        And the relation between <photo_1> and <photo_2> should exist
        And the relation between <photo_1> and <photo_2> description 1 should be photo 1 new description
        And the relation between <photo_1> and <photo_2> description 2 should be photo 2 new description

    Examples:
        | username        | password  | photo_1 | photo_2 |
        | superuser       | super1234 | Parent  | First   |

    Scenario Outline: Patch relation with error
        Given we login as <username> with <password>
        When we patch a relation between <photo_1> and <photo_2>
        Then we should get the error: <error>
        And the relation between <photo_1> and <photo_2> should exist
        And the relation between <photo_1> and <photo_2> description 1 should be Parent Photo
        And the relation between <photo_1> and <photo_2> description 2 should be First Photo

    Examples:
        | username        | password  | photo_1 | photo_2 | error                                              |
        | anonymous       | none      | Parent  | First   | Authentication credentials were not provided.      |
        | authenticated   | 1234      | Parent  | First   | You do not have permission to perform this action. |

    Scenario Outline: Patch relation
        Given we login as <username> with <password>
        When we patch a relation between <photo_1> and <photo_2>
        Then we should get a successful result
        And we should get a valid relation between <photo_1> and <photo_2>
        And we should get a relation with description 1 photo 1 new description
        And we should get a relation with description 2 photo 2 new description
        And the relation between <photo_1> and <photo_2> should exist
        And the relation between <photo_1> and <photo_2> description 1 should be photo 1 new description
        And the relation between <photo_1> and <photo_2> description 2 should be photo 2 new description

    Examples:
        | username        | password  | photo_1 | photo_2 |
        | superuser       | super1234 | Parent  | First   |

    Scenario Outline: Get relation
        Given we login as <username> with <password>
        When we get a relation between <photo_1> and <photo_2>
        Then we should get a successful result
        And we should get a valid relation between <photo_1> and <photo_2>

    Examples:
        | username        | password  | photo_1 | photo_2 |
        | anonymous       | none      | Parent  | First   |
        | authenticated   | 1234      | Parent  | First   |
        | superuser       | super1234 | Parent  | Second  |

    Scenario Outline: List relations
        Given we login as <username> with <password>
        When we list all relations
        Then we should get a successful result
        And we should get 2 valid relations

    Examples:
        | username        | password  |
        | anonymous       | none      |
        | authenticated   | 1234      |
        | superuser       | super1234 |

    Scenario Outline: Delete relation with error
        Given we login as <username> with <password>
        When we delete a relation between <photo_1> and <photo_2>
        Then we should get the error: <error>
        And the relation between <photo_1> and <photo_2> should exist

    Examples:
        | username        | password  | photo_1 | photo_2 | error                                              |
        | anonymous       | none      | Parent  | First   | Authentication credentials were not provided.      |
        | authenticated   | 1234      | Parent  | First   | You do not have permission to perform this action. |

    Scenario Outline: Delete relation
        Given we login as <username> with <password>
        When we delete a relation between <photo_1> and <photo_2>
        Then we should get a no content result
        And the relation between <photo_1> and <photo_2> should not exist

    Examples:
        | username        | password  | photo_1 | photo_2 |
        | superuser       | super1234 | Parent  | First   |
