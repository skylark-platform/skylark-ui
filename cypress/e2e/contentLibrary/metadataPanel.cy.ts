import {
  hasMatchingQuery,
  hasMatchingVariable,
  hasOperationName,
} from "../../support/utils/graphqlTestUtils";

const assetOnlyQuery =
  "query SEARCH($ignoreAvailability: Boolean = true, $queryString: String!) {\n  search(\n    ignore_availability: $ignoreAvailability\n    query: $queryString\n    limit: 1000\n  ) {\n    __typename\n    objects {\n      ... on Asset {\n        __typename\n        uid\n        external_id\n        __Asset__slug: slug\n        __Asset__title: title\n        __Asset__type: type\n        __Asset__url: url\n      }\n      __typename\n    }\n  }\n}";

describe("Content Library - Metadata Panel", () => {
  beforeEach(() => {
    cy.login();

    cy.intercept("POST", Cypress.env("skylark_graphql_uri"), (req) => {
      if (hasOperationName(req, "IntrospectionQuery")) {
        req.alias = "introspectionQuery";
        req.reply({
          fixture: "./skylark/queries/introspection/introspectionQuery.json",
        });
      }
      if (hasOperationName(req, "GET_SKYLARK_SCHEMA")) {
        req.reply({
          fixture: "./skylark/queries/introspection/schema.json",
        });
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
      if (hasOperationName(req, "GET_SkylarkSet")) {
        req.reply({
          fixture: "./skylark/queries/getObject/homepage.json",
        });
      }
      if (hasOperationName(req, "GET_Movie")) {
        req.reply({
          fixture: "./skylark/queries/getObject/allAvailTestMovie.json",
        });
      }
      if (hasOperationName(req, "GET_Movie_AVAILABILITY")) {
        req.reply({
          fixture:
            "./skylark/queries/getObjectAvailability/allAvailTestMovieAvailability.json",
        });
      }
      if (hasOperationName(req, "SEARCH")) {
        if (hasMatchingVariable(req, "queryString", "got winter is coming")) {
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
            fixture: "./skylark/queries/search/allMediaTestMovieOnly.json",
          });
        } else if (hasMatchingQuery(req, assetOnlyQuery)) {
          req.reply({
            fixture: "./skylark/queries/search/gotAssetsOnly.json",
          });
        } else {
          req.reply({
            fixture: "./skylark/queries/search/gotPage1.json",
          });
        }
      }
      if (hasOperationName(req, "UPDATE_OBJECT_CONTENT_Set")) {
        req.alias = "updateHomepageSetContent";
        req.reply({
          fixture: "./skylark/mutations/updateHomepageSetContent.json",
        });
      }
    });

    cy.visit("/");
    cy.wait("@introspectionQuery");
  });

  it("open Metadata panel", () => {
    cy.get('input[name="search-query-input"]').type("got winter is coming");
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

  it("close Metadata panel", () => {
    cy.get('input[name="search-query-input"]').type("got winter is coming");
    cy.contains("tr", "GOT S01E1 - Winter");
    cy.contains("tr", "GOT S01E1 - Winter")
      .should(($el) => {
        // eslint-disable-next-line jest/valid-expect
        expect(Cypress.dom.isDetached($el)).to.eq(false);
      })
      .within(() => {
        cy.get('[aria-label="object-info"]').click();
      });

    cy.contains("Edit Metadata").should("exist");
    cy.get("button").contains("Close").click();
    cy.contains("Edit Metadata").should("not.exist");
  });

  it("view GraphQL query", () => {
    cy.get('input[name="search-query-input"]').type("got winter is coming");
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

  it("change language to pt-PT", () => {
    cy.get('input[name="search-query-input"]').type("got winter is coming");
    cy.contains("tr", "GOT S01E1 - Winter");
    cy.contains("tr", "en-GB")
      .should(($el) => {
        // eslint-disable-next-line jest/valid-expect
        expect(Cypress.dom.isDetached($el)).to.eq(false);
      })
      .within(() => {
        cy.get('[aria-label="object-info"]').click();
      });

    cy.contains("Metadata");

    cy.get("[data-testid=panel-metadata]").within(() => {
      cy.contains("Winter is Coming");
    });

    // Change language
    cy.get("[data-testid=panel-header]").within(() => {
      cy.contains("en-GB").click();
      cy.contains("pt-PT").click();
    });

    cy.get("[data-testid=panel-metadata]").within(() => {
      cy.contains("O Inverno Está Chegando");
    });

    cy.percySnapshot("Homepage - metadata panel - fields - pt-PT");
  });

  describe("Imagery tab", () => {
    it("open Imagery tab", () => {
      cy.get('input[name="search-query-input"]').type("got winter is coming");
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
      cy.contains("section", "Thumbnail")
        .find("img")
        .should(
          "have.attr",
          "src",
          "https://dl.airtable.com/.attachments/c8b23d45c55cf09081954dd208dcce4b/80b72296/GOT-S1-1.jpg",
        );

      cy.percySnapshot("Homepage - metadata panel - imagery");
    });
  });

  describe("Content tab", () => {
    it("Open", () => {
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

    it("Reorder, remove and cancel", () => {
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

    it("Reorder, remove and save", () => {
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
      cy.contains("button", "Edit Content").should("not.be.disabled").click();

      // Delete
      cy.contains("Discover Collection")
        .parent()
        .parent()
        .within(() => {
          cy.get("svg").click();
        });

      // Reorder
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
          return text;
        })
        .should("deep.eq", [
          "Spotlight movies",
          "New TV Releases",
          "GOT S01",
          "GOT S02",
          "Home page hero",
        ]);

      // Test save
      cy.contains("Save").click();

      cy.wait("@updateHomepageSetContent");

      cy.contains("button", "Edit Content").should("not.be.disabled");

      cy.get("[data-testid=panel-content-items] > li p")
        .then(($els) => {
          const text = $els.toArray().map((el) => el.innerText.trim());
          return text;
        })
        .should("deep.eq", [
          "Spotlight movies",
          "New TV Releases",
          "GOT S01",
          "GOT S02",
          "Home page hero",
        ]);
    });
  });

  describe("Availability tab", () => {
    it("open Availability tab", () => {
      cy.get('input[name="search-query-input"]').type("all avail test movie");
      cy.contains("All Avail Test Movie").should("exist");
      cy.contains("tr", "All Avail Test Movie")
        .should(($el) => {
          // eslint-disable-next-line jest/valid-expect
          expect(Cypress.dom.isDetached($el)).to.eq(false);
        })
        .within(() => {
          cy.get('[aria-label="object-info"]').click();
        });

      cy.contains("button", "Availability").click();

      cy.contains("Active in the past");
      cy.contains("Time Window");
      cy.contains("Audience");

      cy.percySnapshot("Homepage - metadata panel - availability");
    });
  });
});
