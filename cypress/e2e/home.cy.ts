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
      if (hasOperationName(req, "GET_Set")) {
        req.reply({
          fixture: "./skylark/queries/getObject/homepage.json",
        });
      }
      if (hasOperationName(req, "SEARCH")) {
        if (hasMatchingVariable(req, "queryString", "GOT S01")) {
          req.reply({
            fixture: "./skylark/queries/search/gots01.json",
          });
        } else if (hasMatchingVariable(req, "queryString", "Homepage")) {
          req.reply({
            fixture: "./skylark/queries/search/homepage.json",
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

    cy.visit("/?edit=true"); // TODO remove edit=true when all edit modes are enabled
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
      cy.contains("tr", "GOT S01E1 - Winter");
      cy.contains("tr", "GOT S01E1 - Winter")
        .should(($el) => {
          // eslint-disable-next-line jest/valid-expect
          expect(Cypress.dom.isDetached($el)).to.eq(false);
        })
        .within(() => {
          cy.get('[aria-label="object-info"]').click();
        });

      cy.contains("Metadata");
      cy.contains(
        "Series Premiere. Eddard Stark is torn between his family and an old friend when asked to serve at the side of King Robert Baratheon; Viserys plans to wed his sister to a nomadic warlord in exchange for an army.",
      );
      cy.percySnapshot("Homepage - metadata panel - fields");
    });

    it("view GraphQL query", () => {
      cy.get('input[name="search-query-input"]').type("GOT S01");
      cy.contains("GOT S01 Trailer").should("exist");
      cy.contains("tr", "GOT S01E1 - Winter")
        .should(($el) => {
          // eslint-disable-next-line jest/valid-expect
          expect(Cypress.dom.isDetached($el)).to.eq(false);
        })
        .within(() => {
          cy.get('[aria-label="object-info"]').click();
        });
      cy.contains("Metadata");
      cy.get("[data-testid=panel-header]").within(() => {
        cy.get('[aria-label="Open Panel Menu"]').click();
        cy.get("[data-testid=graphql-query-modal-button]").parent().click();
      });
      cy.contains("Query for");
      cy.percySnapshot("Homepage - metadata panel - graphql query");
    });

    it("open Imagery tab", () => {
      cy.get('input[name="search-query-input"]').type("GOT S01");
      cy.contains("GOT S01 Trailer").should("exist");
      cy.contains("tr", "GOT S01E1 - Winter")
        .should(($el) => {
          // eslint-disable-next-line jest/valid-expect
          expect(Cypress.dom.isDetached($el)).to.eq(false);
        })
        .within(() => {
          cy.get('[aria-label="object-info"]').click();
        });

      cy.contains("button", "Imagery").click();

      cy.contains("Imagery");
      cy.contains("Title: GOT - S1 - 1.jpg");
      cy.contains("section", "THUMBNAIL")
        .find("img")
        .should(
          "have.attr",
          "src",
          "https://dl.airtable.com/.attachments/c8b23d45c55cf09081954dd208dcce4b/80b72296/GOT-S1-1.jpg",
        );

      cy.percySnapshot("Homepage - metadata panel - imagery");
    });

    it("open Content tab", () => {
      cy.get('input[name="search-query-input"]').type("Homepage");
      cy.contains("Homepage").should("exist");
      cy.contains("tr", "Homepage")
        .should(($el) => {
          // eslint-disable-next-line jest/valid-expect
          expect(Cypress.dom.isDetached($el)).to.eq(false);
        })
        .within(() => {
          cy.get('[aria-label="object-info"]').click();
        });
      cy.contains("button", "Content").click();

      cy.percySnapshot("Homepage - metadata panel - content");
    });

    it.only("open Content tab - edit and cancel", () => {
      cy.get('input[name="search-query-input"]').type("Homepage");
      cy.contains("Homepage").should("exist");
      cy.contains("tr", "Homepage")
        .should(($el) => {
          // eslint-disable-next-line jest/valid-expect
          expect(Cypress.dom.isDetached($el)).to.eq(false);
        })
        .within(() => {
          cy.get('[aria-label="object-info"]').click();
        });
      cy.contains("button", "Content").click();

      // Test switching to edit mode
      cy.contains("Editing").should("not.exist");
      cy.contains("button", "Edit Content").should("not.be.disabled").click();
      cy.get("[data-testid=panel-header]").within(() => {
        cy.contains("button", "Save").should("not.be.disabled");
        cy.contains("button", "Cancel").should("not.be.disabled");
      });
      cy.contains("Editing").should("exist");
      cy.get("[data-testid=panel-content-items] > li p")
        .then(($els) => {
          const text = $els.toArray().map((el) => el.innerText.trim());
          return text;
        })
        .should("deep.eq", [
          "Home page hero",
          "Spotlight movies",
          "New TV Releases",
          "GOT S01",
          "GOT S02",
          "Discover Collection",
        ]);

      cy.percySnapshot("Homepage - metadata panel - content (edit)");

      // Test deleting
      cy.contains("Discover Collection")
        .parent()
        .parent()
        .within(() => {
          cy.get("svg").click();
        });
      cy.contains("Discover Collection").should("not.exist");

      // Test reorder
      cy.get("[data-testid=panel-content-items] > li")
        .first()
        .within(() => {
          cy.get("input").clear().type("20");
        });

      cy.get("[data-testid=panel-content-items]").click();

      // Test updated order
      cy.get("[data-testid=panel-content-items] > li p")
        .then(($els) => {
          const text = $els.toArray().map((el) => el.innerText.trim());
          console.log(text);
          return text;
        })
        .should("deep.eq", [
          "Spotlight movies",
          "New TV Releases",
          "GOT S01",
          "GOT S02",
          "Home page hero",
        ]);

      cy.percySnapshot("Homepage - metadata panel - content (reorder)");

      // Test cancel
      cy.contains("Cancel").click();

      cy.contains("Editing").should("not.exist");
      cy.get("[data-testid=panel-content-items] > li p")
        .then(($els) => {
          const text = $els.toArray().map((el) => el.innerText.trim());
          return text;
        })
        .should("deep.eq", [
          "Home page hero",
          "Spotlight movies",
          "New TV Releases",
          "GOT S01",
          "GOT S02",
          "Discover Collection",
        ]);
    });

    it("close Metadata panel", () => {
      cy.get('input[name="search-query-input"]').type("GOT S01");
      cy.contains("GOT S01 Trailer").should("exist");
      cy.contains("tr", "GOT S01E1 - Winter");
      cy.contains("tr", "GOT S01E1 - Winter")
        .should(($el) => {
          // eslint-disable-next-line jest/valid-expect
          expect(Cypress.dom.isDetached($el)).to.eq(false);
        })
        .within(() => {
          cy.get('[aria-label="object-info"]').click();
        });

      cy.contains("Metadata").should("exist");
      cy.get("button").contains("Close").click();
      cy.contains("Metadata").should("not.exist");
    });
  });
});
