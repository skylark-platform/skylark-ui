import { configureSkylarkIntercepts } from "../../support/utils/intercepts";

describe("GraphiQL Editor", () => {
  beforeEach(() => {
    cy.login();

    configureSkylarkIntercepts();

    cy.visit("/developer/graphql-editor");
  });

  it("should load GraphiQL", () => {
    cy.get(".graphiql-logo").within(() => {
      cy.contains("Query Editor");
    });
    cy.contains("Welcome to Skylark's GraphQL Editor");
  });
});
