import { configurePanelSkylarkIntercepts } from "../__utils__/test-utils";

describe("Content Library - Object Panel - Metadata tab", () => {
  beforeEach(() => {
    cy.login();

    configurePanelSkylarkIntercepts();

    cy.visit("/");
    cy.wait("@introspectionQuery");
  });

  it("change language to pt-PT", () => {
    cy.get('input[name="search-query-input"]').type("got winter is coming");
    cy.contains("div", "GOT S01E1 - Winter");
    cy.openContentLibraryObjectPanelByText("en-GB");

    cy.contains("Metadata");

    cy.get("[data-testid=panel-metadata]").within(() => {
      cy.getByLabel("Slug").should("have.value", "winter-is-coming");
    });

    // Change language
    cy.get("[data-testid=panel-header]").within(() => {
      cy.contains("en-GB").click();
    });
    cy.get("[data-testid=select-options]").within(() => {
      cy.contains("pt-PT").click();
    });

    cy.get("[data-testid=panel-metadata]").within(() => {
      cy.getByLabel("Title short").should(
        "have.value",
        "O Inverno Está Chegando",
      );
    });
  });

  it("edit metadata and cancel", () => {
    cy.get('input[name="search-query-input"]').type("got winter is coming");
    cy.contains("div", "GOT S01E1 - Winter");
    cy.openContentLibraryObjectPanelByText("en-GB");

    cy.contains("Metadata");
    cy.contains("button", "Edit Metadata").should("not.be.disabled");

    cy.getByLabel("Slug").should("have.value", "winter-is-coming");
    cy.getByLabel("Slug").clear().type("gots01e01_winter-is-coming");
    cy.getByLabel("Slug").should("have.value", "gots01e01_winter-is-coming");
    cy.get("[data-testid=panel-header]").within(() => {
      cy.contains("button", "Save").should("not.be.disabled");
      cy.contains("button", "Cancel").should("not.be.disabled");
    });
    cy.contains("Editing");

    // Test cancel
    cy.contains("Cancel").click();
    cy.getByLabel("Slug").should("have.value", "winter-is-coming");
    cy.contains("Editing").should("not.exist");
    cy.contains("button", "Edit Metadata").should("not.be.disabled");
  });

  it("edit metadata and save", () => {
    cy.get('input[name="search-query-input"]').type("got winter is coming");
    cy.contains("div", "GOT S01E1 - Winter");
    cy.openContentLibraryObjectPanelByText("en-GB");

    cy.contains("Metadata");
    cy.contains("button", "Edit Metadata").should("not.be.disabled");

    cy.getByLabel("Slug").should("have.value", "winter-is-coming");
    cy.getByLabel("Slug").clear().type("gots01e01_winter-is-coming");
    cy.getByLabel("Slug").should("have.value", "gots01e01_winter-is-coming");

    cy.contains("Save").click();

    cy.wait("@updateEpisodeMetadata");
    cy.contains("Editing").should("not.exist");
    cy.contains("button", "Edit Metadata").should("not.be.disabled");
  });
});
