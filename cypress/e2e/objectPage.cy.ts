// Most of the Object Page functionality should be tested by the contentLibrary/panel tests
// These tests should only check functionality that is different

describe("Object Page", () => {
  beforeEach(() => {
    cy.login();
  });

  describe("SkylarkSet", () => {
    beforeEach(() => {
      cy.fixture("./skylark/queries/getObject/homepage.json").then(
        (objectJson) => {
          cy.visit(
            `/object/${objectJson.data.getObject.__typename}/${objectJson.data.getObject.uid}`,
          );
        },
      );
    });

    it("loads page", () => {
      cy.contains("Homepage");
      cy.percySnapshot("Object page - metadata");
    });

    it("scrolls to Translatable Metadata using the side navigation", () => {
      cy.get("[data-testid=panel-metadata]").within(() => {
        cy.contains("Translatable Metadata").should("not.be.visible");
      });

      cy.contains("button", "Translatable Metadata").click();

      cy.get("[data-testid=panel-metadata]").within(() => {
        cy.contains("Translatable Metadata").should("be.visible");
      });
    });

    it("navigates to Content tab, opens an object and checks the URL has updated", () => {
      cy.fixture("./skylark/queries/getObject/homepage.json").then(
        (homepageJson) => {
          return (
            cy
              // TODO change getObject to getObjectContent in next PR
              .fixture("./skylark/queries/getObject/homepage.json")
              .then((homepageContentJson) => {
                console.log({ homepageContentJson });

                const homepageUid = homepageJson.data.getObject.uid;
                const homepageObjectType =
                  homepageJson.data.getObject.__typename;
                const firstSetContentItemUid =
                  homepageJson.data.getObject.content.objects[0].object.uid;
                const firstSetContentItemObjectType =
                  homepageJson.data.getObject.content.objects[0].object
                    .__typename;
                // const firstSetContentItemUid =
                //   homepageContentJson.data.getObjectContent.content.objects[0]
                //     .object.uid;
                // const firstSetContentItemObjectType =
                //   homepageContentJson.data.getObjectContent.content.objects[0]
                //     .object.__typename;

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
              })
          );
        },
      );
    });
  });
});
