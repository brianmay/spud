@django_db
Feature: Testing persons

    Scenario Outline: Create person with error
        Given we login as <username> with <password>
        When we create a person called <name>
        Then we should get the error: <error>
        And the person called <name> should not exist

    Examples:
        | username        | password  | name   | error                                              |
        | anonymous       | none      | Parent | Authentication credentials were not provided.      |
        | authenticated   | 1234      | First  | You do not have permission to perform this action. |

    Scenario Outline: Create person
        Given we login as <username> with <password>
        When we create a person called <name>
        Then we should get a created result
        And we should get a valid person called <name> with <fields>
        And the person called <name> should exist
        And the person <name> notes should be notes

    Examples:
        | username        | password  | name   | fields |
        | superuser       | super1234 | Second | all    |

    Scenario Outline: Update person with error
        Given we login as <username> with <password>
        When we update a person called <name>
        Then we should get the error: <error>
        And the person called <name> should exist
        And the person <name> notes should be Testing «ταБЬℓσ»

    Examples:
        | username        | password  | name   | error                                              |
        | anonymous       | none      | Parent | Authentication credentials were not provided.      |
        | authenticated   | 1234      | First  | You do not have permission to perform this action. |

    Scenario Outline: Update person
        Given we login as <username> with <password>
        When we update a person called <name>
        Then we should get a successful result
        And we should get a valid person called <name> with <fields>
        And we should get a person with notes new notes
        And the person called <name> should exist
        And the person <name> notes should be new notes

    Examples:
        | username        | password  | name   | fields |
        | superuser       | super1234 | Second | all    |

    Scenario Outline: Patch person with error
        Given we login as <username> with <password>
        When we patch a person called <name>
        Then we should get the error: <error>
        And the person called <name> should exist
        And the person <name> notes should be Testing «ταБЬℓσ»

    Examples:
        | username        | password  | name   | error                                              |
        | anonymous       | none      | Parent | Authentication credentials were not provided.      |
        | authenticated   | 1234      | First  | You do not have permission to perform this action. |

    Scenario Outline: Patch person
        Given we login as <username> with <password>
        When we patch a person called <name>
        Then we should get a successful result
        And we should get a valid person called <name> with <fields>
        And we should get a person with notes new notes
        And the person called <name> should exist
        And the person <name> notes should be new notes

    Examples:
        | username        | password  | name   | fields |
        | superuser       | super1234 | Second | all    |

    Scenario Outline: Get person
        Given we login as <username> with <password>
        When we get a person called <name>
        Then we should get a successful result
        And we should get a valid person called <name> with <fields>

    Examples:
        | username        | password  | name   | fields     |
        | anonymous       | none      | Parent | restricted |
        | authenticated   | 1234      | First  | restricted |
        | superuser       | super1234 | Second | all        |

    Scenario Outline: List persons
        Given we login as <username> with <password>
        When we list all persons
        Then we should get a successful result
        And we should get 3 valid persons with <fields>

    Examples:
        | username        | password  | fields     |
        | anonymous       | none      | restricted |
        | authenticated   | 1234      | restricted |
        | superuser       | super1234 | all        |

    Scenario Outline: Delete person with error
        Given we login as <username> with <password>
        When we delete a person called <name>
        Then we should get the error: <error>
        And the person called <name> should exist

    Examples:
        | username        | password  | name   | error                                              |
        | anonymous       | none      | Parent | Authentication credentials were not provided.      |
        | authenticated   | 1234      | First  | You do not have permission to perform this action. |
        | superuser       | super1234 | Parent | Cannot delete person that is a father, Cannot delete person that is a mother |

    Scenario Outline: Delete person
        Given we login as <username> with <password>
        When we delete a person called <name>
        Then we should get a no content result
        And the person called <name> should not exist

    Examples:
        | username        | password  | name   |
        | superuser       | super1234 | First  |
