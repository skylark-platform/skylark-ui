import { configureSkylarkIntercepts } from "../../support/utils/intercepts";

describe("Create Object Modal", () => {
  beforeEach(() => {
    cy.login();

    configureSkylarkIntercepts();

    cy.visit("/");
    cy.wait("@introspectionQuery");
  });

  const openModal = () => {
    cy.contains("button", "Create").click();
    cy.contains("button", "Create Object").click();
    cy.contains("Select Object Type to get started.");
  };

  it("opens the create object modal", () => {
    openModal();
  });

  it("displays an objects display_name in a select", () => {
    openModal();

    cy.get("[data-testid=create-object-modal]").within(() => {
      cy.get("[data-testid=select]").click();
      cy.get("[data-testid=select-options]").scrollTo("bottom");
      cy.get("[data-testid=select-options]").within(() => {
        cy.contains("Set");
      });
    });
  });

  it("selects an object type", () => {
    openModal();

    cy.get("[data-testid=create-object-modal]").within(() => {
      cy.get("[data-testid=select]").click();
      cy.get("[data-testid=select-options]").within(() => {
        cy.contains("Episode").click();
      });

      cy.contains("button", "Create Episode").should("be.disabled");

      cy.percySnapshot("Create Object Modal");
    });
  });

  it("creates an object which opens the Panel", () => {
    openModal();

    cy.get("[data-testid=create-object-modal]").within(() => {
      cy.get("[data-testid=select]").click();
      cy.get("[data-testid=select-options]").within(() => {
        cy.contains("Episode").click();
      });

      cy.contains("button", "Create Episode").should("be.disabled");

      cy.getByLabel("Slug").type("got-s01e01");
      cy.contains("button", "Create Episode").should("be.enabled").click();
    });

    cy.wait("@createObject");

    // Check Create Modal closes
    cy.get("[data-testid=create-object-modal]").should("not.exist");

    // Check Panel opens
    cy.contains("Metadata");
    cy.getByLabel("Slug").should("have.value", "winter-is-coming");
  });

  it("selects a Person Object Type and checks the WYSIWYG Editor loads", () => {
    openModal();

    cy.get("[data-testid=create-object-modal]").within(() => {
      cy.get("[data-testid=select]").click();
      cy.get("[data-testid=select-options]").within(() => {
        cy.contains("Person").click();
      });

      cy.contains("Bio long").scrollIntoView();

      cy.get(".tox-tinymce").should("exist");

      cy.contains("File");
      cy.contains("Format");
    });
  });
});
