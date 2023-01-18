import { Server, WebSocket } from "mock-socket";

import {
  getOperationName,
  hasOperationName,
} from "../../support/utils/graphqlTestUtils";

describe("Import/CSV", () => {
  beforeEach(() => {
    cy.login();
    cy.visit("/import/csv");

    cy.intercept("POST", Cypress.env("skylark_graphql_uri"), (req) => {
      if (hasOperationName(req, "GET_SKYLARK_OBJECT_TYPES")) {
        req.reply({
          fixture: "./skylark/queries/introspection/objectTypes.json",
        });
      }
      if (hasOperationName(req, "GET_SKYLARK_SCHEMA")) {
        req.reply({
          fixture: "./skylark/queries/introspection/schema.json",
        });
      }
    });

    cy.intercept("POST", "https://api.us.flatfile.io/graphql", (req) => {
      if (hasOperationName(req, "InitializeEmptyBatch")) {
        req.reply({
          fixture: "./flatfile/mutations/InitializeEmptyBatch.json",
        });
      }
    });

    cy.intercept("POST", "**/api/flatfile/template", {
      statusCode: 200,
      body: {
        embedId: "123",
        token: "oops",
      },
    }).as("createFlatfileTemplate");

    cy.intercept("POST", "**/api/flatfile/import", {
      statusCode: 200,
      body: [{ uid: "1" }, { uid: "2" }],
    }).as("createSkylarkObjects");
  });

  it("visit import/csv page", () => {
    cy.get("button").contains("Import").should("be.disabled");
    cy.get('[data-cy="status-card"]').should("have.length", "4");
    cy.get("a").contains("Start curating").should("have.class", "btn-disabled");
    cy.get(".btn-outline")
      .contains("New import")
      .should("have.class", "btn-disabled");
    cy.percySnapshot("import/csv");
  });

  it("select objectType", () => {
    cy.get('[data-cy="select"]').click();
    cy.get('[data-cy="select-options"]').should("be.visible");
    cy.percySnapshot("import/csv - objectType select open");

    cy.get('[data-cy="select-options"]')
      .get("li > span")
      .contains("Episode")
      .click();

    cy.get("button").contains("Import").should("not.disabled");
    cy.get('[data-cy="status-card"]')
      .first()
      .should("have.class", "border-t-success");
    cy.get(".border-t-manatee-500").should("have.length", "3");
    cy.percySnapshot("import/csv - objectType selected");
  });

  it("opens and closes Flatfile", () => {
    cy.get('[data-cy="select"]').click();
    cy.get('[data-cy="select-options"]').should("be.visible");
    cy.get('[data-cy="select-options"]')
      .get("li > span")
      .contains("Episode")
      .click();
    cy.get("button").contains("Import").click();

    cy.wait("@createFlatfileTemplate");

    cy.frameLoaded(".flatfile-sdk iframe");

    cy.get(".flatfile-close").click();

    cy.get(".flatfile-sdk iframe").should("not.exist");
    cy.get('[data-cy="status-card"]')
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
          socket.on("message", (data: string) => {
            const { id } = JSON.parse(data);
            if (id === "1") {
              socket.send(
                JSON.stringify({
                  type: "data",
                  id: "1",
                  payload,
                }),
              );
            }
          });
        });
      });

      cy.visit("/import/csv");
    });

    it("import a csv through Flatfile", { retries: 0 }, () => {
      cy.get('[data-cy="select"]').click();
      cy.get('[data-cy="select-options"]').should("be.visible");
      cy.get('[data-cy="select-options"]')
        .get("li > span")
        .contains("Episode")
        .click();
      cy.get("button").contains("Import").click();

      cy.get(".flatfile-sdk iframe").should("not.exist");

      cy.wait("@createSkylarkObjects");

      cy.get('[data-cy="status-card"].border-t-success', {
        timeout: 10000,
      }).should("have.length", 4);

      cy.get("a")
        .contains("Start curating")
        .should("not.have.class", "btn-disabled");
      cy.get(".btn-outline")
        .contains("New import")
        .should("not.have.class", "btn-disabled");

      cy.get("button").contains("Import").should("be.disabled");
      cy.get('[data-cy="select"]').should("be.disabled");

      cy.get("a")
        .contains("Start curating")
        .should("not.have.class", "btn-disabled")
        .should("have.attr", "href")
        .should("not.be.empty");

      cy.percySnapshot("import/csv - import complete");
    });

    it("can click new import to reset the state", () => {
      cy.get('[data-cy="select"]').click();
      cy.get('[data-cy="select-options"]').should("be.visible");
      cy.get('[data-cy="select-options"]')
        .get("li > span")
        .contains("Episode")
        .click();
      cy.get("button").contains("Import").click();

      cy.get("button").contains("Import").should("be.disabled");

      cy.get(".btn-outline").contains("New import").click();
      cy.get("button").contains("Import").should("not.disabled");
      cy.get('[data-cy="status-card"]')
        .first()
        .should("have.class", "border-t-success");
      cy.get(".border-t-manatee-500").should("have.length", "3");
    });
  });
});
