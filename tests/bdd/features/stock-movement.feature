Feature: Stock movement

  Scenario: Record a stock exit
    Given a product has 10 units in stock
    When I record an exit of 3 units
    Then the product has 7 units in stock
