describe("Navigation", () => {
  beforeEach(() => {
    cy.login();

    cy.visit("/");
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
