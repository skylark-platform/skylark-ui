import {
  hasMatchingQuery,
  hasMatchingVariable,
  hasOperationName,
} from "../../support/utils/graphqlTestUtils";

const allDevicesAllCustomersAvailability =
  "Always - All devices, all non-kids customer types";

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
      if (hasOperationName(req, "GET_USER_AND_ACCOUNT")) {
        req.reply({
          fixture: "./skylark/queries/getUserAndAccount.json",
        });
      }
      if (hasOperationName(req, "GET_OBJECTS_CONFIG")) {
        req.reply({
          fixture: "./skylark/queries/getObjectsConfig/allObjectsConfig.json",
        });
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
      if (hasOperationName(req, "GET_SkylarkSet_CONTENT")) {
        req.reply({
          fixture: "./skylark/queries/getObjectContent/homepage.json",
        });
      }
      if (hasOperationName(req, "GET_SkylarkSet_RELATIONSHIPS")) {
        req.reply({
          fixture: "./skylark/queries/getObjectRelationships/homepage.json",
        });
      }
      if (hasOperationName(req, "GET_Movie")) {
        req.reply({
          fixture:
            "./skylark/queries/getObject/fantasticMrFox_All_Availabilities.json",
        });
      }
      if (hasOperationName(req, "GET_Movie_AVAILABILITY")) {
        req.reply({
          fixture:
            "./skylark/queries/getObjectAvailability/fantasticMrFox_All_Availabilities.json",
        });
      }
      if (hasOperationName(req, "GET_Movie_CONTENT_OF")) {
        req.reply({
          fixture:
            "./skylark/queries/getObjectContentOf/fantasticMrFox_All_Availabilities.json",
        });
      }
      if (hasOperationName(req, "GET_Availability")) {
        req.reply({
          fixture:
            "./skylark/queries/getObject/allDevicesAllCustomersAvailability.json",
        });
      }
      if (hasOperationName(req, "GET_AVAILABILITY_DIMENSIONS")) {
        req.reply({
          fixture:
            "./skylark/queries/getObjectDimensions/allDevicesAllCustomersAvailability.json",
        });
      }
      if (hasOperationName(req, "DELETE_Episode")) {
        req.reply({
          data: {
            deleteObject: {
              uid: "01GX396FF5MFFZ5N8YYPAM4W03",
            },
          },
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
            fixture:
              "./skylark/queries/search/fantasticMrFox_All_Availabilities.json",
          });
        } else if (
          hasMatchingVariable(
            req,
            "queryString",
            allDevicesAllCustomersAvailability,
          )
        ) {
          req.reply({
            fixture:
              "./skylark/queries/search/allDevicesAllCustomersAvailability.json",
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
      if (hasOperationName(req, "UPDATE_AVAILABILITY_DIMENSIONS")) {
        req.alias = "updateAvailabilityDimensions";
        req.reply({
          data: {
            updateAvailabilityDimensions: {
              uid: "123",
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
    cy.contains("GOT S01E1 - Winter");
    cy.openContentLibraryObjectPanelByText("en-GB"); // Open the English version

    cy.contains("Metadata");
    cy.contains("Synopsis short").scrollIntoView();

    cy.get('textarea[name="synopsis_short"]')
      .invoke("val")
      .should(
        "equal",
        "Series Premiere. Eddard Stark is torn between his family and an old friend when asked to serve at the side of King Robert Baratheon; Viserys plans to wed his sister to a nomadic warlord in exchange for an army.",
      );
    cy.percySnapshot("Homepage - metadata panel - fields");
  });

  it("close Panel", () => {
    cy.get('input[name="search-query-input"]').type("got winter is coming");
    cy.openContentLibraryObjectPanelByText("GOT S01E1 - Winter");

    cy.contains("Edit Metadata").should("exist");
    cy.get("button").contains("Close").click();
    cy.contains("Edit Metadata").should("not.exist");
  });

  it("view GraphQL query", () => {
    cy.get('input[name="search-query-input"]').type("got winter is coming");
    cy.openContentLibraryObjectPanelByText("GOT S01E1 - Winter");

    cy.contains("Metadata");
    cy.get("[data-testid=panel-header]").within(() => {
      cy.get('[aria-label="Open Panel Menu"]').click();
      cy.get("[data-testid=graphql-query-modal-button]").parent().click();
    });
    cy.contains("Query for");
    cy.percySnapshot("Homepage - object panel - graphql query");
  });

  it("create translation", () => {
    cy.get('input[name="search-query-input"]').type("got winter is coming");
    cy.openContentLibraryObjectPanelByText("GOT S01E1 - Winter");

    // Trigger create translation modal
    cy.get("[data-testid=panel-header]").within(() => {
      cy.get("[data-testid=select]").click();
    });
    cy.contains("Create Translation").click();

    // Select language and enter data
    cy.get("[data-testid=create-object-modal]").within(() => {
      cy.contains("Object language")
        .parent()
        .within(() => {
          cy.get("[data-testid=select]").type("en-U");
        });
      cy.contains("en-US").click();
      cy.getByLabel("Title").type("GOT S01E01");
      cy.contains("Create Translation").click();
    });

    cy.contains('Translation "en-US" created');
  });

  it("delete translation", () => {
    cy.get('input[name="search-query-input"]').type("got winter is coming");
    cy.openContentLibraryObjectPanelByText("GOT S01E1 - Winter");

    // Trigger delete modal
    cy.get("[data-testid=panel-header]").within(() => {
      cy.get('[aria-label="Open Panel Menu"]').click();
      cy.contains("Delete").click();
    });

    cy.contains('Delete "pt-PT" translation');

    cy.get("[data-testid=delete-object-modal]").within(() => {
      cy.contains("Delete translation").click();
    });

    cy.contains('Translation "pt-PT" deleted');
  });

  describe("Metadata tab", () => {
    it("change language to pt-PT", () => {
      cy.get('input[name="search-query-input"]').type("got winter is coming");
      cy.contains("div", "GOT S01E1 - Winter");
      cy.openContentLibraryObjectPanelByText("en-GB");

      cy.contains("Metadata");

      cy.get("[data-testid=panel-metadata]").within(() => {
        cy.getByLabel("Slug").should("have.value", "winter-is-coming");
      });

      // Change language
      cy.get("[data-testid=panel-header]").within(() => {
        cy.contains("en-GB").click();
      });
      cy.get("[data-testid=select-options]").within(() => {
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
      cy.contains("div", "GOT S01E1 - Winter");
      cy.openContentLibraryObjectPanelByText("en-GB");

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
      cy.contains("div", "GOT S01E1 - Winter");
      cy.openContentLibraryObjectPanelByText("en-GB");

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
      cy.openContentLibraryObjectPanelByText("GOT S01E1 - Winter");

      cy.contains("button", "Imagery").click();

      cy.contains("Imagery");
      cy.contains("Title: GOT - S1 - 1.jpg");
      cy.contains("section", "Thumbnail")
        .find("img")
        .should("have.attr", "src")
        .and(
          "match",
          /https:\/\/media.showcase.skylarkplatform.com\/skylarkimages\/4h6gok37lvcmln3jz7pjsmzrte\/01H4MMBWH8J6E85G7PEZQ96RK4\/01H4MMC39TYKJ0T2A4M0Y8XH1E/,
        );

      cy.percySnapshot("Homepage - object panel - imagery");
    });

    it("navigates to the image object using the object button", () => {
      cy.fixture("./skylark/queries/getObject/gots01e01.json").then(
        (objectJson) => {
          const firstImageUid = objectJson.data.getObject.images.objects[0].uid;

          cy.get('input[name="search-query-input"]').type(
            "got winter is coming",
          );
          cy.openContentLibraryObjectPanelByText("GOT S01E1 - Winter");

          cy.contains("button", "Imagery").click();

          cy.get('[aria-label="Open Object"]').first().click();

          // Only check the panel object type and uid so we don't have to mock the response
          cy.get(`[data-cy=panel-for-SkylarkImage-${firstImageUid}]`);
        },
      );
    });

    it("navigates to the image using the object button", () => {
      cy.fixture("./skylark/queries/getObject/gots01e01.json").then(
        (objectJson) => {
          const episodeUid = objectJson.data.getObject.uid;
          const episodeObjectType = objectJson.data.getObject.__typename;
          const firstImageUid = objectJson.data.getObject.images.objects[0].uid;

          cy.get('input[name="search-query-input"]').type(
            "got winter is coming",
          );
          cy.openContentLibraryObjectPanelByText("GOT S01E1 - Winter");

          cy.contains("button", "Imagery").click();

          cy.get(`[data-cy=panel-for-${episodeObjectType}-${episodeUid}]`);

          cy.get('[aria-label="Open Object"]').first().click();

          // Only check the panel object type and uid so we don't have to mock the response
          cy.get(`[data-cy=panel-for-SkylarkImage-${firstImageUid}]`);

          // Check back button returns to the original object
          cy.get('[aria-label="Click to go back"]').click();
          cy.get(`[data-cy=panel-for-${episodeObjectType}-${episodeUid}]`);

          // Check forward button returns to the image object
          cy.get('[aria-label="Click to go forward"]').click();
          cy.get(`[data-cy=panel-for-SkylarkImage-${firstImageUid}]`);
        },
      );
    });
  });

  describe("Content tab", () => {
    const homepageContentOrdered = [
      "Home page hero",
      "Kids Home page hero",
      "Spotlight movies",
      "New TV Releases",
      "Classic kids shows",
      "Best Picture Nominees 2021",
      "GOT Season 1",
      "Miraculous Season 5",
      "Discover",
    ];

    it("Open", () => {
      cy.get('input[name="search-query-input"]').type("Homepage");
      cy.contains("Homepage").should("exist");
      cy.openContentLibraryObjectPanelByText("Homepage");
      cy.contains("button", "Content").click();

      cy.percySnapshot("Homepage - object panel - content");
    });

    it("navigates to the set content using the object button", () => {
      cy.fixture("./skylark/queries/getObject/homepage.json").then(
        (homepageJson) => {
          return cy
            .fixture("./skylark/queries/getObjectContent/homepage.json")
            .then((homepageContentJson) => {
              const homepageUid = homepageJson.data.getObject.uid;
              const homepageObjectType = homepageJson.data.getObject.__typename;
              const firstSetContentItemUid =
                homepageContentJson.data.getObjectContent.content.objects[0]
                  .object.uid;
              const firstSetContentItemObjectType =
                homepageContentJson.data.getObjectContent.content.objects[0]
                  .object.__typename;

              cy.get('input[name="search-query-input"]').type("Homepage");
              cy.contains("Homepage").should("exist");
              cy.openContentLibraryObjectPanelByText("Homepage");

              cy.contains("button", "Content").click();
              cy.get(
                `[data-cy=panel-for-${homepageObjectType}-${homepageUid}]`,
              );

              cy.get('[aria-label="Open Object"]').first().click();

              // Only check the panel object type and uid so we don't have to mock the response
              cy.get(
                `[data-cy=panel-for-${firstSetContentItemObjectType}-${firstSetContentItemUid}]`,
              );

              // Check back button returns to the original object
              cy.get('[aria-label="Click to go back"]').click();
              cy.get(
                `[data-cy=panel-for-${homepageObjectType}-${homepageUid}]`,
              );

              // Check forward button returns to the content object
              cy.get('[aria-label="Click to go forward"]').click();
              cy.get(
                `[data-cy=panel-for-${firstSetContentItemObjectType}-${firstSetContentItemUid}]`,
              );
            });
        },
      );
    });

    it("Reorder, remove and cancel", () => {
      cy.get('input[name="search-query-input"]').type("Homepage");
      cy.contains("Homepage").should("exist");
      cy.openContentLibraryObjectPanelByText("Homepage");

      cy.contains("button", "Content").click();

      cy.get("[data-testid=panel-content-items]").within(() => {
        cy.contains("Home page hero");
      });

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
        .should("deep.eq", homepageContentOrdered);

      cy.percySnapshot("Homepage - object panel - content (edit)");

      // Test deleting
      cy.contains("Discover")
        .parent()
        .parent()
        .within(() => {
          cy.get("[data-testid=object-identifier-delete]").click();
        });
      cy.contains("Discover").should("not.exist");

      // Test reorder
      cy.get("[data-testid=panel-content-items] > li")
        .first()
        .within(() => {
          cy.get("input").clear().type("30");
        });

      cy.get("[data-testid=panel-content-items]").click();

      // Test updated order
      cy.get("[data-testid=panel-content-items] > li p")
        .then(($els) => {
          const text = $els.toArray().map((el) => el.innerText.trim());
          return text;
        })
        .should("deep.eq", [
          "Kids Home page hero",
          "Spotlight movies",
          "New TV Releases",
          "Classic kids shows",
          "Best Picture Nominees 2021",
          "GOT Season 1",
          "Miraculous Season 5",
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
        .should("deep.eq", homepageContentOrdered);
    });

    it("Reorder, remove and save", () => {
      cy.get('input[name="search-query-input"]').type("Homepage");
      cy.contains("Homepage").should("exist");
      cy.openContentLibraryObjectPanelByText("Homepage");

      cy.contains("button", "Content").click();

      cy.get("[data-testid=panel-content-items]").within(() => {
        cy.contains("Home page hero");
      });

      // Test switching to edit mode
      cy.contains("button", "Edit Content").should("not.be.disabled").click();

      // Delete
      cy.contains("Discover")
        .parent()
        .parent()
        .within(() => {
          cy.get("[data-testid=object-identifier-delete]").click();
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
          "Kids Home page hero",
          "Spotlight movies",
          "New TV Releases",
          "Classic kids shows",
          "Best Picture Nominees 2021",
          "GOT Season 1",
          "Miraculous Season 5",
          "Home page hero",
        ]);

      // Test save
      cy.contains("Save").click();

      cy.wait("@updateHomepageSetContent");

      cy.contains("button", "Edit Content").should("not.be.disabled");
    });
  });

  describe("Relationships Tab", () => {
    it("open Relationships tab", () => {
      cy.get('input[name="search-query-input"]').type("Homepage");
      cy.contains("Homepage").should("exist");
      cy.openContentLibraryObjectPanelByText("Homepage");

      cy.contains("button", "Relationships").click();

      cy.contains("StreamTVLoadingScreen.png");

      cy.percySnapshot("Homepage - object panel - relationships");
    });

    it("adds Relationships using the Object Search modal", () => {
      cy.get('input[name="search-query-input"]').type("Homepage");
      cy.contains("Homepage").should("exist");
      cy.openContentLibraryObjectPanelByText("Homepage");

      cy.contains("button", "Relationships").click();

      cy.get("#relationship-panel-assets").scrollIntoView();

      cy.get("#relationship-panel-assets")
        .parent()
        .within(() => {
          cy.get("button").click();
        });

      cy.get("[data-testid=search-objects-modal-save]").should("exist");

      cy.contains("GOT S04 Trailer").click();

      cy.contains("Add 1").click();

      cy.get("[data-testid=search-objects-modal-save]").should("not.exist");

      cy.get("#relationship-panel-assets").scrollIntoView();

      cy.contains("GOT S04 Trailer");

      cy.contains("Editing");
    });
  });

  describe("Appears In (content_of) tab", () => {
    it("open Appears In tab", () => {
      cy.get('input[name="search-query-input"]').type("all avail test movie");
      cy.contains("Fantastic Mr Fox (All Availabilities)").should("exist");
      cy.openContentLibraryObjectPanelByText(
        "Fantastic Mr Fox (All Availabilities)",
      );

      cy.contains("button", "Appears In").click();

      cy.contains("Wes Anderson Movies Collection");

      cy.percySnapshot("Homepage - object panel - content of");
    });

    it("navigates to the Set using the object button", () => {
      cy.fixture(
        "./skylark/queries/getObject/fantasticMrFox_All_Availabilities.json",
      ).then((objectJson) => {
        cy.fixture(
          "./skylark/queries/getObjectContentOf/fantasticMrFox_All_Availabilities.json",
        ).then((contentOfJson) => {
          const objectUid = objectJson.data.getObject.uid;
          const objectType = objectJson.data.getObject.__typename;

          cy.get('input[name="search-query-input"]').type(
            "all avail test movie",
          );
          cy.contains("Fantastic Mr Fox (All Availabilities)").should("exist");
          cy.openContentLibraryObjectPanelByText(
            "Fantastic Mr Fox (All Availabilities)",
          );

          cy.contains("button", "Appears In").click();

          cy.get(`[data-cy=panel-for-${objectType}-${objectUid}]`);

          cy.get('[aria-label="Open Object"]').first().click();

          // Only check the panel object type and uid so we don't have to mock the response
          cy.get(
            `[data-cy=panel-for-SkylarkSet-${contentOfJson.data.getObjectContentOf.content_of.objects[0].uid}]`,
          );

          // Check back button returns to the original object
          cy.get('[aria-label="Click to go back"]').click();
          cy.get(`[data-cy=panel-for-${objectType}-${objectUid}]`);

          // Check forward button returns to the availability object
          cy.get('[aria-label="Click to go forward"]').click();
          cy.get(
            `[data-cy=panel-for-SkylarkSet-${contentOfJson.data.getObjectContentOf.content_of.objects[0].uid}]`,
          );
        });
      });
    });
  });

  describe("Availability tab", () => {
    it("open Availability tab", () => {
      cy.get('input[name="search-query-input"]').type("all avail test movie");
      cy.contains("Fantastic Mr Fox (All Availabilities)").should("exist");
      cy.openContentLibraryObjectPanelByText(
        "Fantastic Mr Fox (All Availabilities)",
      );

      cy.contains("button", "Availability").click();

      cy.contains("Active in the past");
      cy.contains("Time Window");
      cy.contains("Audience");

      cy.percySnapshot("Homepage - object panel - availability");
    });

    it("navigates to the availability using the object button", () => {
      cy.fixture(
        "./skylark/queries/getObject/fantasticMrFox_All_Availabilities.json",
      ).then((objectJson) => {
        cy.fixture(
          "./skylark/queries/getObjectAvailability/fantasticMrFox_All_Availabilities.json",
        ).then((availabilityJson) => {
          const objectUid = objectJson.data.getObject.uid;
          const objectType = objectJson.data.getObject.__typename;

          cy.get('input[name="search-query-input"]').type(
            "all avail test movie",
          );
          cy.contains("Fantastic Mr Fox (All Availabilities)").should("exist");
          cy.openContentLibraryObjectPanelByText(
            "Fantastic Mr Fox (All Availabilities)",
          );

          cy.contains("button", "Availability").click();

          cy.get(`[data-cy=panel-for-${objectType}-${objectUid}]`);

          cy.get('[aria-label="Open Object"]').first().click();

          // Only check the panel object type and uid so we don't have to mock the response
          cy.get(
            `[data-cy=panel-for-Availability-${availabilityJson.data.getObjectAvailability.availability.objects[0].uid}]`,
          );

          // Check back button returns to the original object
          cy.get('[aria-label="Click to go back"]').click();
          cy.get(`[data-cy=panel-for-${objectType}-${objectUid}]`);

          // Check forward button returns to the availability object
          cy.get('[aria-label="Click to go forward"]').click();
          cy.get(
            `[data-cy=panel-for-Availability-${availabilityJson.data.getObjectAvailability.availability.objects[0].uid}]`,
          );
        });
      });
    });

    it("adds Availability using the Object Search modal", () => {
      cy.fixture(
        "./skylark/queries/getObject/fantasticMrFox_All_Availabilities.json",
      ).then((objectJson) => {
        cy.get('input[name="search-query-input"]').type("all avail test movie");
        cy.contains("Fantastic Mr Fox (All Availabilities)").should("exist");
        cy.openContentLibraryObjectPanelByText(
          "Fantastic Mr Fox (All Availabilities)",
        );

        cy.contains("button", "Availability").click();

        // Check default Availability view shows
        cy.contains("Time Window");

        cy.get("#availability-panel-header")
          .parent()
          .within(() => {
            cy.get("button").click();
          });

        cy.get("[data-testid=search-objects-modal-save]").should("exist");

        cy.get("[data-testid=search-objects-modal]").within(() => {
          cy.get('input[name="search-query-input"]').type(
            allDevicesAllCustomersAvailability,
          );
        });

        cy.contains(allDevicesAllCustomersAvailability).click();

        cy.contains("Add 1").click();

        cy.get("[data-testid=search-objects-modal-save]").should("not.exist");

        // Check edit Availability view shows
        cy.contains("Time Window").should("not.exist");

        cy.contains(allDevicesAllCustomersAvailability);

        cy.contains("Editing");

        cy.contains(allDevicesAllCustomersAvailability)
          .closest("div")
          .within(() => {
            cy.get("[data-testid=object-identifier-delete]").click();
          });

        cy.contains(allDevicesAllCustomersAvailability).should("not.exist");
      });
    });
  });

  describe("Availability Dimensions tab", () => {
    it("open Availability Dimensions tab", () => {
      cy.get('input[name="search-query-input"]').type(
        allDevicesAllCustomersAvailability,
      );
      cy.openContentLibraryObjectPanelByText(
        allDevicesAllCustomersAvailability,
      );

      cy.contains("button", "Dimensions").click();

      cy.contains("Customer type");
      cy.contains("Device type");
      cy.contains("Premium");
      cy.contains("Standard");
      cy.contains("PC");
      cy.contains("SmartPhone");

      cy.percySnapshot("Homepage - object panel - availability dimensions");
    });

    it("removes a dimension", () => {
      cy.get('input[name="search-query-input"]').type(
        allDevicesAllCustomersAvailability,
      );
      cy.openContentLibraryObjectPanelByText(
        allDevicesAllCustomersAvailability,
      );

      cy.contains("button", "Dimensions").click();

      cy.contains("Premium")
        .parent()
        .within(() => {
          cy.get("button").click();
        });

      cy.contains("Premium").should("not.exist");

      cy.contains("Editing");

      cy.contains("Save").click();

      cy.contains("Editing").should("not.exist");
      cy.contains("Premium").should("not.exist");
    });

    it("adds a dimension", () => {
      cy.get('input[name="search-query-input"]').type(
        allDevicesAllCustomersAvailability,
      );
      cy.openContentLibraryObjectPanelByText(
        allDevicesAllCustomersAvailability,
      );

      cy.contains("button", "Dimensions").click();

      cy.contains("Customer type")
        .parent()
        .within(() => {
          cy.get("[data-testid=multiselect-input]").click();
        });

      cy.contains("Kids").click();

      cy.contains("Editing");
      cy.contains("Kids");

      cy.contains("Save").click();

      cy.contains("Editing").should("not.exist");
    });
  });
});
