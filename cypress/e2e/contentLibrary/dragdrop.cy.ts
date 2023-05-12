import {
  hasMatchingVariable,
  hasOperationName,
} from "../../support/utils/graphqlTestUtils";

describe("Drag and Drop - Content and Relationship tab", () => {
  beforeEach(() => {
    cy.login();

    cy.intercept("POST", Cypress.env("skylark_graphql_uri"), (req) => {
      if (hasOperationName(req, "IntrospectionQuery")) {
        req.alias = "introspectionQuery";
        req.reply({
          fixture: "./skylark/queries/introspection/introspectionQuery.json",
        });
      }
      if (hasOperationName(req, "GET_SkylarkSet_RELATIONSHIPS")) {
        req.reply({
          fixture: "./skylark/queries/getObjectRelationships/homepage.json",
        });
      }

      if (hasOperationName(req, "GET_SkylarkSet")) {
        req.reply({
          fixture: "./skylark/queries/getObject/homepage.json",
        });
      }

      if (hasOperationName(req, "SEARCH")) {
        if (hasMatchingVariable(req, "queryString", "Homepage")) {
          req.reply({
            fixture: "./skylark/queries/search/homepage.json",
          });
        } else {
          req.reply({
            fixture: "./skylark/queries/search/gotPage1.json",
          });
        }
      }
    });

    cy.visit("/");
    cy.wait("@introspectionQuery");
  });

  describe("Drag & Drop", () => {
    it("navigates to the set content and drag an object", () => {
      cy.fixture("./skylark/queries/getObject/homepage.json").then(
        (homepageJson) => {
          const homepageUid = homepageJson.data.getObject.uid;
          const homepageObjectType = homepageJson.data.getObject.__typename;

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

          const deltaX = 500;
          const deltaY = 500;
          const delay = 500;

          cy.get("[data-cy=drop-area]").should("not.exist");

          cy.get(`[data-cy="draggable-item"`)
            .last()
            .trigger("mousedown", {
              button: 0,
              release: false,
              force: true,
            })
            .wait(delay, { log: Boolean(delay) })
            .then(() => {
              cy.get("[data-cy=drop-area]").should("exist");
            })
            .trigger("mousemove", {
              force: true,
              clientX: deltaX,
              clientY: deltaY,
            })
            .wait(100)
            .trigger("mouseup", { force: true })
            .wait(250)
            .then(() => {
              cy.contains("button", "Content").should("exist");
              cy.get("input.bg-success")
                .should("exist")
                .should("have.length", 1);
            });
        },
      );
    });

    it("Navigates to relationship tab and drag an object", () => {
      cy.fixture("./skylark/queries/getObject/homepage.json").then(
        (homepageJson) => {
          const homepageUid = homepageJson.data.getObject.uid;
          const homepageObjectType = homepageJson.data.getObject.__typename;

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
          cy.contains("button", "Relationships").click();
          cy.get(`[data-cy=panel-for-${homepageObjectType}-${homepageUid}]`);

          const deltaX = 500;
          const deltaY = 500;
          const delay = 500;

          cy.get("[data-cy=drop-area]").should("not.exist");

          cy.get(`[data-cy="draggable-item"`)
            .last()
            .trigger("mousedown", {
              button: 0,
              release: false,
              force: true,
            })
            .wait(delay, { log: Boolean(delay) })
            .then(() => {
              cy.get("[data-cy=drop-area]").should("exist");
            })
            .trigger("mousemove", {
              force: true,
              clientX: deltaX,
              clientY: deltaY,
            })
            .wait(100)
            .trigger("mouseup", { force: true })
            .wait(250)
            .then(() => {
              cy.get("span.bg-success")
                .should("exist")
                .should("have.length", 1);
            });

          cy.get(`[data-cy="draggable-item"`)
            .first()
            .trigger("mousedown", {
              button: 0,
              release: false,
              force: true,
            })
            .wait(delay, { log: Boolean(delay) })
            .then(() => {
              cy.get("[data-cy=drop-area]").should("exist");
            })
            .trigger("mousemove", {
              force: true,
              clientX: deltaX,
              clientY: deltaY,
            })
            .wait(100)
            .trigger("mouseup", { force: true })
            .wait(250)
            .then(() => {
              cy.get("h4").contains("Invalid relationship").should("exist");
            });
        },
      );
    });
  });
});