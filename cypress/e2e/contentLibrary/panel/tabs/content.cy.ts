import { configureSkylarkIntercepts } from "../../../../support/utils/intercepts";

describe("Content Library - Object Panel - Content tab", () => {
  beforeEach(() => {
    cy.login();

    configureSkylarkIntercepts();

    cy.visit("/");
    cy.wait("@introspectionQuery");
  });

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

  it("Open", () => {
    cy.get('input[name="search-query-input"]').type("Homepage");
    cy.contains("Homepage").should("exist");
    cy.openContentLibraryObjectPanelByText("Homepage");
    cy.contains("button", "Content").click();
  });

  it("navigates to the set content using the object button", () => {
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

            cy.get('input[name="search-query-input"]').type("Homepage");
            cy.contains("Homepage").should("exist");
            cy.openContentLibraryObjectPanelByText("Homepage");

            cy.contains("button", "Content").click();
            cy.get(`[data-cy=panel-for-${homepageObjectType}-${homepageUid}]`);

            cy.get('[aria-label="Open Object"]').first().click();

            // Only check the panel object type and uid so we don't have to mock the response
            cy.get(
              `[data-cy=panel-for-${firstSetContentItemObjectType}-${firstSetContentItemUid}]`,
            );

            // Check back button returns to the original object
            cy.get('[aria-label="Click to go back"]').click();
            cy.get(`[data-cy=panel-for-${homepageObjectType}-${homepageUid}]`);

            // Check forward button returns to the content object
            cy.get('[aria-label="Click to go forward"]').click();
            cy.get(
              `[data-cy=panel-for-${firstSetContentItemObjectType}-${firstSetContentItemUid}]`,
            );
          });
      },
    );
  });

  it("Reorder, remove and cancel", () => {
    cy.get('input[name="search-query-input"]').type("Homepage");
    cy.contains("Homepage").should("exist");
    cy.openContentLibraryObjectPanelByText("Homepage");

    cy.contains("button", "Content").click();

    cy.get("[data-testid=panel-content-items]").within(() => {
      cy.contains("Home page hero");
    });

    // Test switching to edit mode
    cy.contains("Editing").should("not.exist");
    cy.contains("button", "Edit Content").should("not.be.disabled").click();
    cy.get("[data-testid=panel-header]").within(() => {
      cy.contains("button", "Save").should("not.be.disabled");
      cy.contains("button", "Cancel").should("not.be.disabled");
    });
    cy.contains("Editing").should("exist");
    cy.get("[data-testid=panel-content-items] > div p")
      .then(($els) => {
        const text = $els.toArray().map((el) => el.innerText.trim());
        return text;
      })
      .should("deep.eq", homepageContentOrdered);

    // Test deleting
    cy.contains("Discover")
      .parent()
      .parent()
      .within(() => {
        cy.get("[data-testid=object-identifier-delete]").click();
      });
    cy.contains("Discover").should("not.exist");

    // Test reorder
    cy.get("[data-testid=panel-content-items] > div p")
      .first()
      .parent()
      .within(() => {
        cy.get("input").clear().type("20");
      });

    cy.get("[data-testid=panel-content-items]").click();

    // Test updated order
    cy.get("[data-testid=panel-content-items] > div p")
      .then(($els) => {
        const text = $els.toArray().map((el) => el.innerText.trim());
        return text;
      })
      .should("deep.eq", [
        "Kids Home page hero",
        "Spotlight movies",
        "New TV Releases",
        "Classic kids shows",
        "Best Picture Nominees 2021",
        "GOT Season 1",
        "Miraculous Season 5",
        "Home page hero",
      ]);

    // Test cancel
    cy.contains("Cancel").click();

    cy.contains("Editing").should("not.exist");
    cy.get("[data-testid=panel-content-items] > div p")
      .then(($els) => {
        const text = $els.toArray().map((el) => el.innerText.trim());
        return text;
      })
      .should("deep.eq", homepageContentOrdered);
  });

  it("Reorder, remove and save", () => {
    cy.get('input[name="search-query-input"]').type("Homepage");
    cy.contains("Homepage").should("exist");
    cy.openContentLibraryObjectPanelByText("Homepage");

    cy.contains("button", "Content").click();

    cy.get("[data-testid=panel-content-items]").within(() => {
      cy.contains("Home page hero");
    });

    // Test switching to edit mode
    cy.contains("button", "Edit Content").should("not.be.disabled").click();

    // Delete
    cy.contains("Discover")
      .parent()
      .parent()
      .within(() => {
        cy.get("[data-testid=object-identifier-delete]").click();
      });

    // Reorder
    cy.get("[data-testid=panel-content-items] > div p")
      .first()
      .parent()
      .within(() => {
        cy.get("input").clear().type("20");
      });
    cy.get("[data-testid=panel-content-items]").click();

    // Test updated order
    cy.get("[data-testid=panel-content-items] > div p")
      .then(($els) => {
        const text = $els.toArray().map((el) => el.innerText.trim());
        return text;
      })
      .should("deep.eq", [
        "Kids Home page hero",
        "Spotlight movies",
        "New TV Releases",
        "Classic kids shows",
        "Best Picture Nominees 2021",
        "GOT Season 1",
        "Miraculous Season 5",
        "Home page hero",
      ]);

    // Test save
    cy.contains("Save").click();

    cy.wait("@updateHomepageSetContent");

    cy.contains("button", "Edit Content").should("not.be.disabled");
  });
});
