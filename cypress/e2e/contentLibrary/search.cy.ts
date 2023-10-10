import {
  hasMatchingQuery,
  hasMatchingVariable,
  hasOperationName,
} from "../../support/utils/graphqlTestUtils";

const assetOnlyQuery =
  "query SEARCH($ignoreAvailability: Boolean = true, $queryString: String!) {\n  search(\n    ignore_availability: $ignoreAvailability\n    query: $queryString\n    limit: 1000\n  ) {\n    __typename\n    objects {\n      ... on Asset {\n        __typename\n        uid\n        external_id\n        __Asset__slug: slug\n        __Asset__title: title\n        __Asset__type: type\n        __Asset__url: url\n      }\n      __typename\n    }\n  }\n}";

describe("Content Library - Search", () => {
  beforeEach(() => {
    cy.login();

    cy.intercept("POST", Cypress.env("skylark_graphql_uri"), (req) => {
      if (hasOperationName(req, "IntrospectionQuery")) {
        req.alias = "introspectionQuery";
        req.reply({
          fixture: "./skylark/queries/introspection/introspectionQuery.json",
        });
      }
      if (hasOperationName(req, "GET_OBJECTS_CONFIG")) {
        req.alias = "introspectionQuery";
        req.reply({
          fixture: "./skylark/queries/getObjectsConfig/allObjectsConfig.json",
        });
      }
      if (hasOperationName(req, "GET_ACCOUNT_STATUS")) {
        req.reply({
          fixture: "./skylark/queries/getAccountStatus/default.json",
        });
      }
      if (hasOperationName(req, "SEARCH")) {
        if (
          hasMatchingVariable(req, "dimensions", [
            { dimension: "customer-types", value: "kids" },
            { dimension: "device-types", value: "pc" },
          ])
        ) {
          req.reply({
            fixture: "./skylark/queries/search/dimensionsKids.json",
          });
        } else if (
          hasMatchingVariable(req, "queryString", "got winter is coming")
        ) {
          req.reply({
            fixture: "./skylark/queries/search/gotWinterIsComing.json",
          });
        } else if (hasMatchingVariable(req, "queryString", "Homepage")) {
          req.reply({
            fixture: "./skylark/queries/search/homepage.json",
          });
        } else if (
          hasMatchingVariable(req, "queryString", "all avail test movie")
        ) {
          req.reply({
            fixture:
              "./skylark/queries/search/fantasticMrFox_All_Availabilities.json",
          });
        } else if (hasMatchingQuery(req, assetOnlyQuery)) {
          req.reply({
            fixture: "./skylark/queries/search/gotAssetsOnly.json",
          });
        } else if (hasMatchingVariable(req, "language", "en-GB")) {
          req.reply({
            fixture: "./skylark/queries/search/gotPage1enGB.json",
          });
        } else {
          req.reply({
            fixture: "./skylark/queries/search/gotPage1.json",
          });
        }
      }
      if (hasOperationName(req, "GET_Episode")) {
        if (hasMatchingVariable(req, "language", "pt-PT")) {
          req.reply({
            fixture: "./skylark/queries/getObject/gots01e01ptPT.json",
          });
        } else {
          req.reply({
            fixture: "./skylark/queries/getObject/gots01e01.json",
          });
        }
      }
      if (hasOperationName(req, "LIST_AVAILABILITY_DIMENSIONS")) {
        req.reply({
          fixture: "./skylark/queries/listDimensions.json",
        });
      }
      if (hasOperationName(req, "LIST_AVAILABILITY_DIMENSION_VALUES")) {
        req.reply({
          fixture: "./skylark/queries/listDimensionValues.json",
        });
      }
      if (hasOperationName(req, "GET_USER_AND_ACCOUNT")) {
        req.reply({
          fixture: "./skylark/queries/getUserAndAccount.json",
        });
      }
      if (hasOperationName(req, "GET_OBJECT_GENERIC")) {
        req.reply({
          fixture: "./skylark/queries/getObjectGeneric/homepage.json",
        });
      }
    });

    cy.visit("/");
    cy.wait("@introspectionQuery");
  });

  it("visits home", () => {
    cy.contains("We couldn't find matches for the search term.").should(
      "not.exist",
    );
    cy.contains("GOT");
    cy.percySnapshot("Homepage");
  });

  it("visits home when no search data is returned", () => {
    cy.intercept("POST", Cypress.env("skylark_graphql_uri"), (req) => {
      if (hasOperationName(req, "SEARCH")) {
        req.alias = "searchQueryEmpty";
        req.reply({
          fixture: "./skylark/queries/search/empty.json",
        });
      }
    });

    cy.visit("/");

    cy.wait("@searchQueryEmpty");
    cy.contains("We couldn't find matches for the search term.");
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

    const columnsFilters = cy.get("[data-testid=checkbox-grid-columns]");

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
      columnsFilters.get(`#checkbox-columns-${field}`).click();
    });
    cy.contains("Apply").should("not.be.disabled").click();
  });

  it("filters to en-GB only got content", () => {
    cy.intercept("POST", Cypress.env("skylark_graphql_uri"), (req) => {
      if (hasOperationName(req, "GET_USER_AND_ACCOUNT")) {
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
