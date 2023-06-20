import { graphql } from "msw";

describe("Auth", () => {
  beforeEach(() => {
    cy.visit("/");
  });

  it("shows the connect modal when not connected", () => {
    cy.window().then((window) => {
      const { worker } = window.msw;

      worker.use(
        graphql.query("GET_SKYLARK_OBJECT_TYPES", (req, res, ctx) => {
          return res.once(ctx.status(401));
        }),
      );
    });

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
    cy.window().then((window) => {
      const { worker } = window.msw;

      worker.use(
        graphql.query("GET_SKYLARK_OBJECT_TYPES", (req, res, ctx) => {
          console.log("window intercept 222");
          return res(ctx.status(401));
        }),
      );
    });

    cy.get('*[id^="headlessui-dialog-panel-"]').within(() => {
      cy.contains("Connect to Skylark");
      const uriInput = cy.get('input[name="GraphQL URL"]');
      const tokenInput = cy.get('input[name="API Key"]');
      uriInput.clear();
      tokenInput.clear();
      uriInput.type(Cypress.env("skylark_graphql_uri"));
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

    cy.visit("/");
    cy.get('*[id^="headlessui-dialog-panel-"]').should("not.exist");
    cy.contains("Connected").click();
    cy.get('*[id^="headlessui-dialog-panel-"]').should("exist");
    cy.clickOutside();
    cy.get('*[id^="headlessui-dialog-panel-"]').should("not.exist");
  });
});
