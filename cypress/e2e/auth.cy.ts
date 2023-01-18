import { hasOperationName } from "../support/utils/graphqlTestUtils";

describe("Auth", () => {
  beforeEach(() => {
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
    cy.intercept("POST", "http://localhost:3000/graphql", (req) => {
      if (hasOperationName(req, "GET_SKYLARK_OBJECT_TYPES")) {
        req.alias = "getSkylarkObjectTypesQuery";
        req.reply({
          fixture: "./skylark/queries/introspection/objectTypes.json",
        });
      }
    });

    cy.get('*[id^="headlessui-dialog-panel-"]').within(() => {
      cy.contains("Connect to Skylark");
      const uriInput = cy.get('input[name="GraphQL URL"]');
      const tokenInput = cy.get('input[name="API Key"]');
      uriInput.clear();
      tokenInput.clear();
      uriInput.type("http://localhost:3000/graphql");
      tokenInput.type("access-token");
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
    cy.intercept("POST", "http://localhost:3000/graphql", (req) => {
      if (hasOperationName(req, "GET_SKYLARK_OBJECT_TYPES")) {
        req.alias = "getSkylarkObjectTypesQuery";
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
