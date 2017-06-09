@django_db
Feature: Testing photos

    # FIXME: server closes connection prematurely.
    #
    # Scenario Outline: Create photo with error
    #     Given we login as <username> with <password>
    #     When we create a photo called <name>
    #     Then we should get the error: <error>
    #     And the photo called <name> should not exist
    #
    # Examples:
    #     | username        | password  | name   | error                                              |
    #     | anonymous       | none      | Parent | Authentication credentials were not provided.      |
    #     | authenticated   | 1234      | First  | You do not have permission to perform this action. |

    Scenario Outline: Create photo
        Given we login as <username> with <password>
        When we create a photo called <name> using <filename>
        Then we should get a created result
        And we should get a valid photo called <name>
        And the photo called <name> should exist
        And the photo <name> description should be description

    Examples:
        | username        | password  | name   | filename     |
        | superuser       | super1234 | Second | 177A0782.JPG |
        | superuser       | super1234 | Second | 177A4628.MOV |

    Scenario Outline: Update photo with error
        Given we login as <username> with <password>
        When we update a photo called <name>
        Then we should get the error: <error>
        And the photo called <name> should exist
        And the photo <name> description should be Testing «ταБЬℓσ»

    Examples:
        | username        | password  | name   | error                                              |
        | anonymous       | none      | Parent | Authentication credentials were not provided.      |
        | authenticated   | 1234      | First  | You do not have permission to perform this action. |

    Scenario Outline: Update photo
        Given we login as <username> with <password>
        When we update a photo called <name>
        Then we should get a successful result
        And we should get a valid photo called <name>
        And we should get a photo with description new description
        And the photo called <name> should exist
        And the photo <name> description should be new description

    Examples:
        | username        | password  | name   |
        | superuser       | super1234 | Second |

    Scenario Outline: Patch photo with error
        Given we login as <username> with <password>
        When we patch a photo called <name>
        Then we should get the error: <error>
        And the photo called <name> should exist
        And the photo <name> description should be Testing «ταБЬℓσ»

    Examples:
        | username        | password  | name   | error                                              |
        | anonymous       | none      | Parent | Authentication credentials were not provided.      |
        | authenticated   | 1234      | First  | You do not have permission to perform this action. |

    Scenario Outline: Patch photo
        Given we login as <username> with <password>
        When we patch a photo called <name>
        Then we should get a successful result
        And we should get a valid photo called <name>
        And we should get a photo with description new description
        And the photo called <name> should exist
        And the photo <name> description should be new description

    Examples:
        | username        | password  | name   |
        | superuser       | super1234 | Second |

    Scenario Outline: Get photo
        Given we login as <username> with <password>
        When we get a photo called <name>
        Then we should get a successful result
        And we should get a valid photo called <name>

    Examples:
        | username        | password  | name   |
        | anonymous       | none      | Parent |
        | authenticated   | 1234      | First  |
        | superuser       | super1234 | Second |

    Scenario Outline: List photos
        Given we login as <username> with <password>
        When we list all photos
        Then we should get a successful result
        And we should get 3 valid photos

    Examples:
        | username        | password  |
        | anonymous       | none      |
        | authenticated   | 1234      |
        | superuser       | super1234 |

    Scenario Outline: Delete photo with error
        Given we login as <username> with <password>
        When we delete a photo called <name>
        Then we should get the error: <error>
        And the photo called <name> should exist

    Examples:
        | username        | password  | name   | error                                              |
        | anonymous       | none      | Parent | Authentication credentials were not provided.      |
        | authenticated   | 1234      | First  | You do not have permission to perform this action. |

    Scenario Outline: Delete photo
        Given we login as <username> with <password>
        When we delete a photo called <name>
        Then we should get a no content result
        And the photo called <name> should not exist

    Examples:
        | username        | password  | name   |
        | superuser       | super1234 | Parent |
        | superuser       | super1234 | First  |
