import "./commands";
import { hasOperationName } from "./utils/graphqlTestUtils";

beforeEach(() => {
  cy.intercept("POST", Cypress.env("skylark_graphql_uri"), (req) => {
    if (hasOperationName(req, "GET_SKYLARK_OBJECT_TYPES")) {
      req.reply({
        fixture: "./skylark/queries/introspection/objectTypes.json",
      });
    }
  });
});
