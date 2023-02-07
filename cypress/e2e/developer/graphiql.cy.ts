import { hasOperationName } from "../../support/utils/graphqlTestUtils";

describe("GraphiQL Editor", () => {
  beforeEach(() => {
    cy.login();
    cy.intercept("POST", Cypress.env("skylark_graphql_uri"), (req) => {
      if (hasOperationName(req, "GET_SKYLARK_OBJECT_TYPES")) {
        req.reply({
          fixture: "./skylark/queries/introspection/objectTypes.json",
        });
      }
    });

    cy.visit("/developer/graphql-editor");
  });

  it("should load GraphiQL", () => {
    cy.get(".graphiql-logo").within(() => {
      cy.contains("Query Editor");
    });
    cy.contains("Welcome to Skylark's GraphQL Editor");
  });
});
