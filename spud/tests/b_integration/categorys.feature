@django_db
Feature: Testing categorys

    Scenario Outline: Create category with error
        Given we login as <username> with <password>
        When we create a category called <name>
        Then we should get the error: <error>
        And the category called <name> should not exist

    Examples:
        | username        | password  | name   | error                                              |
        | anonymous       | none      | Parent | Authentication credentials were not provided.      |
        | authenticated   | 1234      | First  | You do not have permission to perform this action. |

    Scenario Outline: Create category
        Given we login as <username> with <password>
        When we create a category called <name>
        Then we should get a created result
        And we should get a valid category called <name>
        And the category called <name> should exist
        And the category <name> description should be description

    Examples:
        | username        | password  | name   |
        | superuser       | super1234 | Second |

    Scenario Outline: Update category with error
        Given we login as <username> with <password>
        When we update a category called <name>
        Then we should get the error: <error>
        And the category called <name> should exist
        And the category <name> description should be Testing «ταБЬℓσ»

    Examples:
        | username        | password  | name   | error                                              |
        | anonymous       | none      | Parent | Authentication credentials were not provided.      |
        | authenticated   | 1234      | First  | You do not have permission to perform this action. |

    Scenario Outline: Update category
        Given we login as <username> with <password>
        When we update a category called <name>
        Then we should get a successful result
        And we should get a valid category called <name>
        And we should get a category with description new description
        And the category called <name> should exist
        And the category <name> description should be new description

    Examples:
        | username        | password  | name   |
        | superuser       | super1234 | Second |

    Scenario Outline: Patch category with error
        Given we login as <username> with <password>
        When we patch a category called <name>
        Then we should get the error: <error>
        And the category called <name> should exist
        And the category <name> description should be Testing «ταБЬℓσ»

    Examples:
        | username        | password  | name   | error                                              |
        | anonymous       | none      | Parent | Authentication credentials were not provided.      |
        | authenticated   | 1234      | First  | You do not have permission to perform this action. |

    Scenario Outline: Patch category
        Given we login as <username> with <password>
        When we patch a category called <name>
        Then we should get a successful result
        And we should get a valid category called <name>
        And we should get a category with description new description
        And the category called <name> should exist
        And the category <name> description should be new description

    Examples:
        | username        | password  | name   |
        | superuser       | super1234 | Second |

    Scenario Outline: Get category
        Given we login as <username> with <password>
        When we get a category called <name>
        Then we should get a successful result
        And we should get a valid category called <name>

    Examples:
        | username        | password  | name   |
        | anonymous       | none      | Parent |
        | authenticated   | 1234      | First  |
        | superuser       | super1234 | Second |

    Scenario Outline: List categorys
        Given we login as <username> with <password>
        When we list all categorys
        Then we should get a successful result
        And we should get 3 valid categorys

    Examples:
        | username        | password  |
        | anonymous       | none      |
        | authenticated   | 1234      |
        | superuser       | super1234 |

    Scenario Outline: Delete category with error
        Given we login as <username> with <password>
        When we delete a category called <name>
        Then we should get the error: <error>
        And the category called <name> should exist

    Examples:
        | username        | password  | name   | error                                              |
        | anonymous       | none      | Parent | Authentication credentials were not provided.      |
        | authenticated   | 1234      | First  | You do not have permission to perform this action. |
        | superuser       | super1234 | Parent | Cannot delete category with children                  |

    Scenario Outline: Delete category
        Given we login as <username> with <password>
        When we delete a category called <name>
        Then we should get a no content result
        And the category called <name> should not exist

    Examples:
        | username        | password  | name   |
        | superuser       | super1234 | First  |
