import {
  hasMatchingQuery,
  hasMatchingVariable,
  hasOperationName,
} from "../../support/utils/graphqlTestUtils";

const assetOnlyQuery =
  "query SEARCH($ignoreAvailability: Boolean = true, $queryString: String!) {\n  search(\n    ignore_availability: $ignoreAvailability\n    query: $queryString\n    limit: 1000\n  ) {\n    __typename\n    objects {\n      ... on Asset {\n        __typename\n        uid\n        external_id\n        __Asset__slug: slug\n        __Asset__title: title\n        __Asset__type: type\n        __Asset__url: url\n      }\n      __typename\n    }\n  }\n}";

describe("Content Library - Object Panel", () => {
  beforeEach(() => {
    cy.login();

    cy.intercept("POST", Cypress.env("skylark_graphql_uri"), (req) => {
      if (hasOperationName(req, "IntrospectionQuery")) {
        req.alias = "introspectionQuery";
        req.reply({
          fixture: "./skylark/queries/introspection/introspectionQuery.json",
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
      if (hasOperationName(req, "UPDATE_OBJECT_CONTENT_SkylarkSet")) {
        req.alias = "updateHomepageSetContent";
        req.reply({
          fixture: "./skylark/mutations/updateHomepageSetContent.json",
        });
      }
      if (hasOperationName(req, "UPDATE_OBJECT_METADATA_Episode")) {
        req.alias = "updateEpisodeMetadata";
        req.reply({
          data: {
            updateObjectMetadata: {
              __typename: "Episode",
              _config: { primary_field: "title", colour: "#ff7ba8" },
              _meta: {
                available_languages: ["en-GB", "pt-PT"],
                language_data: { language: "en-GB", version: 1 },
                global_data: { version: 2 },
              },
              uid: "01GX396FF5MFFZ5N8YYPAM4W03",
              external_id: "recAZhG0fPFgamb8I",
              slug: "winter-is-coming",
              synopsis_long:
                "North of the Seven Kingdoms of Westeros, Night's Watch soldiers are attacked by supernatural White Walkers. One soldier escapes but is captured at Castle Winterfell. Eddard \"Ned\" Stark, Warden of the North, executes him for desertion. Later, six orphaned dire wolf pups are found and one given to each Stark sibling, including Ned's bastard son, Jon Snow. In King's Landing, the Seven Kingdoms capital, Jon Arryn, the Hand of the King, dies suddenly. King Robert Baratheon, Ned's old friend, travels to Winterfell to recruit Ned and propose a marriage between his heir Joffrey and Ned's daughter, Sansa. Lysa Arryn, Jon's widow, sends her sister (Ned's wife), Catelyn, a letter claiming the Lannisters, Queen Cersei's family, murdered Arryn. Catelyn believes the Lannisters are now plotting against King Robert. Ned's young son, Brandon, climbs a tall tower and witnesses Cersei and her twin brother, Jaime Lannister, inside having sex. To hide their incest, Jaime pushes Bran from the high window. Across the Narrow Sea in Essos, exiled Prince Viserys Targaryen forces his sister, Daenerys, to marry the Dothraki warlord, Drogo, in exchange for an army to conquer Westeros and reclaim the Iron Throne. Robert Baratheon became king after Jaime Lannister killed \"Mad\" King Aerys Targaryen, earning Jaime the nickname, \"The King Slayer\". The ancient Targaryens once commanded dragons, and Daenerys is given three fossilized dragon eggs as a wedding gift.",
              synopsis_medium:
                "Series Premiere. Eddard Stark is torn between his family and an old friend when asked to serve at the side of King Robert Baratheon; Viserys plans to wed his sister to a nomadic warlord in exchange for an army.",
              synopsis_short: null,
              title: "GOT S01E1 - Winter is Coming",
              title_long: null,
              title_medium: null,
              title_short: "Winter is Coming",
              episode_number: 1,
              release_date: "2011-04-17",
            },
          },
        });
      }
    });

    cy.visit("/");
    cy.wait("@introspectionQuery");
  });

  it("open Panel", () => {
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

  it("close Panel", () => {
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
    cy.percySnapshot("Homepage - object panel - graphql query");
  });

  describe("Metadata tab", () => {
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
        cy.getByLabel("Slug").should("have.value", "winter-is-coming");
      });

      // Change language
      cy.get("[data-testid=panel-header]").within(() => {
        cy.contains("en-GB").click();
        cy.contains("pt-PT").click();
      });

      cy.get("[data-testid=panel-metadata]").within(() => {
        cy.getByLabel("Title short").should(
          "have.value",
          "O Inverno Está Chegando",
        );
      });

      cy.percySnapshot("Homepage - object panel - fields - pt-PT");
    });

    it("edit metadata and cancel", () => {
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
      cy.contains("button", "Edit Metadata").should("not.be.disabled");

      cy.getByLabel("Slug").should("have.value", "winter-is-coming");
      cy.getByLabel("Slug").clear().type("gots01e01_winter-is-coming");
      cy.getByLabel("Slug").should("have.value", "gots01e01_winter-is-coming");
      cy.get("[data-testid=panel-header]").within(() => {
        cy.contains("button", "Save").should("not.be.disabled");
        cy.contains("button", "Cancel").should("not.be.disabled");
      });
      cy.contains("Editing");

      cy.percySnapshot("Homepage - object panel - fields (edit)");

      // Test cancel
      cy.contains("Cancel").click();
      cy.getByLabel("Slug").should("have.value", "winter-is-coming");
      cy.contains("Editing").should("not.exist");
      cy.contains("button", "Edit Metadata").should("not.be.disabled");
    });

    it("edit metadata and save", () => {
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
      cy.contains("button", "Edit Metadata").should("not.be.disabled");

      cy.getByLabel("Slug").should("have.value", "winter-is-coming");
      cy.getByLabel("Slug").clear().type("gots01e01_winter-is-coming");
      cy.getByLabel("Slug").should("have.value", "gots01e01_winter-is-coming");

      cy.contains("Save").click();

      cy.wait("@updateEpisodeMetadata");
      cy.contains("Editing").should("not.exist");
      cy.contains("button", "Edit Metadata").should("not.be.disabled");
    });
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

      cy.percySnapshot("Homepage - object panel - imagery");
    });

    it("navigates to the image object using the object button", () => {
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

      cy.get('[aria-label="Open Object"]').click();

      // Only check the panel object type and uid so we don't have to mock the response
      cy.get(`[data-cy=panel-for-SkylarkImage-01GX3951J632PXW580CXHCH9QZ]`);
    });

    it("navigates to the set content using the object button", () => {
      cy.fixture("./skylark/queries/getObject/gots01e01.json").then(
        (objectJson) => {
          const episodeUid = objectJson.data.getObject.uid;
          const episodeObjectType = objectJson.data.getObject.__typename;
          const firstImageUid = objectJson.data.getObject.images.objects[0].uid;

          cy.get('input[name="search-query-input"]').type(
            "got winter is coming",
          );
          cy.contains("tr", "GOT S01E1 - Winter")
            .should(($el) => {
              // eslint-disable-next-line jest/valid-expect
              expect(Cypress.dom.isDetached($el)).to.eq(false);
            })
            .within(() => {
              cy.get('[aria-label="object-info"]').click();
            });

          cy.contains("button", "Imagery").click();

          cy.get(`[data-cy=panel-for-${episodeObjectType}-${episodeUid}]`);

          cy.get('[aria-label="Open Object"]').first().click();

          // Only check the panel object type and uid so we don't have to mock the response
          cy.get(`[data-cy=panel-for-SkylarkImage-${firstImageUid}]`);

          // Check back button returns to the original object
          cy.get('[aria-label="Open Previous Object"]').click();
          cy.get(`[data-cy=panel-for-${episodeObjectType}-${episodeUid}]`);
        },
      );
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

      cy.percySnapshot("Homepage - object panel - content");
    });

    it("navigates to the set content using the object button", () => {
      cy.fixture("./skylark/queries/getObject/homepage.json").then(
        (homepageJson) => {
          const homepageUid = homepageJson.data.getObject.uid;
          const homepageObjectType = homepageJson.data.getObject.__typename;
          const firstSetContentItemUid =
            homepageJson.data.getObject.content.objects[0].object.uid;
          const firstSetContentItemObjectType =
            homepageJson.data.getObject.content.objects[0].object.__typename;

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
          cy.get(`[data-cy=panel-for-${homepageObjectType}-${homepageUid}]`);

          cy.get('[aria-label="Open Object"]').first().click();

          // Only check the panel object type and uid so we don't have to mock the response
          cy.get(
            `[data-cy=panel-for-${firstSetContentItemObjectType}-${firstSetContentItemUid}]`,
          );

          // Check back button returns to the original object
          cy.get('[aria-label="Open Previous Object"]').click();
          cy.get(`[data-cy=panel-for-${homepageObjectType}-${homepageUid}]`);
        },
      );
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

      cy.percySnapshot("Homepage - object panel - content (edit)");

      // Test deleting
      cy.contains("Discover Collection")
        .parent()
        .parent()
        .within(() => {
          cy.get("[data-testid=panel-object-content-item-remove]").click();
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

      cy.percySnapshot("Homepage - object panel - content (reorder)");

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
          cy.get("[data-testid=panel-object-content-item-remove]").click();
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

      cy.percySnapshot("Homepage - object panel - availability");
    });

    it("navigates to the availability using the object button", () => {
      cy.fixture("./skylark/queries/getObject/allAvailTestMovie.json").then(
        (objectJson) => {
          cy.fixture(
            "./skylark/queries/getObjectAvailability/allAvailTestMovieAvailability.json",
          ).then((availabilityJson) => {
            const objectUid = objectJson.data.getObject.uid;
            const objectType = objectJson.data.getObject.__typename;

            cy.get('input[name="search-query-input"]').type(
              "all avail test movie",
            );
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

            cy.get(`[data-cy=panel-for-${objectType}-${objectUid}]`);

            cy.get('[aria-label="Open Object"]').first().click();

            // Only check the panel object type and uid so we don't have to mock the response
            cy.get(
              `[data-cy=panel-for-Availability-${availabilityJson.data.getObjectAvailability.availability.objects[0].uid}]`,
            );

            // Check back button returns to the original object
            cy.get('[aria-label="Open Previous Object"]').click();
            cy.get(`[data-cy=panel-for-${objectType}-${objectUid}]`);
          });
        },
      );
    });
  });
});
