import { configurePanelSkylarkIntercepts } from "../__utils__/test-utils";

describe("Content Library - Object Panel - Appears In (content_of) tab", () => {
  beforeEach(() => {
    cy.login();

    configurePanelSkylarkIntercepts();

    cy.visit("/");
    cy.wait("@introspectionQuery");
  });

  it("open Appears In tab", () => {
    cy.get('input[name="search-query-input"]').type("all avail test movie");
    cy.contains("Fantastic Mr Fox (All Availabilities)").should("exist");
    cy.openContentLibraryObjectPanelByText(
      "Fantastic Mr Fox (All Availabilities)",
    );

    cy.contains("button", "Appears In").click();

    cy.contains("Wes Anderson Movies Collection");
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

        cy.get('input[name="search-query-input"]').type("all avail test movie");
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
