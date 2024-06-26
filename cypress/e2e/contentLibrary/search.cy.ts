import { hasOperationName } from "../../support/utils/graphqlTestUtils";
import { configureSkylarkIntercepts } from "../../support/utils/intercepts";

describe("Content Library - Search", () => {
  beforeEach(() => {
    cy.login();

    configureSkylarkIntercepts();

    cy.visit("/");
    cy.wait("@introspectionQuery");
    cy.wait("@getObjectsConfig");

    cy.get("[data-testid=animated-skylark-logo]").should("not.exist");
  });

  it("visits home", () => {
    cy.contains("We couldn't find matches for the search term.").should(
      "not.exist",
    );
    cy.contains("GOT");
    cy.contains("All object types translated to en-GB", { timeout: 10000 });

    cy.percySnapshot("Homepage");
  });

  it("visits home when no search data is returned", () => {
    cy.intercept("POST", Cypress.env("skylark_graphql_uri"), (req) => {
      if (hasOperationName(req, "SL_UI_SEARCH")) {
        req.alias = "searchQueryEmpty";
        req.reply({
          fixture: "./skylark/queries/search/empty.json",
        });
      }
    });

    cy.visit("/");

    cy.wait("@searchQueryEmpty");

    cy.get("[data-testid=animated-skylark-logo]").should("not.exist");

    cy.contains("We couldn't find matches for the search term.");

    cy.contains("All object types translated to en-GB", { timeout: 10000 });

    cy.percySnapshot("Homepage - no search data");
  });

  it("searches for GOT S01", () => {
    cy.contains("GOT S02").should("exist");

    cy.get('input[name="search-query-input"]').type("GOT S01");

    cy.contains("GOT S02").should("not.exist");
    cy.contains("GOT S01 Trailer").should("exist");
  });

  it("displays an objects display_name in the object type filter", () => {
    cy.contains("Asset").should("exist");
    cy.get('[aria-label="Open Search Options"]').click();

    cy.get("[data-testid=checkbox-grid-object-type]").within(() => {
      cy.contains("Set");
      cy.contains("SkylarkSet").should("not.exist");
    });
  });

  it("filters for only Assets", () => {
    cy.contains("Asset").should("exist");
    cy.get('[aria-label="Open Search Options"]').click();

    cy.contains("Toggle all").click();
    cy.contains("Apply").should("be.disabled");
    cy.get("#checkbox-object-type-skylarkasset").click();
    cy.contains("Apply").should("not.be.disabled").click();
  });

  it("filters for only title, uid, external_id, title_short fields", () => {
    cy.contains("Asset").should("exist");
    cy.get('[aria-label="Open Search Options"]').click();

    cy.get("#checkbox-sectioned-by-object-types-toggle-all").click();

    const columnsFilters = cy.get("[data-cy=column-filters]");

    cy.contains("Apply").should("be.disabled");

    columnsFilters
      .get(`#checkbox-columns-special-skylark-ui-display-field`)
      .click();
    columnsFilters.get(`#checkbox-columns-special-uid`).click();
    columnsFilters.get(`#checkbox-columns-skylarkasset-internal_title`).click();

    cy.contains("Apply").should("not.be.disabled").click();
  });

  it("filters for only title, uid, external_id, title_short fields (old column filters - all fields in a single Checkbox)", () => {
    cy.contains("Asset").should("exist");
    cy.get('[aria-label="Open Search Options"]').click();

    cy.get('button[role="switch"]').click({ force: true });

    const columnsFilters = cy.get("[data-cy=column-filters]");

    columnsFilters.contains("Toggle all").click();
    cy.contains("Apply").should("be.disabled");
    [
      "title",
      "uid",
      "external_id",
      "title_short",
      "synopsis",
      "synopsis_short",
    ].forEach((field) => {
      columnsFilters.get(`#checkbox-all-fields-${field}`).click();
    });
    cy.contains("Apply").should("not.be.disabled").click();
  });

  it("filters to en-GB only got content", () => {
    cy.intercept("POST", Cypress.env("skylark_graphql_uri"), (req) => {
      if (hasOperationName(req, "SL_UI_GET_USER_AND_ACCOUNT")) {
        req.alias = "getUserAndAccountNoLanguage";
        req.reply({
          data: {
            getUser: {
              account: "testtest",
              role: "ADMIN",
              permissions: [
                "READ",
                "WRITE",
                "IGNORE_AVAILABILITY",
                "TIME_TRAVEL",
                "ACCOUNT_SETUP",
                "SELF_CONFIG",
              ],
            },
            getAccount: {
              config: {
                default_language: null,
              },
              account_id: "testtest",
              skylark_version: "230714.7.2",
            },
          },
        });
      }
    });

    cy.visit("/");
    cy.wait("@introspectionQuery");

    cy.get('[role="combobox"]').type("en-GB");
    cy.get("[data-testid=select-options]").within(() => {
      cy.contains("en-GB").click();
    });

    cy.contains("pt-PT").should("not.exist");
  });

  it("searches for got winter is coming, clicks the en-GB version, then the pt-PT version", () => {
    cy.get('input[name="search-query-input"]').type("got winter is coming");

    cy.contains("div", "GOT S01E1 - Winter");
    cy.openContentLibraryObjectPanelByText("en-GB");

    cy.get("[data-testid=panel-metadata]").within(() => {
      cy.getByLabel("Slug").should("have.value", "winter-is-coming");
    });

    // Verify panel is in en-GB
    cy.get("[data-testid=panel-header]").within(() => {
      cy.contains("en-GB");
    });

    // Change to pt-PT and verify
    cy.get("[data-testid=object-search-results]").scrollTo(0, 0);
    cy.openContentLibraryObjectPanelByText("pt-PT");

    cy.get("[data-testid=panel-header]").within(() => {
      cy.contains("pt-PT");
    });
  });

  it("uses the Availability Picker to return kids content", () => {
    cy.get("[data-testid=open-availability-picker]").click();

    // Select Customer type
    cy.get("[data-testid=availability-picker]").within(() => {
      cy.contains("Customer type");
      cy.get('input[placeholder="Select Customer Type value"]').click();
    });
    cy.contains("Kids").click();

    // Select Device type
    cy.get("[data-testid=availability-picker]").within(() => {
      cy.contains("Device type");
      cy.get('input[placeholder="Select Device Type value"]').click();
    });
    cy.contains("PC").click();

    cy.get("[data-testid=availability-picker]").within(() => {
      cy.contains("Save").click();
    });

    cy.get("[data-testid=open-availability-picker]").contains(
      "Dimensions only",
    );

    cy.contains("Classic kids shows");

    // Wait for second page of search results to load before Percy screenshot
    cy.get(`[data-cy=pill]`).should("exist").should("have.length.at.least", 15);

    cy.percySnapshot("Homepage - Filtered By Availability Dimensions (kids)");
  });

  it("does a lookup for streamtv_homepage with the UID & External ID", () => {
    cy.get('[aria-label="Open Search Options"]').click();

    cy.get("[data-testid=radio-group-lookup-type]").within(() => {
      cy.contains("UID").click();
    });

    cy.contains("Apply").should("not.be.disabled").click();

    cy.contains("Enter a lookup value").should("exist");
    cy.contains("We couldn't find matches for the search term.").should(
      "exist",
    );

    cy.get('input[name="search-query-input"]').type("streamtv_homepage");

    cy.contains("StreamTV Homepage");

    cy.percySnapshot("Homepage - UID & External ID Lookup");
  });
});
