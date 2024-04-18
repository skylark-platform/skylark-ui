import { configureSkylarkIntercepts } from "../../../../support/utils/intercepts";

describe("Content Library - Object Panel - Video tab", () => {
  beforeEach(() => {
    cy.login();

    configureSkylarkIntercepts();

    cy.visit("/");
    cy.wait("@introspectionQuery");
  });

  it("open Video tab", () => {
    cy.get('input[name="search-query-input"]').type("all avail test movie");
    cy.openContentLibraryObjectPanelByText(
      "Fantastic Mr Fox (All Availabilities)",
    );

    cy.contains("button", "Video").click();

    cy.contains("Video");

    cy.contains("Fantastic Mr Fox Trailer");

    cy.get(
      "[data-testid='video-player-for-https://www.youtube.com/watch?v=n2igjYFojUo']",
    );
  });

  it("navigates to the asset object using the object button", () => {
    cy.fixture(
      "./skylark/queries/getObjectRelationships/fantasticMrFox_All_Availabilities.json",
    ).then((objectJson) => {
      const firstAssetUid =
        objectJson.data.getObjectRelationships.assets.objects[0].uid;

      cy.get('input[name="search-query-input"]').type("all avail test movie");
      cy.openContentLibraryObjectPanelByText(
        "Fantastic Mr Fox (All Availabilities)",
      );

      cy.contains("button", "Video").click();

      cy.contains("Fantastic Mr Fox Trailer");

      cy.get('[aria-label="Open Object"]').first().click();

      // Only check the panel object type and uid so we don't have to mock the response
      cy.get(`[data-cy=panel-for-SkylarkAsset-${firstAssetUid}]`);
    });
  });

  it("uses the video upload button to open the uploader modal", () => {
    cy.get('input[name="search-query-input"]').type("all avail test movie");
    cy.openContentLibraryObjectPanelByText(
      "Fantastic Mr Fox (All Availabilities)",
    );

    cy.contains("button", "Video").click();

    cy.contains("Fantastic Mr Fox Trailer");

    cy.get('[aria-label="Upload video to assets"]').click();

    cy.contains("Upload video to Mux");
  });
});
