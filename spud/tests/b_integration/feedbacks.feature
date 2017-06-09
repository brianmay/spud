@django_db
Feature: Testing feedbacks

    Scenario Outline: Create feedback with error
        Given we login as <username> with <password>
        When we create a feedback
        Then we should get the error: <error>

    Examples:
        | username        | password  | error                                              |
        | anonymous       | none      | Authentication credentials were not provided.      |
        | authenticated   | 1234      | You do not have permission to perform this action. |

    Scenario Outline: Create feedback
        Given we login as <username> with <password>
        When we create a feedback
        Then we should get a created result
        And we should get a valid feedback

    Examples:
        | username        | password  |
        | superuser       | super1234 |

    Scenario Outline: Update feedback with error
        Given we login as <username> with <password>
        When we update a feedback with id <id>
        Then we should get the error: <error>
        And the feedback with id <id> should exist
        And the feedback <id> comment should be Testing «ταБЬℓσ»

    Examples:
        | username        | password  | id | error                                              |
        | anonymous       | none      | 1  | Authentication credentials were not provided.      |
        | authenticated   | 1234      | 1  | You do not have permission to perform this action. |

    Scenario Outline: Update feedback
        Given we login as <username> with <password>
        When we update a feedback with id <id>
        Then we should get a successful result
        And we should get a valid feedback
        And we should get a feedback with comment new comment
        And the feedback with id <id> should exist
        And the feedback <id> comment should be new comment

    Examples:
        | username        | password  | id |
        | superuser       | super1234 | 1  |

    Scenario Outline: Patch feedback with error
        Given we login as <username> with <password>
        When we patch a feedback with id <id>
        Then we should get the error: <error>
        And the feedback with id <id> should exist
        And the feedback <id> comment should be Testing «ταБЬℓσ»

    Examples:
        | username        | password  | id | error                                              |
        | anonymous       | none      | 1  | Authentication credentials were not provided.      |
        | authenticated   | 1234      | 1  | You do not have permission to perform this action. |

    Scenario Outline: Patch feedback
        Given we login as <username> with <password>
        When we patch a feedback with id <id>
        Then we should get a successful result
        And we should get a valid feedback
        And we should get a feedback with comment new comment
        And the feedback with id <id> should exist
        And the feedback <id> comment should be new comment

    Examples:
        | username        | password  | id |
        | superuser       | super1234 | 1  |

    Scenario Outline: Get feedback
        Given we login as <username> with <password>
        When we get a feedback with id <id>
        Then we should get a successful result
        And we should get a valid feedback

    Examples:
        | username        | password  | id |
        | anonymous       | none      | 1  |
        | authenticated   | 1234      | 1  |
        | superuser       | super1234 | 1  |

    Scenario Outline: List feedbacks
        Given we login as <username> with <password>
        When we list all feedbacks
        Then we should get a successful result
        And we should get 3 valid feedbacks

    Examples:
        | username        | password  |
        | anonymous       | none      |
        | authenticated   | 1234      |
        | superuser       | super1234 |

    Scenario Outline: Delete feedback with error
        Given we login as <username> with <password>
        When we delete a feedback with id <id>
        Then we should get the error: <error>
        And the feedback with id <id> should exist

    Examples:
        | username        | password  | id | error                                              |
        | anonymous       | none      | 1  | Authentication credentials were not provided.      |
        | authenticated   | 1234      | 1  | You do not have permission to perform this action. |

    Scenario Outline: Delete feedback
        Given we login as <username> with <password>
        When we delete a feedback with id <id>
        Then we should get a no content result
        And the feedback with id <id> should not exist

    Examples:
        | username        | password  | id |
        | superuser       | super1234 | 1  |
        | superuser       | super1234 | 2  |
        | superuser       | super1234 | 3  |
