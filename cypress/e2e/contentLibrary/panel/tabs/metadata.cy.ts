import { hasOperationName } from "../../../../support/utils/graphqlTestUtils";
import { configurePanelSkylarkIntercepts } from "../__utils__/test-utils";

describe("Content Library - Object Panel - Metadata tab", () => {
  beforeEach(() => {
    cy.login();

    configurePanelSkylarkIntercepts();

    cy.visit("/");
    cy.wait("@introspectionQuery");
  });

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

  it("edit metadata and save as draft", () => {
    cy.get('input[name="search-query-input"]').type("got winter is coming");
    cy.contains("div", "GOT S01E1 - Winter");
    cy.openContentLibraryObjectPanelByText("en-GB");

    cy.contains("Metadata");
    cy.contains("button", "Edit Metadata").should("not.be.disabled");
    cy.contains("Draft").should("not.exist");

    cy.getByLabel("Slug").should("have.value", "winter-is-coming");
    cy.getByLabel("Slug").clear().type("gots01e01_winter-is-coming");
    cy.getByLabel("Slug").should("have.value", "gots01e01_winter-is-coming");

    cy.get('[aria-label="save changes - see alternate options"]').click();
    cy.contains("Save as Draft").click();

    cy.wait("@updateEpisodeMetadataDraft");
    cy.contains("Editing").should("not.exist");
    cy.contains("Draft").should("exist");
    cy.contains("button", "Edit Metadata").should("not.be.disabled");
  });

  it("opens draft and Publishes", () => {
    cy.intercept("POST", Cypress.env("skylark_graphql_uri"), (req) => {
      if (hasOperationName(req, "SL_UI_GET_EPISODE")) {
        req.alias = "getEpisodeDraft";
        req.reply({
          data: {
            getObject: {
              __typename: "Episode",
              _config: { primary_field: "title", colour: "#ff7ba8" },
              _meta: {
                available_languages: ["en-GB", "pt-PT"],
                language_data: { language: "en-GB", version: 1 },
                global_data: { version: 2 },
                published: false,
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

    cy.get('input[name="search-query-input"]').type("got winter is coming");
    cy.contains("div", "GOT S01E1 - Winter");
    cy.openContentLibraryObjectPanelByText("en-GB");

    cy.contains("Metadata");
    cy.contains("Draft").should("exist");
    cy.contains("button", "Edit Metadata").should("not.be.disabled").click();

    cy.get('[aria-label="save changes - see alternate options"]').click();
    cy.contains("Publish").click();

    cy.wait("@publishEpisode");
    cy.contains("Editing").should("not.exist");
    cy.contains("Draft").should("not.exist");
    cy.contains("button", "Edit Metadata").should("not.be.disabled");
  });

  it("opens draft, makes a change and Save & Publishes", () => {
    cy.intercept("POST", Cypress.env("skylark_graphql_uri"), (req) => {
      if (hasOperationName(req, "SL_UI_GET_EPISODE")) {
        req.alias = "getEpisodeDraft";
        req.reply({
          data: {
            getObject: {
              __typename: "Episode",
              _config: { primary_field: "title", colour: "#ff7ba8" },
              _meta: {
                available_languages: ["en-GB", "pt-PT"],
                language_data: { language: "en-GB", version: 1 },
                global_data: { version: 2 },
                published: false,
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

    cy.get('input[name="search-query-input"]').type("got winter is coming");
    cy.contains("div", "GOT S01E1 - Winter");
    cy.openContentLibraryObjectPanelByText("en-GB");

    cy.contains("Metadata");
    cy.contains("Draft").should("exist");

    cy.getByLabel("Slug").should("have.value", "winter-is-coming");
    cy.getByLabel("Slug")
      .clear({ force: true })
      .type("gots01e01_winter-is-coming");
    cy.getByLabel("Slug").should("have.value", "gots01e01_winter-is-coming");
    cy.get("[data-testid=panel-header]").within(() => {
      cy.contains("button", "Save").should("not.be.disabled");
      cy.contains("button", "Cancel").should("not.be.disabled");
    });
    cy.contains("Editing");

    cy.get('[aria-label="save changes - see alternate options"]').click();
    cy.contains("Publish").click();

    cy.wait("@updateEpisodeMetadata");
    cy.contains("Editing").should("not.exist");
    cy.contains("Draft").should("not.exist");
    cy.contains("button", "Edit Metadata").should("not.be.disabled");
  });
});
