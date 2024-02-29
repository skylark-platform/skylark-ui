import { configureSkylarkIntercepts } from "../../../support/utils/intercepts";

describe("Content Library - Object Panel", () => {
  beforeEach(() => {
    cy.login();

    configureSkylarkIntercepts();

    cy.visit("/");
    cy.wait("@introspectionQuery");
  });

  it("open Panel", () => {
    cy.get('input[name="search-query-input"]').type("got winter is coming");
    cy.contains("GOT S01E1 - Winter");
    cy.openContentLibraryObjectPanelByText("en-GB"); // Open the English version

    cy.contains("Metadata");
    cy.contains("Synopsis short").scrollIntoView();

    cy.get('textarea[name="synopsis_short"]')
      .invoke("val")
      .should(
        "equal",
        "Series Premiere. Eddard Stark is torn between his family and an old friend when asked to serve at the side of King Robert Baratheon; Viserys plans to wed his sister to a nomadic warlord in exchange for an army.",
      );
    cy.percySnapshot("Homepage - object panel open");
  });

  it("close Panel", () => {
    cy.get('input[name="search-query-input"]').type("got winter is coming");
    cy.openContentLibraryObjectPanelByText("GOT S01E1 - Winter");

    cy.contains("Edit Metadata").should("exist");
    cy.get('[aria-label="Close Panel"]').click();
    cy.contains("Edit Metadata").should("not.exist");
  });

  it("view GraphQL query", () => {
    cy.get('input[name="search-query-input"]').type("got winter is coming");
    cy.openContentLibraryObjectPanelByText("GOT S01E1 - Winter");

    cy.contains("Metadata");
    cy.get("[data-testid=panel-header]").within(() => {
      cy.get('[aria-label="Open Panel Menu"]').click();
      cy.get("[data-testid=graphql-query-modal-button]").parent().click();
    });
    cy.contains("Query for");
  });

  it("create translation", () => {
    cy.get('input[name="search-query-input"]').type("got winter is coming");
    cy.openContentLibraryObjectPanelByText("GOT S01E1 - Winter");

    // Trigger create translation modal
    cy.get("[data-testid=panel-header]").within(() => {
      cy.get("[data-testid=select]").click();
    });
    cy.contains("Create Translation").click();

    // Select language and enter data
    cy.get("[data-testid=create-object-modal]").within(() => {
      cy.contains("Object language")
        .parent()
        .within(() => {
          cy.get("[data-testid=select]").type("en-U");
        });
      cy.contains("en-US").click();
      cy.getByLabel("Title").type("GOT S01E01");
      cy.contains("Create Translation").click();
    });

    cy.contains('Translation "en-US" created');
  });

  it("delete translation", () => {
    cy.get('input[name="search-query-input"]').type("got winter is coming");
    cy.openContentLibraryObjectPanelByText("GOT S01E1 - Winter");

    // Trigger delete modal
    cy.get("[data-testid=panel-header]").within(() => {
      cy.get('[aria-label="Open Panel Menu"]').click();
      cy.contains("Delete").click();
    });

    cy.contains('Delete "pt-PT" translation');

    cy.get("[data-testid=delete-object-modal]").within(() => {
      cy.contains("Delete translation").click();
    });

    cy.contains('Translation "pt-PT" deleted');
  });
});
