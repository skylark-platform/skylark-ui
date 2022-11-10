describe("homepage", () => {
  it("visits home", () => {
    cy.visit("/");
  });

  it("contains the navigation bar", () => {
    cy.visit("/");

    cy.contains("Skylark");
    cy.get("nav").get("ul").find("li a").should("have.length", 3);
    cy.contains("Quick Search");
  });
});
