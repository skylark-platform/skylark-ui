import { configureSkylarkIntercepts } from "../support/utils/handlers";

describe("Navigation", () => {
  beforeEach(() => {
    cy.login();

    configureSkylarkIntercepts();

    cy.visit("/");
    cy.wait("@introspectionQuery");
  });

  it("contains the navigation bar", () => {
    cy.contains("Skylark");
    cy.get("nav").get("ul").find("li").should("have.length", 2);
  });

  it("opens the navigation bar on mobile", () => {
    cy.viewport("iphone-xr");
    cy.get("#mobile-nav-toggle").click();
    cy.get("nav").get("ul").find("li").should("have.length", 2);
  });
});
