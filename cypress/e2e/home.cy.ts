describe.skip("Content Library", () => {
  it("visits home", () => {
    cy.visit("/");

    cy.percySnapshot("Homepage");
  });

  it("contains the navigation bar", () => {
    cy.visit("/");

    cy.contains("Skylark");
    cy.get("nav").get("ul").find("li a").should("have.length", 2);
    cy.contains("Quick Search");
  });

  it("opens the navigation bar on mobile", () => {
    cy.viewport("iphone-xr");
    cy.get("#mobile-nav-toggle").click();
    cy.get("nav").get("ul").find("li a").should("have.length", 2);
    cy.percySnapshot("Mobile Navigation");
  });
});
