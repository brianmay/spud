@django_db
Feature: Testing sessions

    Scenario: Anonymous session
        Given we dont login
        When we request the session
        Then we should get a successful result
        And the session user should not be set
        And the session permissions should be none

    Scenario Outline: Session login
        Given we login as <username> with <password>
        When we request the session
        Then we should get a successful result
        And the session username should be <username>
        And the session permissions should be <permissions>
        And the session first name should be <first_name>
        And the session last name should be <last_name>

    Examples:
        | username        | password  | first_name  | last_name  | permissions |
        | authenticated   | 1234      | First       | Last       | none        |
        | superuser       | super1234 | First Super | Last Super | all         |

    Scenario Outline: Session logout
        Given we login as <username> with <password>
        When we logout
        And we request the session
        Then we should get a successful result
        And the session user should not be set
        And the session permissions should be none

    Examples:
        | username        | password  |
        | authenticated   | 1234      |
        | superuser       | super1234 |
