Feature: Backend HTTP API (serverless-offline)
  Smoke and integration scenarios against the REST API.
  Run `npm run dev` or `npm run dev:local` so the API is available (default http://127.0.0.1:3000/dev).

  @smoke
  Scenario: Farmers Market buy returns quantity sold
    When I request farmers market stock for ingredient "tomato"
    Then the response status should be 200
    And the response should include a numeric quantitySold field

  @integration
  Scenario: Login succeeds for seeded demo user
    Requires users in DynamoDB for the same stage (e.g. `npm run seed:dev` or `npm run seed:local`).
    When I log in with email "admin@restaurant-service.local" and password "admin123"
    Then the response status should be 200
    And the response should contain a JWT token
