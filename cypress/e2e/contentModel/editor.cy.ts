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
    return {
      uiConfig: cy.contains("li", "UI Config"),
      metadata: cy.contains("li", "Metadata"),
      relationships: cy.contains("li", "Relationships"),
    };
  };

  it("loads the ContentModel page defaulting to SkylarkSet", () => {
    cy.get("[data-testid=content-model-editor]").within(() => {
      cy.contains("SkylarkSet");
      cy.contains("System Object");
    });

    getTabs();

    cy.get("[data-testid=uiconfig-editor]").within(() => {
      cy.contains("UI Config");

      cy.contains('Example "internal_title" value');
    });

    cy.percySnapshot("Content Model");
  });

  it("switches to the Metadata tab", () => {
    cy.get("[data-testid=content-model-editor]").within(() => {
      cy.contains("SkylarkSet");
      cy.contains("System Object");
    });

    const tabs = getTabs();

    tabs.metadata.click();

    cy.get("[data-testid=fields-editor]").within(() => {
      cy.contains("System");
      cy.contains("Translatable");
      cy.contains("Global");

      cy.contains("title_short");
      cy.contains("internal_title");
    });
  });

  it("switches to the Relationships tab", () => {
    cy.get("[data-testid=content-model-editor]").within(() => {
      cy.contains("SkylarkSet");
      cy.contains("System Object");
    });

    const tabs = getTabs();

    tabs.relationships.click();

    cy.get("[data-testid=relationships-editor]").within(() => {
      cy.contains("Relationships");
      cy.contains("CallToAction");
      cy.contains("call_to_actions");
    });
  });
});
