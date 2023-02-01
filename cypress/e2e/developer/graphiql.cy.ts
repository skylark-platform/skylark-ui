import { hasOperationName } from "../../support/utils/graphqlTestUtils";

describe("GraphiQL Playground", () => {
  beforeEach(() => {
    cy.login();
    cy.intercept("POST", Cypress.env("skylark_graphql_uri"), (req) => {
      if (hasOperationName(req, "GET_SKYLARK_OBJECT_TYPES")) {
        req.reply({
          fixture: "./skylark/queries/introspection/objectTypes.json",
        });
      }
    });

    cy.visit("/developer/playground");
  });

  it("should load GraphiQL", () => {
    cy.get(".graphiql-logo").within(() => {
      cy.contains("GraphQL Playground");
    });
    cy.contains("Welcome to Skylark's GraphQL Playground");
  });
});
