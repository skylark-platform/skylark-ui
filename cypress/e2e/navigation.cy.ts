import { hasOperationName } from "../support/utils/graphqlTestUtils";

describe("Navigation", () => {
  beforeEach(() => {
    cy.login();

    cy.intercept("POST", Cypress.env("skylark_graphql_uri"), (req) => {
      if (hasOperationName(req, "GET_SKYLARK_OBJECT_TYPES")) {
        req.alias = "getSkylarkObjectTypesQuery";
        req.reply({
          fixture: "./skylark/queries/introspection/objectTypes.json",
        });
      }
    });

    cy.visit("/");
    cy.wait("@getSkylarkObjectTypesQuery");
  });

  it("contains the navigation bar", () => {
    cy.contains("Skylark");
    cy.get("nav").get("ul").find("li").should("have.length", 2);
    cy.percySnapshot("Navigation - desktop");
  });

  it("opens the navigation bar on mobile", () => {
    cy.viewport("iphone-xr");
    cy.get("#mobile-nav-toggle").click();
    cy.get("nav").get("ul").find("li").should("have.length", 2);
    cy.percySnapshot("Navigation - mobile");
  });
});
