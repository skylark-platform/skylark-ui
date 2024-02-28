import { configureSkylarkIntercepts } from "../../../../support/utils/handlers";

describe("Content Library - Object Panel - Relationships Tab", () => {
  beforeEach(() => {
    cy.login();

    configureSkylarkIntercepts();

    cy.visit("/");
    cy.wait("@introspectionQuery");
  });

  it("open Relationships tab", () => {
    cy.get('input[name="search-query-input"]').type("Homepage");
    cy.contains("Homepage").should("exist");
    cy.openContentLibraryObjectPanelByText("Homepage");

    cy.contains("button", "Relationships").click();

    cy.contains("StreamTVLoadingScreen.png");
  });

  it("adds Relationships using the Object Search modal", () => {
    cy.get('input[name="search-query-input"]').type("Homepage");
    cy.contains("Homepage").should("exist");
    cy.openContentLibraryObjectPanelByText("Homepage");

    cy.contains("button", "Relationships").click();

    cy.get("#panel-section-assets").scrollIntoView();

    cy.get("#panel-section-assets")
      .parent()
      .within(() => {
        cy.get('[aria-label="Open edit assets relationship modal"]').click();
      });

    cy.get("[data-testid=search-objects-modal-save]").should("exist");

    cy.contains("GOT S04 Trailer").click();

    cy.contains("button", "Add").click();

    cy.get("[data-testid=search-objects-modal-save]").should("not.exist");

    cy.get("#panel-section-assets").scrollIntoView();

    cy.contains("GOT S04 Trailer");

    cy.contains("Editing");
  });
});
