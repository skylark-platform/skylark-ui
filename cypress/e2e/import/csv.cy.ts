import { Server, WebSocket } from "mock-socket";

import {
  hasOperationName,
  operationNameStartsWith,
} from "../../support/utils/graphqlTestUtils";
import { configureSkylarkIntercepts } from "../../support/utils/intercepts";

describe("Import/CSV", () => {
  beforeEach(() => {
    cy.login();

    configureSkylarkIntercepts();

    cy.intercept("POST", "https://api.us.flatfile.io/graphql", (req) => {
      if (hasOperationName(req, "InitializeEmptyBatch")) {
        req.reply({
          fixture: "./flatfile/mutations/InitializeEmptyBatch.json",
        });
      }
    });

    cy.intercept("POST", "**/api/flatfile/template").as(
      "createFlatfileTemplate",
    );

    cy.intercept("POST", "**/api/flatfile/import", (req) => {
      req.alias = "getImportedObjects";
      req.reply({
        fixture: "./skylark/apiRoutes/importEpisodes.json",
      });
    });

    cy.visit("/import/csv");
    cy.wait("@introspectionQuery");
    cy.wait("@getObjectsConfig");
  });

  it("visit import/csv page", () => {
    cy.get("button").contains("Import").should("be.disabled");
    cy.get('[data-testid="status-card"]').should("have.length", "4");
    cy.get("a").contains("Start curating").should("have.class", "btn-disabled");
    cy.get(".btn-outline")
      .contains("New import")
      .should("have.class", "btn-disabled");
  });

  it("displays an objects display_name in a select", () => {
    cy.get("[data-testid=select]").click();
    cy.get("[data-testid=select-options]").scrollTo("bottom");
    cy.get("[data-testid=select-options]").within(() => {
      cy.contains("Set");
    });
  });

  it("select objectType", () => {
    cy.contains("Download Example CSV").should("have.class", "btn-disabled");
    cy.get('[data-testid="select"]').click();
    cy.get('[data-testid="select-options"]').should("be.visible");

    cy.get('[data-testid="select-options"]')
      .get("li > span")
      .contains("Episode")
      .click();

    cy.get("button").contains("Import").should("not.disabled");
    cy.get('[data-testid="status-card"]')
      .first()
      .should("have.class", "border-t-success");
    cy.get(".border-t-manatee-500").should("have.length", "3");

    cy.contains("Download Example CSV")
      .should("not.have.class", "btn-disabled")
      .should("have.attr", "href")
      .and("include", "data:text/plain;charset=utf-8,external_id");
  });

  it("opens and closes Flatfile", () => {
    cy.get('[data-testid="select"]').click();
    cy.get('[data-testid="select-options"]').should("be.visible");
    cy.get('[data-testid="select-options"]')
      .get("li > span")
      .contains("Episode")
      .click();
    cy.get("button").contains("Import").click();

    cy.wait("@createFlatfileTemplate");

    cy.frameLoaded(".flatfile-sdk iframe");

    cy.get(".flatfile-close").click();

    cy.get(".flatfile-sdk iframe").should("not.exist");
    cy.get('[data-testid="status-card"]')
      .first()
      .should("have.class", "border-t-success");
    cy.get(".border-t-manatee-500").should("have.length", "3");
  });

  describe("with mocked Flatfile webhook to call onComplete and close", () => {
    const mockGraphQlSocket = new Server("wss://api.us.flatfile.io/graphql");

    beforeEach(() => {
      const payload = {
        data: {
          batchStatusUpdated: {
            id: "a73c1919-4812-4356-89eb-1b3a21e03d1a",
            status: "submitted",
          },
        },
      };

      // When Flatfile connects to WebSocket, return success message
      // https://github.com/cypress-io/cypress/issues/2492#issuecomment-593898708
      cy.on("window:before:load", (win) => {
        win.WebSocket = WebSocket;
        mockGraphQlSocket.on("connection", (socket) => {
          socket.on(
            "message",
            (message: string | ArrayBuffer | Blob | ArrayBufferView) => {
              const { id } = JSON.parse(message as string);
              if (id === "1") {
                socket.send(
                  JSON.stringify({
                    type: "data",
                    id: "1",
                    payload,
                  }),
                );
              }
            },
          );
        });
      });

      cy.visit("/import/csv");
    });

    it("import a csv through Flatfile", { retries: 0 }, () => {
      cy.contains("Import from CSV");
      cy.get('[data-testid="select"]').within(() =>
        cy.get("input").type("Episode"),
      );
      cy.get('[data-testid="select-options"]').should("be.visible");
      cy.get('[data-testid="select-options"]')
        .get("li > span")
        .contains("Episode")
        .click();
      cy.get("button").contains("Import").click();

      cy.get(".flatfile-sdk iframe").should("not.exist");

      cy.wait("@getImportedObjects");

      cy.get('[data-testid="status-card"].border-t-success', {
        timeout: 10000,
      }).should("have.length", 4);

      cy.get("a")
        .contains("Start curating")
        .should("not.have.class", "btn-disabled");
      cy.get(".btn-outline")
        .contains("New import")
        .should("not.have.class", "btn-disabled");

      cy.get("button").contains("Import").should("be.disabled");
      cy.get('[data-testid="select"]').within(() =>
        cy.get("input").should("be.disabled"),
      );

      cy.get("a")
        .contains("Start curating")
        .should("not.have.class", "btn-disabled")
        .should("have.attr", "href")
        .should("not.be.empty");

      cy.percySnapshot("import/csv - import complete");
    });

    it("fail to create objects in Skylark", { retries: 0 }, () => {
      cy.intercept("POST", Cypress.env("skylark_graphql_uri"), (req) => {
        if (operationNameStartsWith(req, "SL_UI_FLATFILE_IMPORT_")) {
          req.reply({
            fixture:
              "./skylark/mutations/import/csvImportEpisodeCreationErrored.json",
          });
        }
      });

      cy.contains("Import from CSV");
      cy.get('[data-testid="select"]').should("not.be.disabled");
      cy.get('[data-testid="select"]').within(() =>
        cy.get("input").type("Episode"),
      );

      cy.get('[data-testid="select-options"]').should("be.visible");
      cy.get('[data-testid="select-options"]')
        .get("li > span")
        .contains("Episode")
        .click();
      cy.get("button").contains("Import").click();

      cy.get(".flatfile-sdk iframe").should("not.exist");

      cy.wait("@getImportedObjects");

      cy.get('[data-testid="status-card"].border-t-success', {
        timeout: 10000,
      }).should("have.length", 3);
      cy.get('[data-testid="status-card"]')
        .last()
        .should("have.class", "border-t-error");

      // Should match the number of errors/data in the fixture
      cy.contains("Error creating 1 Episode objects (4/5 created)");

      cy.get("a")
        .contains("Start curating")
        .should("have.class", "btn-disabled");
      cy.get(".btn-outline")
        .contains("New import")
        .should("not.have.class", "btn-disabled");

      cy.get("button").contains("Import").should("be.disabled");
      cy.get('[data-testid="select"]').within(() =>
        cy.get("input").should("be.disabled"),
      );

      cy.percySnapshot(
        "import/csv - import failed (skylark object creation error)",
      );
    });

    it("can click new import to reset the state", () => {
      cy.contains("Import from CSV");
      cy.get('[data-testid="select"]').should("not.be.disabled");
      cy.get('[data-testid="select"]').within(() =>
        cy.get("input").type("Episode"),
      );

      cy.get('[data-testid="select-options"]').should("be.visible");
      cy.get('[data-testid="select-options"]')
        .get("li > span")
        .contains("Episode")
        .click();
      cy.get("button").contains("Import").click();

      cy.get("button").contains("Import").should("be.disabled");

      cy.get(".btn-outline").contains("New import").click();
      cy.get("button").contains("Import").should("not.disabled");
      cy.get('[data-testid="status-card"]')
        .first()
        .should("have.class", "border-t-success");
      cy.get(".border-t-manatee-500").should("have.length", "3");
    });
  });
});
