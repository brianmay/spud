@django_db
Feature: Testing places

    Scenario Outline: Create place with error
        Given we login as <username> with <password>
        When we create a place called <name>
        Then we should get the error: <error>
        And the place called <name> should not exist

    Examples:
        | username        | password  | name   | error                                              |
        | anonymous       | none      | Parent | Authentication credentials were not provided.      |
        | authenticated   | 1234      | First  | You do not have permission to perform this action. |

    Scenario Outline: Create place
        Given we login as <username> with <password>
        When we create a place called <name>
        Then we should get a created result
        And we should get a valid place called <name>
        And the place called <name> should exist
        And the place <name> notes should be notes

    Examples:
        | username        | password  | name   |
        | superuser       | super1234 | Second |

    Scenario Outline: Update place with error
        Given we login as <username> with <password>
        When we update a place called <name>
        Then we should get the error: <error>
        And the place called <name> should exist
        And the place <name> notes should be Testing «ταБЬℓσ»

    Examples:
        | username        | password  | name   | error                                              |
        | anonymous       | none      | Parent | Authentication credentials were not provided.      |
        | authenticated   | 1234      | First  | You do not have permission to perform this action. |

    Scenario Outline: Update place
        Given we login as <username> with <password>
        When we update a place called <name>
        Then we should get a successful result
        And we should get a valid place called <name>
        And we should get a place with notes new notes
        And the place called <name> should exist
        And the place <name> notes should be new notes

    Examples:
        | username        | password  | name   |
        | superuser       | super1234 | Second |

    Scenario Outline: Patch place with error
        Given we login as <username> with <password>
        When we patch a place called <name>
        Then we should get the error: <error>
        And the place called <name> should exist
        And the place <name> notes should be Testing «ταБЬℓσ»

    Examples:
        | username        | password  | name   | error                                              |
        | anonymous       | none      | Parent | Authentication credentials were not provided.      |
        | authenticated   | 1234      | First  | You do not have permission to perform this action. |

    Scenario Outline: Patch place
        Given we login as <username> with <password>
        When we patch a place called <name>
        Then we should get a successful result
        And we should get a valid place called <name>
        And we should get a place with notes new notes
        And the place called <name> should exist
        And the place <name> notes should be new notes

    Examples:
        | username        | password  | name   |
        | superuser       | super1234 | Second |

    Scenario Outline: Get place
        Given we login as <username> with <password>
        When we get a place called <name>
        Then we should get a successful result
        And we should get a valid place called <name>

    Examples:
        | username        | password  | name   |
        | anonymous       | none      | Parent |
        | authenticated   | 1234      | First  |
        | superuser       | super1234 | Second |

    Scenario Outline: List places
        Given we login as <username> with <password>
        When we list all places
        Then we should get a successful result
        And we should get 3 valid places

    Examples:
        | username        | password  |
        | anonymous       | none      |
        | authenticated   | 1234      |
        | superuser       | super1234 |

    Scenario Outline: Delete place with error
        Given we login as <username> with <password>
        When we delete a place called <name>
        Then we should get the error: <error>
        And the place called <name> should exist

    Examples:
        | username        | password  | name   | error                                              |
        | anonymous       | none      | Parent | Authentication credentials were not provided.      |
        | authenticated   | 1234      | First  | You do not have permission to perform this action. |
        | superuser       | super1234 | Parent | Cannot delete place with children                  |

    Scenario Outline: Delete place
        Given we login as <username> with <password>
        When we delete a place called <name>
        Then we should get a no content result
        And the place called <name> should not exist

    Examples:
        | username        | password  | name   |
        | superuser       | super1234 | First  |
