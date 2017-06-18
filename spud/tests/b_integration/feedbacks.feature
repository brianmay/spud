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
        When we update a feedback with photo <photo_name>
        Then we should get the error: <error>
        And the feedback with photo <photo_name> should exist
        And the feedback <photo_name> comment should be Testing «ταБЬℓσ»

    Examples:
        | username        | password  | photo_name | error                                              |
        | anonymous       | none      | Parent     | Authentication credentials were not provided.      |
        | authenticated   | 1234      | Parent     | You do not have permission to perform this action. |

    Scenario Outline: Update feedback
        Given we login as <username> with <password>
        When we update a feedback with photo <photo_name>
        Then we should get a successful result
        And we should get a valid feedback
        And we should get a feedback with comment new comment
        And the feedback with photo <photo_name> should exist
        And the feedback <photo_name> comment should be new comment

    Examples:
        | username        | password  | photo_name |
        | superuser       | super1234 | Parent     |

    Scenario Outline: Patch feedback with error
        Given we login as <username> with <password>
        When we patch a feedback with photo <photo_name>
        Then we should get the error: <error>
        And the feedback with photo <photo_name> should exist
        And the feedback <photo_name> comment should be Testing «ταБЬℓσ»

    Examples:
        | username        | password  | photo_name | error                                              |
        | anonymous       | none      | Parent     | Authentication credentials were not provided.      |
        | authenticated   | 1234      | Parent     | You do not have permission to perform this action. |

    Scenario Outline: Patch feedback
        Given we login as <username> with <password>
        When we patch a feedback with photo <photo_name>
        Then we should get a successful result
        And we should get a valid feedback
        And we should get a feedback with comment new comment
        And the feedback with photo <photo_name> should exist
        And the feedback <photo_name> comment should be new comment

    Examples:
        | username        | password  | photo_name |
        | superuser       | super1234 | Parent     |

    Scenario Outline: Get feedback
        Given we login as <username> with <password>
        When we get a feedback with photo <photo_name>
        Then we should get a successful result
        And we should get a valid feedback

    Examples:
        | username        | password  | photo_name |
        | anonymous       | none      | Parent     |
        | authenticated   | 1234      | Parent     |
        | superuser       | super1234 | Parent     |

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
        When we delete a feedback with photo <photo_name>
        Then we should get the error: <error>
        And the feedback with photo <photo_name> should exist

    Examples:
        | username        | password  | photo_name | error                                              |
        | anonymous       | none      | Parent     | Authentication credentials were not provided.      |
        | authenticated   | 1234      | Parent     | You do not have permission to perform this action. |

    Scenario Outline: Delete feedback
        Given we login as <username> with <password>
        When we delete a feedback with photo <photo_name>
        Then we should get a no content result
        And the feedback with photo <photo_name> should not exist

    Examples:
        | username        | password  | photo_name |
        | superuser       | super1234 | Parent     |
        | superuser       | super1234 | Parent     |
        | superuser       | super1234 | Parent     |
