import {
  allDevicesAllCustomersAvailability,
  configurePanelSkylarkIntercepts,
} from "../__utils__/test-utils";

describe("Content Library - Object Panel - Availability Dimensions tab", () => {
  beforeEach(() => {
    cy.login();

    configurePanelSkylarkIntercepts();

    cy.visit("/");
    cy.wait("@introspectionQuery");
  });

  it("open Availability Dimensions tab", () => {
    cy.get('input[name="search-query-input"]').type(
      allDevicesAllCustomersAvailability,
    );
    cy.openContentLibraryObjectPanelByText(allDevicesAllCustomersAvailability);

    cy.contains("button", "Dimensions").click();

    cy.contains("Customer type");
    cy.contains("Device type");
    cy.contains("Premium");
    cy.contains("Standard");
    cy.contains("PC");
    cy.contains("SmartPhone");
  });

  it("removes a dimension", () => {
    cy.get('input[name="search-query-input"]').type(
      allDevicesAllCustomersAvailability,
    );
    cy.openContentLibraryObjectPanelByText(allDevicesAllCustomersAvailability);

    cy.contains("button", "Dimensions").click();

    cy.contains("Premium")
      .parent()
      .within(() => {
        cy.get("button").click();
      });

    cy.contains("Premium").should("not.exist");

    cy.contains("Editing");

    cy.contains("Save").click();

    cy.contains("Editing").should("not.exist");
    cy.contains("Premium").should("not.exist");
  });

  it("adds a dimension", () => {
    cy.get('input[name="search-query-input"]').type(
      allDevicesAllCustomersAvailability,
    );
    cy.openContentLibraryObjectPanelByText(allDevicesAllCustomersAvailability);

    cy.contains("button", "Dimensions").click();

    cy.contains("Customer type")
      .parent()
      .within(() => {
        cy.get("[data-testid=multiselect-input]").click();
      });

    cy.contains("Kids").click();

    cy.contains("Editing");
    cy.contains("Kids");

    cy.contains("Save").click();

    cy.contains("Editing").should("not.exist");
  });
});
