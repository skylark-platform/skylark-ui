import {
  hasMatchingVariable,
  hasOperationName,
} from "../../support/utils/graphqlTestUtils";
import { configureSkylarkIntercepts } from "../../support/utils/handlers";

describe("Compare Schema Versions", () => {
  beforeEach(() => {
    cy.login();

    configureSkylarkIntercepts();

    cy.fixture("./skylark/queries/introspection/introspectionQuery.json").then(
      (introspectionQueryJson) => {
        cy.fixture(
          "./skylark/queries/introspection/introspectionQueryWithoutEpisode.json",
        ).then((introspectionQueryWithoutEpisodeJson) => {
          cy.intercept("POST", Cypress.env("skylark_graphql_uri"), (req) => {
            if (hasOperationName(req, "SL_UI_LIST_SCHEMA_VERSIONS")) {
              req.reply({
                data: {
                  listConfigurationVersions: {
                    objects: [
                      {
                        active: true,
                        base_version: null,
                        published: true,
                        version: 1,
                      },
                      {
                        active: true,
                        base_version: 1,
                        published: true,
                        version: 2,
                      },
                      {
                        active: false,
                        base_version: 2,
                        published: false,
                        version: 3,
                      },
                    ],
                  },
                },
              });
            }
            if (hasOperationName(req, "SL_UI_GET_CONFIGURATION_SCHEMA")) {
              if (hasMatchingVariable(req, "version", 2)) {
                req.reply({
                  data: {
                    getConfigurationSchema: JSON.stringify(
                      introspectionQueryJson.data,
                    ),
                  },
                });
              } else if (hasMatchingVariable(req, "version", 3)) {
                req.reply({
                  data: {
                    getConfigurationSchema: JSON.stringify(
                      introspectionQueryWithoutEpisodeJson.data,
                    ),
                  },
                });
              }
            }
          });
        });
      },
    );

    cy.visit("/content-model");
    cy.wait("@introspectionQuery");
  });

  it("see's the View Schema Changes button is disabled when the page is loaded", () => {
    cy.get("[data-testid=content-model-editor]").within(() => {
      cy.contains("SkylarkSet");
      cy.contains("System Object");
    });

    cy.contains("button", "View Schema Changes").should("be.disabled");
    cy.get('input[placeholder="Schema Version"]').should(
      "have.value",
      "2 (active)",
    );
  });

  it("selects a new Schema version which doesn't have the Episode object type", () => {
    cy.get("[data-testid=content-model-editor]").within(() => {
      cy.contains("SkylarkSet");
      cy.contains("System Object");
    });

    cy.contains("Episode").should("exist");

    cy.get('input[placeholder="Schema Version"]').click();
    cy.contains("3 (draft)").click();
    cy.get('input[placeholder="Schema Version"]').should(
      "have.value",
      "3 (draft)",
    );

    cy.contains("Episode").should("not.exist");
  });

  it("selects a new Schema version and opens the View Schema changes modal", () => {
    cy.get("[data-testid=content-model-editor]").within(() => {
      cy.contains("SkylarkSet");
      cy.contains("System Object");
    });

    cy.get('input[placeholder="Schema Version"]').click();
    cy.contains("3 (draft)").click();
    cy.get('input[placeholder="Schema Version"]').should(
      "have.value",
      "3 (draft)",
    );

    cy.contains("button", "View Schema Changes")
      .should("not.be.disabled")
      .click();

    cy.contains("Episode").scrollIntoView().click();
  });

  it("opens the View Schema changes modal and verifies Episode has been removed", () => {
    cy.get('input[placeholder="Schema Version"]').click();
    cy.contains("3 (draft)").click();

    cy.contains("button", "View Schema Changes")
      .should("not.be.disabled")
      .click();

    cy.contains("Episode").scrollIntoView().click();
  });

  it("opens the View Schema changes modal and verifies Season has been modified", () => {
    cy.get('input[placeholder="Schema Version"]').click();
    cy.contains("3 (draft)").click();

    cy.contains("button", "View Schema Changes")
      .should("not.be.disabled")
      .click();

    cy.get("[data-testid=schema-versions-modal]").within(() => {
      cy.contains("Season").scrollIntoView().click();
      cy.contains("AWSDate -> String");
    });

    cy.percySnapshot("Content Model - Compare Schema - Season modified");
  });
});
