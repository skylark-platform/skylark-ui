import { hasOperationName } from "../../support/utils/graphqlTestUtils";
import { configureSkylarkIntercepts } from "../../support/utils/handlers";

describe("Compare Schema Versions", () => {
  beforeEach(() => {
    cy.login();

    configureSkylarkIntercepts();

    cy.visit("/content-model");
    cy.wait("@introspectionQuery");
  });

  const getTabs = () => {
    // Loads all tabs
    cy.get("[data-testid=content-model-editor]").within(() => {
      return {
        uiConfig: cy.contains("li", "UI Config"),
        metadata: cy.contains("li", "Metadata"),
        relationships: cy.contains("li", "Relationships"),
      };
    });
  };

  it("loads the ContentModel page defaulting to SkylarkSet", () => {
    cy.get("[data-testid=content-model-editor]").within(() => {
      cy.contains("SkylarkSet");
      cy.contains("System Object");
    });

    getTabs();

    cy.get("[data-testid=uiconfig-editor]").within(() => {
      cy.contains("UI Config");
    });
  });
});
