import { configureSkylarkIntercepts } from "../../../../support/utils/intercepts";

describe("Content Library - Object Panel - Imagery tab", () => {
  beforeEach(() => {
    cy.login();

    configureSkylarkIntercepts();

    cy.visit("/");
    cy.wait("@introspectionQuery");
  });

  it("open Imagery tab", () => {
    cy.get('input[name="search-query-input"]').type("all avail test movie");
    cy.openContentLibraryObjectPanelByText(
      "Fantastic Mr Fox (All Availabilities)",
    );

    cy.contains("button", "Imagery").click();

    cy.contains("Imagery");
    cy.contains("wes_mrfox.jpeg");
    cy.contains("section", "Thumbnail")
      .find("img")
      .should("have.attr", "src")
      .and(
        "match",
        /https:\/\/res.cloudinary.com\/dmiq9sasn\/image\/fetch\/https:\/\/media.sl-develop.development.skylarkplatform.com\/skylarkimages\/pscimysu7bhxji72g45z4u6gvy\/01HF6MNY67QHBFZAJ7XTSVGBGZ\/01HF71HQQR6TVGTJ2ZMT2QTP1Y/,
      );
  });

  it("uses the video upload button to open the uploader modal", () => {
    cy.get('input[name="search-query-input"]').type("all avail test movie");
    cy.openContentLibraryObjectPanelByText(
      "Fantastic Mr Fox (All Availabilities)",
    );

    cy.contains("button", "Imagery").click();

    cy.contains("Imagery");
    cy.contains("wes_mrfox.jpeg");

    cy.wait(1000);
    cy.get('[aria-label="Upload to images"]').click();

    cy.frameLoaded("[data-test=uw-iframe]");
  });

  it("navigates to the image object using the object button", () => {
    cy.fixture(
      "./skylark/queries/getObjectRelationships/fantasticMrFox_All_Availabilities.json",
    ).then((objectJson) => {
      const firstImageUid =
        objectJson.data.getObjectRelationships.images.objects[0].uid;

      cy.get('input[name="search-query-input"]').type("all avail test movie");
      cy.openContentLibraryObjectPanelByText(
        "Fantastic Mr Fox (All Availabilities)",
      );

      cy.contains("button", "Imagery").click();

      cy.get('[aria-label="Open Object"]').first().click();

      // Only check the panel object type and uid so we don't have to mock the response
      cy.get(`[data-cy=panel-for-SkylarkImage-${firstImageUid}]`);
    });
  });

  it("navigates to the image using the object button", () => {
    cy.fixture(
      "./skylark/queries/getObject/fantasticMrFox_All_Availabilities.json",
    ).then((objectJson) => {
      cy.fixture(
        "./skylark/queries/getObjectRelationships/fantasticMrFox_All_Availabilities.json",
      ).then((relationshipJson) => {
        const episodeUid = objectJson.data.getObject.uid;
        const episodeObjectType = objectJson.data.getObject.__typename;
        const firstImageUid =
          relationshipJson.data.getObjectRelationships.images.objects[0].uid;

        cy.get('input[name="search-query-input"]').type("all avail test movie");
        cy.openContentLibraryObjectPanelByText(
          "Fantastic Mr Fox (All Availabilities)",
        );

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
      });
    });
  });
});
