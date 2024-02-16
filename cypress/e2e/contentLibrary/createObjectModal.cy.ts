import { hasOperationName } from "../../support/utils/graphqlTestUtils";

describe("Create Object Modal", () => {
  beforeEach(() => {
    cy.login();

    cy.intercept("POST", Cypress.env("skylark_graphql_uri"), (req) => {
      if (hasOperationName(req, "IntrospectionQuery")) {
        req.alias = "introspectionQuery";
        req.reply({
          fixture: "./skylark/queries/introspection/introspectionQuery.json",
        });
      }
      if (hasOperationName(req, "SL_UI_GET_USER_AND_ACCOUNT")) {
        req.reply({
          fixture: "./skylark/queries/getUserAndAccount.json",
        });
      }
      if (hasOperationName(req, "SL_UI_GET_ACCOUNT_STATUS")) {
        req.reply({
          fixture: "./skylark/queries/getAccountStatus/default.json",
        });
      }
      if (hasOperationName(req, "SL_UI_GET_OBJECTS_CONFIG")) {
        req.reply({
          fixture: "./skylark/queries/getObjectsConfig/allObjectsConfig.json",
        });
      }
      if (hasOperationName(req, "SL_UI_GET_EPISODE")) {
        req.reply({
          fixture: "./skylark/queries/getObject/gots01e01.json",
        });
      }
      if (hasOperationName(req, "SL_UI_SEARCH")) {
        req.reply({
          fixture: "./skylark/queries/search/gotPage1.json",
        });
      }
      if (hasOperationName(req, "SL_UI_CREATE_OBJECT_EPISODE")) {
        req.alias = "createObject";
        req.reply({
          data: {
            createObject: {
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

  const openModal = () => {
    cy.contains("button", "Create").click();
    cy.contains("button", "Create Object").click();
    cy.contains("Select Object Type to get started.");
  };

  it("opens the create object modal", () => {
    openModal();
  });

  it("displays an objects display_name in a select", () => {
    openModal();

    cy.get("[data-testid=create-object-modal]").within(() => {
      cy.get("[data-testid=select]").click();
      cy.get("[data-testid=select-options]").scrollTo("bottom");
      cy.get("[data-testid=select-options]").within(() => {
        cy.contains("Set");
      });
    });
  });

  it("selects an object type", () => {
    openModal();

    cy.get("[data-testid=create-object-modal]").within(() => {
      cy.get("[data-testid=select]").click();
      cy.get("[data-testid=select-options]").within(() => {
        cy.contains("Episode").click();
      });

      cy.contains("button", "Create Episode").should("be.disabled");

      cy.takeSnapshot("Create Object Modal");
    });
  });

  it("creates an object which opens the Panel", () => {
    openModal();

    cy.get("[data-testid=create-object-modal]").within(() => {
      cy.get("[data-testid=select]").click();
      cy.get("[data-testid=select-options]").within(() => {
        cy.contains("Episode").click();
      });

      cy.contains("button", "Create Episode").should("be.disabled");

      cy.getByLabel("Slug").type("got-s01e01");
      cy.contains("button", "Create Episode").should("be.enabled").click();
    });

    cy.wait("@createObject");

    // Check Create Modal closes
    cy.get("[data-testid=create-object-modal]").should("not.exist");

    // Check Panel opens
    cy.contains("Metadata");
    cy.getByLabel("Slug").should("have.value", "winter-is-coming");
  });

  it("selects a Person Object Type and checks the WYSIWYG Editor loads", () => {
    openModal();

    cy.get("[data-testid=create-object-modal]").within(() => {
      cy.get("[data-testid=select]").click();
      cy.get("[data-testid=select-options]").within(() => {
        cy.contains("Person").click();
      });

      cy.contains("Bio long").scrollIntoView();

      cy.get(".tox-tinymce").should("exist");

      cy.contains("File");
      cy.contains("Format");
    });
  });
});
