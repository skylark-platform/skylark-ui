import { hasOperationName } from "../support/utils/graphqlTestUtils";

describe("Auth", () => {
  beforeEach(() => {
    cy.intercept("POST", Cypress.env("skylark_graphql_uri"), (req) => {
      if (hasOperationName(req, "GET_SKYLARK_OBJECT_TYPES")) {
        req.reply({
          statusCode: 401,
        });
      }
    });
    cy.visit("/");
  });

  it("shows the connect modal when not connected", () => {
    cy.get('*[id^="headlessui-dialog-panel-"]').within(() => {
      cy.contains("Connect to Skylark");
      const uriInput = cy.get('input[name="GraphQL URL"]');
      const tokenInput = cy.get('input[name="API Key"]');
      uriInput.clear();
      tokenInput.clear();
      cy.contains("Validating").should("not.exist");
      cy.get("button").should("be.disabled");

      cy.percySnapshot("Auth - modal - no input");
    });
  });

  it("connects to Skylark with correct credentials", () => {
    cy.get('*[id^="headlessui-dialog-panel-"]').within(() => {
      cy.contains("Connect to Skylark");
      const uriInput = cy.get('input[name="GraphQL URL"]');
      const tokenInput = cy.get('input[name="API Key"]');
      uriInput.clear();
      tokenInput.clear();
      uriInput.type(Cypress.env("skylark_graphql_uri"));
      tokenInput.type("access-token");

      cy.intercept("POST", Cypress.env("skylark_graphql_uri"), (req) => {
        if (hasOperationName(req, "GET_SKYLARK_OBJECT_TYPES")) {
          req.reply({
            fixture: "./skylark/queries/introspection/objectTypes.json",
          });
        }
      });
      cy.contains("Validating").should("not.exist");
      cy.get("button").should("be.enabled");
      cy.get('input[name="GraphQL URL"]').should(
        "have.class",
        "border-success",
      );
      cy.get('input[name="API Key"]').should("have.class", "border-success");
      cy.percySnapshot("Auth - modal - successful input");
    });
  });

  it("uses invalid credentials", () => {
    cy.get('*[id^="headlessui-dialog-panel-"]').within(() => {
      cy.contains("Connect to Skylark");
      const uriInput = cy.get('input[name="GraphQL URL"]');
      const tokenInput = cy.get('input[name="API Key"]');
      uriInput.clear();
      tokenInput.clear();
      uriInput.type("http://invalid/graphql");
      tokenInput.type("bad-token");
      cy.contains("Validating").should("not.exist");
      cy.get("button").should("be.disabled");
      cy.get('input[name="GraphQL URL"]').should("have.class", "border-error");
      cy.get('input[name="API Key"]').should("have.class", "border-error");

      cy.percySnapshot("Auth - modal - invalid input");
    });
  });

  it("when already logged in, can open using the Connected button and close by clicking outside", () => {
    cy.login();
    cy.intercept("POST", Cypress.env("skylark_graphql_uri"), (req) => {
      if (hasOperationName(req, "GET_SKYLARK_OBJECT_TYPES")) {
        req.reply({
          fixture: "./skylark/queries/introspection/objectTypes.json",
        });
      }
    });
    cy.visit("/");
    cy.get('*[id^="headlessui-dialog-panel-"]').should("not.exist");
    cy.contains("Connected").click();
    cy.get('*[id^="headlessui-dialog-panel-"]').should("exist");
    cy.clickOutside();
    cy.get('*[id^="headlessui-dialog-panel-"]').should("not.exist");
  });
});
