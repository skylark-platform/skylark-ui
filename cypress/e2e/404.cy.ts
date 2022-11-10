describe("404 page", () => {
  it("shows the 404 page when the path does not exist", () => {
    cy.visit("/path-does-not-exist", { failOnStatusCode: false });

    cy.contains("404");

    cy.contains("404")
      .parent()
      .parent()
      .find("img")
      .should("have.attr", "alt")
      .should("contain", "404 pet");
  });

  it("returns the user to home when they click the button", () => {
    cy.visit("/path-does-not-exist", { failOnStatusCode: false });

    cy.contains("Go home").click();

    cy.url().should("eq", "http://localhost:3000/");
  });
});
