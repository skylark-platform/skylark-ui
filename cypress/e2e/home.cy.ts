import {
  hasMatchingQuery,
  hasMatchingVariable,
  hasOperationName,
} from "../support/utils/graphqlTestUtils";

const assetOnlyQuery =
  "query SEARCH($ignoreAvailability: Boolean = true, $queryString: String!) {\n  search(\n    ignore_availability: $ignoreAvailability\n    query: $queryString\n    limit: 1000\n  ) {\n    __typename\n    objects {\n      ... on Asset {\n        __typename\n        uid\n        external_id\n        __Asset__slug: slug\n        __Asset__title: title\n        __Asset__type: type\n        __Asset__url: url\n      }\n      __typename\n    }\n  }\n}";

describe("Content Library", () => {
  beforeEach(() => {
    cy.login();

    cy.intercept("POST", Cypress.env("skylark_graphql_uri"), (req) => {
      if (hasOperationName(req, "GET_SKYLARK_OBJECT_TYPES")) {
        req.alias = "getSkylarkObjectTypesQuery";
        req.reply({
          fixture: "./skylark/queries/introspection/objectTypes.json",
        });
      }
      if (hasOperationName(req, "GET_SEARCHABLE_OBJECTS")) {
        req.reply({
          fixture: "./skylark/queries/introspection/searchableUnion.json",
        });
      }
      if (hasOperationName(req, "GET_SKYLARK_SCHEMA")) {
        req.reply({
          fixture: "./skylark/queries/introspection/schema.json",
        });
      }
      if (hasOperationName(req, "GET_Episode")) {
        req.reply({
          fixture: "./skylark/queries/getObject/gots01e01.json",
        });
      }
      if (hasOperationName(req, "SEARCH")) {
        if (hasMatchingVariable(req, "queryString", "GOT S01")) {
          req.reply({
            fixture: "./skylark/queries/search/gots01.json",
          });
        } else if (hasMatchingQuery(req, assetOnlyQuery)) {
          req.reply({
            fixture: "./skylark/queries/search/gotAssetsOnly.json",
          });
        } else {
          req.reply({
            fixture: "./skylark/queries/search/got.json",
          });
        }
      }
    });

    cy.visit("/");
    cy.wait("@getSkylarkObjectTypesQuery");
  });

  it("visits home", () => {
    cy.contains("No objects found").should("not.exist");
    cy.get(".animate-spin").should("not.exist");
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
    cy.contains("No objects found");
    cy.percySnapshot("Homepage - no search data");
  });

  it("searches for GOT S01", () => {
    cy.contains("GOT S02").should("exist");

    cy.get('input[name="search-query-input"]').type("GOT S01");

    cy.contains("GOT S02").should("not.exist");
    cy.contains("GOT S01 Trailer").should("exist");
    cy.percySnapshot("Homepage - got search data");
  });

  it("filters for only Assets", () => {
    cy.contains("Asset").should("exist");
    cy.contains("Filters").click();
    cy.percySnapshot("Homepage - filters - open");

    cy.contains("Toggle all").click();
    cy.contains("Apply").should("be.disabled");
    cy.get("#checkbox-asset").click();
    cy.percySnapshot("Homepage - filters - object types selected");
    cy.contains("Apply").should("not.be.disabled").click();
  });

  it("filters for only title, uid, external_id, title_short, title_long fields", () => {
    cy.contains("Asset").should("exist");
    cy.contains("Filters").click();

    const columnsFilters = cy.get("[data-testid=checkbox-grid-Columns]");

    columnsFilters.contains("Toggle all").click();
    cy.contains("Apply").should("be.disabled");
    [
      "title",
      "uid",
      "external_id",
      "title_short",
      "title_long",
      "synopsis_short",
      "synopsis_long",
    ].forEach((field) => {
      columnsFilters.get(`#checkbox-${field}`).click();
    });
    cy.percySnapshot("Homepage - filters - fields selected");
    cy.contains("Apply").should("not.be.disabled").click();
    cy.percySnapshot("Homepage - filters - fields active");
  });

  describe("Metadata panel", () => {
    it("open Metadata panel", () => {
      cy.get('input[name="search-query-input"]').type("GOT S01");
      cy.contains("GOT S01 Trailer").should("exist");
      cy.contains("tr", "GOT S01E1 - Winter").within(() => {
        cy.get('[aria-label="object-info"]').click();
      });

      cy.contains("Metadata");
      cy.contains(
        "Series Premiere. Eddard Stark is torn between his family and an old friend when asked to serve at the side of King Robert Baratheon; Viserys plans to wed his sister to a nomadic warlord in exchange for an army.",
      );
      cy.percySnapshot("Homepage - metadata panel - fields");
    });

    it("close Metadata panel", () => {
      cy.get('input[name="search-query-input"]').type("GOT S01");
      cy.contains("GOT S01 Trailer").should("exist");
      cy.contains("tr", "GOT S01E1 - Winter").within(() => {
        cy.get('[aria-label="object-info"]').click();
      });

      cy.contains("Metadata").should("exist");
      cy.get("button").contains("Close").click();
      cy.contains("Metadata").should("not.exist");
    });
  });
});
