import { configureSkylarkIntercepts } from "../support/utils/intercepts";

describe("404 page", () => {
  beforeEach(() => {
    cy.login();

    configureSkylarkIntercepts();
  });

  it("shows the 404 page when the path does not exist", () => {
    cy.visit("/path-does-not-exist?pet=hazel", { failOnStatusCode: false });

    cy.contains("404");

    cy.contains("404")
      .parent()
      .parent()
      .find("img")
      .should("have.attr", "alt")
      .should("contain", "404 pet");

    cy.percySnapshot("404 page");
  });

  it("returns the user to home when they click the button", () => {
    cy.visit("/path-does-not-exist", { failOnStatusCode: false });

    cy.contains("Go home").click();

    cy.url().should("eq", "http://localhost:3000/");
  });
});
