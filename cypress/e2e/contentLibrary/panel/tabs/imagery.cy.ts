import { configurePanelSkylarkIntercepts } from "../__utils__/test-utils";

describe("Content Library - Object Panel - Imagery tab", () => {
  beforeEach(() => {
    cy.login();

    configurePanelSkylarkIntercepts();

    cy.visit("/");
    cy.wait("@introspectionQuery");
  });

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
  });

  it("navigates to the image object using the object button", () => {
    cy.fixture("./skylark/queries/getObject/gots01e01.json").then(
      (objectJson) => {
        const firstImageUid = objectJson.data.getObject.images.objects[0].uid;

        cy.get('input[name="search-query-input"]').type("got winter is coming");
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

        cy.get('input[name="search-query-input"]').type("got winter is coming");
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
