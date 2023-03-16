import { HREFS } from "../../../src/constants/skylark";

import { hasOperationName } from "../../support/utils/graphqlTestUtils";

describe("GraphiQL Editor", () => {
  beforeEach(() => {
    cy.login();
    cy.intercept("POST", Cypress.env("skylark_graphql_uri"), (req) => {
      if (hasOperationName(req, "IntrospectionQuery")) {
        req.reply({
          fixture: "./skylark/queries/introspection/introspectionQuery.json",
        });
      }
    });

    cy.visit(HREFS.relative.graphqlEditor);
  });

  it("should load GraphiQL", () => {
    cy.get(".graphiql-logo").within(() => {
      cy.contains("Query Editor");
    });
    cy.contains("Welcome to Skylark's GraphQL Editor");
  });
});
