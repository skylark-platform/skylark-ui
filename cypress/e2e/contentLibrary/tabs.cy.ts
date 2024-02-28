import { configureSkylarkIntercepts } from "../../support/utils/handlers";

const assetOnlyQuery =
  "query SEARCH($ignoreAvailability: Boolean = true, $queryString: String!) {\n  search(\n    ignore_availability: $ignoreAvailability\n    query: $queryString\n    limit: 1000\n  ) {\n    __typename\n    objects {\n      ... on Asset {\n        __typename\n        uid\n        external_id\n        __Asset__slug: slug\n        __Asset__title: title\n        __Asset__type: type\n        __Asset__url: url\n      }\n      __typename\n    }\n  }\n}";

describe("Content Library - Search", () => {
  beforeEach(() => {
    cy.login();

    configureSkylarkIntercepts();

    cy.visit("/");
    cy.wait("@introspectionQuery");
  });

  it("loads default view with 2 default tabs", () => {
    cy.get("[data-testid=object-search-tab-overview]").within(() => {
      cy.contains("Default View");
    });

    cy.get("[data-testid=object-search-tabs]").within(() => {
      cy.contains("Default View");
      cy.contains("Availability");
    });
  });

  it("Changes to Availability tab", () => {
    cy.get("[data-testid=object-search-tab-overview]").within(() => {
      cy.contains("Default View");
    });

    cy.get("[data-testid=object-search-tabs]").within(() => {
      cy.contains("Default View");
      cy.contains("Availability").click();
    });

    cy.get("[data-testid=object-search-tab-overview]").within(() => {
      cy.contains("Availability");
      cy.contains("Availability objects");
    });
  });

  it("Adds a Search tab", () => {
    cy.get("[data-testid=object-search-tab-overview]").within(() => {
      cy.contains("Default View");
    });

    cy.get(`[aria-label="add tab"]`).click();

    cy.get("[data-testid=dropdown-section-blank-options]").within(() => {
      cy.contains("Search").click();
    });

    cy.get("[data-testid=object-search-tab-overview]").within(() => {
      cy.contains("Search 3");
    });
  });

  it("Adds a specific Object search tab", () => {
    cy.get("[data-testid=object-search-tab-overview]").within(() => {
      cy.contains("Default View");
    });

    cy.get(`[aria-label="add tab"]`).click();

    cy.get("[data-testid=dropdown-section-search-object-type-options]").within(
      () => {
        cy.contains("Episode").click();
      },
    );

    cy.get("[data-testid=object-search-tab-overview]").within(() => {
      cy.contains("Episode objects");
    });

    cy.contains("Object type").should("not.exist");
  });

  it("Renames active tab, reloads the page to see the tab is still there", () => {
    cy.get("[data-testid=object-search-tab-overview]").within(() => {
      cy.contains("Default View");
    });

    cy.get(`[aria-label="Rename active tab"]`).click();
    cy.get(`[aria-label="tab name input"]`).clear().type("New tab name");
    cy.get(`[aria-label="save tab rename"]`).click();

    cy.get("[data-testid=object-search-tab-overview]").within(() => {
      cy.contains("New tab name");
    });
  });

  it("Deletes active tab, reloads the page to see the tab is still gone", () => {
    cy.get("[data-testid=object-search-tab-overview]").within(() => {
      cy.contains("Default View");
    });

    cy.get(`[aria-label="Delete active tab"]`).click();

    cy.get("[data-testid=object-search-tab-overview]").within(() => {
      cy.contains("Availability");
    });

    cy.reload();

    cy.get("[data-testid=object-search-tab-overview]").within(() => {
      cy.contains("Availability");
    });

    cy.contains("Default View").should("not.exist");
  });

  it("Modifies the tab and reloads the page to verify state is stored", () => {
    cy.get("[data-testid=object-search-tab-overview]").within(() => {
      cy.contains("Default View");
    });

    cy.get(`[aria-label="Rename active tab"]`).click();
    cy.get(`[aria-label="tab name input"]`).clear().type("New tab name");
    cy.get(`[aria-label="save tab rename"]`).click();

    cy.get("[data-testid=object-search-tab-overview]").within(() => {
      cy.contains("New tab name");
    });

    // Check UID column is shown
    cy.get("[data-testid=object-search-results-content]").within(() => {
      cy.contains("UID").should("exist");
    });

    // Select Filters
    cy.get('[aria-label="Open Search Options"]').click();

    cy.get("[data-testid=checkbox-grid-object-type]").within(() => {
      cy.contains("Toggle all").click();
      cy.contains("Brand").click();
      cy.contains("Season").click();
      cy.contains("Episode").click();
      cy.contains("Movie").click();
    });

    const columnsFilters = cy.get("[data-cy=column-filters]");

    cy.get("#checkbox-sectioned-by-object-types-toggle-all").click();
    cy.contains("Apply").should("be.disabled");

    columnsFilters
      .get(`#checkbox-columns-special-skylark-ui-display-field`)
      .click();
    columnsFilters.get(`#checkbox-columns-special-external_id`).click();
    columnsFilters.get(`#checkbox-columns-episode-internal_title`).click();

    cy.contains("Apply").click();

    // Check UID column is hidden
    cy.get("[data-testid=object-search-results-content]").within(() => {
      cy.contains("UID").should("not.exist");
    });

    // Select Language
    cy.get('[role="combobox"]').clear().type("pt-PT");
    cy.get("[data-testid=select-options]").within(() => {
      cy.contains("pt-PT").click();
    });

    // Select Availability
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

    // Select Time Travel
    cy.get("[data-testid=availability-picker]").within(() => {
      cy.get("#availability-picker-time-travel-input").type(
        "2022-12-30T14:20:00",
      );
    });

    cy.get("[data-testid=availability-picker]").within(() => {
      cy.contains("Save").click();
    });

    cy.get("[data-testid=open-availability-picker]").contains(
      "Dimensions & Time",
    );

    // Final check for the Availability Status
    cy.get("[data-testid=object-search-tab-overview]").within(() => {
      cy.contains("New tab name");
      cy.contains(
        "Brand, Season, Episode & Movie objects available to Kids & PC users on Fri, Dec 30, 2022 2:20 PM (Etc/UTC) translated to pt-PT",
      );
    });

    // Reload and verify
    cy.reload();

    cy.get("[data-testid=object-search-tab-overview]").within(() => {
      cy.contains("New tab name");
      cy.contains(
        "Brand, Season, Episode & Movie objects available to Kids & PC users on Fri, Dec 30, 2022 2:20 PM (Etc/UTC) translated to pt-PT",
      );
    });

    // Check UID column is still hidden after refresh
    cy.get("[data-testid=object-search-results-content]").within(() => {
      cy.contains("UID").should("not.exist");
    });
  });

  // This was a bug
  it("Modifies the visible columns and reloads the page to verify state is stored", () => {
    cy.get("[data-testid=object-search-tab-overview]").within(() => {
      cy.contains("Default View");
    });

    // Check UID column is shown
    cy.get("[data-testid=object-search-results-content]").within(() => {
      cy.contains("UID").should("exist");
    });

    // Select Filters
    cy.get('[aria-label="Open Search Options"]').click();

    cy.get('button[role="switch"]').click({ force: true });

    const columnsFilters = cy.get("[data-cy=column-filters]");

    columnsFilters.contains("Toggle all").click();
    cy.contains("Apply").should("be.disabled");
    [
      "skylark-ui-display-field",
      "external_id",
      "title_short",
      "synopsis",
      "synopsis_short",
    ].forEach((field) => {
      columnsFilters.get(`#checkbox-all-fields-${field}`).click();
    });

    cy.contains("Apply").click();

    // Check UID column is hidden
    cy.get("[data-testid=object-search-results-content]").within(() => {
      cy.contains("UID").should("not.exist");
    });

    // Reload and verify
    cy.reload();

    cy.get("[data-testid=object-search-tab-overview]").within(() => {
      cy.contains("Default View");
    });

    // Check UID column is still hidden after refresh
    cy.get("[data-testid=object-search-results-content]").within(() => {
      cy.contains("UID").should("not.exist");
    });
  });
});
