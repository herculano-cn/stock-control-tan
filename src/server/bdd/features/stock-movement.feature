Feature: Stock movement
  A stock movement updates the product balance only when the requested operation is valid.

  Scenario: Record a stock exit successfully
    Given a product named "BDD success item" has 10 units in stock
    When I record a stock exit of 3 units
    Then the movement is recorded successfully
    And the product stock is 7 units
    And the movement records stock changing from 10 to 7 units

  Scenario: Reject a stock exit larger than available stock
    Given a product named "BDD insufficient item" has 5 units in stock
    When I record a stock exit of 6 units
    Then the movement is rejected with "Saldo insuficiente"
    And the product stock remains 5 units
