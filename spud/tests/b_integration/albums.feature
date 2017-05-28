@django_db
Feature: Testing albums

    Scenario Outline: Create album with error
        Given we login as <username> with <password>
        When we create an album called <name>
        Then we should get the error: <error>
        And the album called <name> should not exist

    Examples:
        | username        | password  | name   | error                                              |
        | anonymous       | none      | Parent | Authentication credentials were not provided.      |
        | authenticated   | 1234      | First  | You do not have permission to perform this action. |

    Scenario Outline: Create album
        Given we login as <username> with <password>
        When we create an album called <name>
        Then we should get a created result
        And we should get a valid album called <name> with <fields>
        And the album called <name> should exist
        And the album <name> description should be description

    Examples:
        | username        | password  | name   | fields |
        | superuser       | super1234 | Second | all    |

    Scenario Outline: Update album with error
        Given we login as <username> with <password>
        When we update an album called <name>
        Then we should get the error: <error>
        And the album called <name> should exist
        And the album <name> description should be Testing «ταБЬℓσ»

    Examples:
        | username        | password  | name   | error                                              |
        | anonymous       | none      | Parent | Authentication credentials were not provided.      |
        | authenticated   | 1234      | First  | You do not have permission to perform this action. |

    Scenario Outline: Update album
        Given we login as <username> with <password>
        When we update an album called <name>
        Then we should get a successful result
        And we should get a valid album called <name> with <fields>
        And we should get an album with description new description
        And the album called <name> should exist
        And the album <name> description should be new description

    Examples:
        | username        | password  | name   | fields |
        | superuser       | super1234 | Second | all    |

    Scenario Outline: Patch album with error
        Given we login as <username> with <password>
        When we patch an album called <name>
        Then we should get the error: <error>
        And the album called <name> should exist
        And the album <name> description should be Testing «ταБЬℓσ»

    Examples:
        | username        | password  | name   | error                                              |
        | anonymous       | none      | Parent | Authentication credentials were not provided.      |
        | authenticated   | 1234      | First  | You do not have permission to perform this action. |

    Scenario Outline: Patch album
        Given we login as <username> with <password>
        When we patch an album called <name>
        Then we should get a successful result
        And we should get a valid album called <name> with <fields>
        And we should get an album with description new description
        And the album called <name> should exist
        And the album <name> description should be new description

    Examples:
        | username        | password  | name   | fields |
        | superuser       | super1234 | Second | all    |

    Scenario Outline: Get album
        Given we login as <username> with <password>
        When we get an album called <name>
        Then we should get a successful result
        And we should get a valid album called <name> with <fields>

    Examples:
        | username        | password  | name   | fields     |
        | anonymous       | none      | Parent | restricted |
        | authenticated   | 1234      | First  | restricted |
        | superuser       | super1234 | Second | all        |

    Scenario Outline: List albums
        Given we login as <username> with <password>
        When we list all albums
        Then we should get a successful result
        And we should get 3 valid albums with <fields>

    Examples:
        | username        | password  | fields     |
        | anonymous       | none      | restricted |
        | authenticated   | 1234      | restricted |
        | superuser       | super1234 | all        |

    Scenario Outline: Delete album with error
        Given we login as <username> with <password>
        When we delete an album called <name>
        Then we should get the error: <error>
        And the album called <name> should exist

    Examples:
        | username        | password  | name   | error                                              |
        | anonymous       | none      | Parent | Authentication credentials were not provided.      |
        | authenticated   | 1234      | First  | You do not have permission to perform this action. |
        | superuser       | super1234 | Parent | Cannot delete album with children                  |

    Scenario Outline: Delete album
        Given we login as <username> with <password>
        When we delete an album called <name>
        Then we should get a no content result
        And the album called <name> should not exist

    Examples:
        | username        | password  | name   |
        | superuser       | super1234 | First  |
