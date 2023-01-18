import { LOCAL_STORAGE } from "../../src/constants/skylark";

import {
  hasMatchingQuery,
  hasMatchingVariable,
  hasOperationName,
} from "../support/utils/graphqlTestUtils";

const assetOnlyQuery =
  "query SEARCH($ignoreAvailability: Boolean = true, $queryString: String!) {\n  search(\n    ignore_availability: $ignoreAvailability\n    query: $queryString\n    limit: 1000\n  ) {\n    __typename\n    objects {\n      ... on Asset {\n        __typename\n        uid\n        external_id\n        __Asset__slug: slug\n        __Asset__title: title\n        __Asset__type: type\n        __Asset__url: url\n      }\n      __typename\n    }\n  }\n}";

describe("Content Library", () => {
  beforeEach(() => {
    window.localStorage.setItem(
      LOCAL_STORAGE.betaAuth.uri,
      "http://localhost:3000/graphql",
    );
    window.localStorage.setItem(LOCAL_STORAGE.betaAuth.token, "token");

    cy.intercept("POST", "http://localhost:3000/graphql", (req) => {
      if (hasOperationName(req, "GET_SKYLARK_OBJECT_TYPES")) {
        req.alias = "getSkylarkObjectTypesQuery";
        req.reply({
          fixture: "./skylark/queries/introspection/objectTypes.json",
        });
      }
      if (hasOperationName(req, "GET_SEARCHABLE_OBJECTS")) {
        req.alias = "getSearchableObjects";
        req.reply({
          fixture: "./skylark/queries/introspection/searchableUnion.json",
        });
      }
      if (hasOperationName(req, "GET_SKYLARK_SCHEMA")) {
        req.alias = "getSchema";
        req.reply({
          fixture: "./skylark/queries/introspection/schema.json",
        });
      }
      if (hasOperationName(req, "SEARCH")) {
        if (hasMatchingVariable(req, "queryString", "GOT S01")) {
          req.alias = "searchQueryGOTS01";
          req.reply({
            fixture: "./skylark/queries/search/gots01.json",
          });
        } else if (hasMatchingQuery(req, assetOnlyQuery)) {
          req.alias = "searchQueryAssetsOnly";
          req.reply({
            fixture: "./skylark/queries/search/gotAssetsOnly.json",
          });
        } else {
          req.alias = "searchQuery";
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
    cy.intercept("POST", "http://localhost:3000/graphql", (req) => {
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
});
