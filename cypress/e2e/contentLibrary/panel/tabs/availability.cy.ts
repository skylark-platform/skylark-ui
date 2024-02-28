import {
  allDevicesAllCustomersAvailability,
  configureSkylarkIntercepts,
} from "../../../../support/utils/handlers";

describe("Content Library - Object Panel - Availability tab", () => {
  beforeEach(() => {
    cy.login();

    configureSkylarkIntercepts();

    cy.visit("/");
    cy.wait("@introspectionQuery");
  });

  it("open Availability tab", () => {
    cy.get('input[name="search-query-input"]').type("all avail test movie");
    cy.contains("Fantastic Mr Fox (All Availabilities)").should("exist");
    cy.openContentLibraryObjectPanelByText(
      "Fantastic Mr Fox (All Availabilities)",
    );

    cy.get("[data-testid=panel-tabs]").within(() => {
      cy.contains("button", "Availability").click();
    });

    cy.contains("Active in the past");
    cy.contains("Time Window");
    cy.contains("Audience");
  });

  it("navigates to the availability using the object button", () => {
    cy.fixture(
      "./skylark/queries/getObject/fantasticMrFox_All_Availabilities.json",
    ).then((objectJson) => {
      cy.fixture(
        "./skylark/queries/getObjectAvailability/fantasticMrFox_All_Availabilities.json",
      ).then((availabilityJson) => {
        const objectUid = objectJson.data.getObject.uid;
        const objectType = objectJson.data.getObject.__typename;

        cy.get('input[name="search-query-input"]').type("all avail test movie");
        cy.contains("Fantastic Mr Fox (All Availabilities)").should("exist");
        cy.openContentLibraryObjectPanelByText(
          "Fantastic Mr Fox (All Availabilities)",
        );

        cy.get("[data-testid=panel-tabs]").within(() => {
          cy.contains("button", "Availability").click();
        });

        cy.get(`[data-cy=panel-for-${objectType}-${objectUid}]`);

        cy.get('[aria-label="Open Object"]').first().click();

        // Only check the panel object type and uid so we don't have to mock the response
        cy.get(
          `[data-cy=panel-for-Availability-${availabilityJson.data.getObjectAvailability.availability.objects[0].uid}]`,
        );

        // Check back button returns to the original object
        cy.get('[aria-label="Click to go back"]').click();
        cy.get(`[data-cy=panel-for-${objectType}-${objectUid}]`);

        // Check forward button returns to the availability object
        cy.get('[aria-label="Click to go forward"]').click();
        cy.get(
          `[data-cy=panel-for-Availability-${availabilityJson.data.getObjectAvailability.availability.objects[0].uid}]`,
        );
      });
    });
  });

  it("adds Availability using the Object Search modal", () => {
    cy.fixture(
      "./skylark/queries/getObject/fantasticMrFox_All_Availabilities.json",
    ).then((objectJson) => {
      cy.get('input[name="search-query-input"]').type("all avail test movie");
      cy.contains("Fantastic Mr Fox (All Availabilities)").should("exist");
      cy.openContentLibraryObjectPanelByText(
        "Fantastic Mr Fox (All Availabilities)",
      );

      cy.get("[data-testid=panel-tabs]").within(() => {
        cy.contains("button", "Availability").click();
      });

      // Check default Availability view shows
      cy.contains("Time Window");

      cy.get("#availability-panel-header")
        .parent()
        .within(() => {
          cy.get("button").click();
        });

      cy.get("[data-testid=search-objects-modal-save]").should("exist");

      cy.get("[data-testid=search-objects-modal]").within(() => {
        cy.get('input[name="search-query-input"]').type(
          allDevicesAllCustomersAvailability,
        );
      });

      cy.contains(allDevicesAllCustomersAvailability).click();

      cy.contains("button", "Add").click();

      cy.get("[data-testid=search-objects-modal-save]").should("not.exist");

      // Check edit Availability view shows
      cy.contains("Time Window").should("not.exist");

      cy.contains(allDevicesAllCustomersAvailability);

      cy.contains("Editing");

      cy.contains(allDevicesAllCustomersAvailability)
        .closest("div")
        .within(() => {
          cy.get("[data-testid=object-identifier-delete]").click();
        });

      cy.contains(allDevicesAllCustomersAvailability).should("not.exist");
    });
  });
});
