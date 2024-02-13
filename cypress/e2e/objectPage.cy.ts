// Most of the Object Page functionality should be tested by the contentLibrary/panel tests
// These tests should only check functionality that is different
import {
  hasMatchingVariable,
  hasOperationName,
} from "../support/utils/graphqlTestUtils";

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

describe("Object Page", () => {
  beforeEach(() => {
    cy.login();

    cy.intercept("POST", Cypress.env("skylark_graphql_uri"), (req) => {
      if (hasOperationName(req, "IntrospectionQuery")) {
        req.alias = "introspectionQuery";
        req.reply({
          fixture: "./skylark/queries/introspection/introspectionQuery.json",
        });
      }
      if (hasOperationName(req, "SL_UI_GET_OBJECTS_CONFIG")) {
        req.reply({
          fixture: "./skylark/queries/getObjectsConfig/allObjectsConfig.json",
        });
      }
      if (hasOperationName(req, "SL_UI_GET_ACCOUNT_STATUS")) {
        req.reply({
          fixture: "./skylark/queries/getAccountStatus/default.json",
        });
      }
      if (hasOperationName(req, "SL_UI_GET_EPISODE")) {
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
      if (hasOperationName(req, "SL_UI_GET_SKYLARKSET")) {
        req.reply({
          fixture: "./skylark/queries/getObject/homepage.json",
        });
      }
      if (hasOperationName(req, "SL_UI_GET_SKYLARKSET_CONTENT")) {
        req.reply({
          fixture: "./skylark/queries/getObjectContent/homepage.json",
        });
      }
    });
  });

  describe("SkylarkSet", () => {
    beforeEach(() => {
      cy.fixture("./skylark/queries/getObject/homepage.json").then(
        (objectJson) => {
          cy.visit(
            `/object/${objectJson.data.getObject.__typename}/${objectJson.data.getObject.uid}`,
          );
          cy.wait("@introspectionQuery");
        },
      );
    });

    it("loads page", () => {
      cy.contains("Homepage");
      cy.percySnapshot("Object page");
    });

    it("navigates to Content tab, opens an object and checks the URL has updated", () => {
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

              cy.contains("button", "Content").click();
              cy.get(
                `[data-cy=panel-for-${homepageObjectType}-${homepageUid}]`,
              );

              cy.get('[aria-label="Open Object"]').first().click();

              // Only check the panel object type and uid so we don't have to mock the response
              cy.get(
                `[data-cy=panel-for-${firstSetContentItemObjectType}-${firstSetContentItemUid}]`,
              );

              cy.url().should(
                "include",
                `/object/${firstSetContentItemObjectType}/${firstSetContentItemUid}`,
              );
            });
        },
      );
    });

    it("moves set content to reorder", () => {
      cy.fixture("./skylark/queries/getObject/homepage.json").then(
        (homepageJson) => {
          const homepageUid = homepageJson.data.getObject.uid;
          const homepageObjectType = homepageJson.data.getObject.__typename;

          cy.contains("button", "Content").click();
          cy.get(
            `[data-cy=panel-for-${homepageObjectType}-${homepageUid}]`,
          ).within(() => {
            cy.contains("Home page hero");

            cy.contains("Edit Content").click();
            cy.contains("Editing");

            cy.get("[data-testid=panel-content-items] > li p")
              .then(($els) => {
                const text = $els.toArray().map((el) => el.innerText.trim());
                return text;
              })
              .should("deep.eq", homepageContentOrdered);

            cy.contains("New TV Releases")
              .closest("[data-cy=panel-object-content-item]")
              .mouseMoveBy(0, 50);
          });

          // Test that the order has changed
          cy.get("[data-testid=panel-content-items] > li p")
            .then(($els) => {
              const text = $els.toArray().map((el) => el.innerText.trim());
              return text;
            })
            .should("not.deep.eq", homepageContentOrdered);
        },
      );
    });

    it("scrolls to Global Metadata using the side navigation", () => {
      cy.get("[data-testid=panel-metadata]").within(() => {
        cy.contains("Global Metadata").should("not.be.visible");
      });

      cy.contains("button", "Global Metadata").click();

      cy.get("[data-testid=panel-metadata]").within(() => {
        cy.contains("Global Metadata").should("be.visible");
      });
    });
  });
});
