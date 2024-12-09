import { hasOperationName } from "../../../../support/utils/graphqlTestUtils";
import {
  allDevicesAllCustomersAvailability,
  configureSkylarkIntercepts,
} from "../../../../support/utils/intercepts";

describe("Content Library - Object Panel - Audience tab", () => {
  beforeEach(() => {
    cy.login();

    configureSkylarkIntercepts();

    cy.visit("/");
    cy.wait("@introspectionQuery");
  });

  it("open Availability Dimensions tab", () => {
    cy.get('input[name="search-query-input"]').type(
      allDevicesAllCustomersAvailability,
    );
    cy.openContentLibraryObjectPanelByText(allDevicesAllCustomersAvailability);

    cy.contains("button", "Audience").click();

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

    cy.contains("button", "Audience").click();

    cy.get("[data-testid=panel-body]").within(() => {
      cy.contains("Premium")
        .parent()
        .within(() => {
          cy.get("button").click();
        });

      cy.contains("Premium").should("not.exist");
    });

    cy.contains("Editing");

    cy.intercept("POST", Cypress.env("skylark_graphql_uri"), (req) => {
      if (hasOperationName(req, "SL_UI_GET_AVAILABILITY_DIMENSIONS")) {
        req.alias = "getUpdatedAvailabilityDimensions";
        req.reply({
          data: {
            getAvailability: {
              title: "Always - All devices, all non-kids customer types",
              dimensions: {
                next_token: null,
                objects: [
                  {
                    uid: "01H4MM3PKPR35Z5205PAE3ZGZ8",
                    title: "Customer Type",
                    slug: "customer-types",
                    values: {
                      objects: [
                        {
                          uid: "01H4MMAVN9ESDAP6C1V7A760A7",
                          title: "Standard",
                          slug: "standard",
                        },
                      ],
                    },
                  },
                  {
                    uid: "01H4MM3PM6XRJ0ZZ2QAZR3MRSN",
                    title: "Device Type",
                    slug: "device-types",
                    values: {
                      objects: [
                        {
                          uid: "01H4MMAVWRJ0FPR1M69CCKT17X",
                          title: "PC",
                          slug: "pc",
                        },
                        {
                          uid: "01H4MMAVFH4WKT38RCTSQ7P2CH",
                          title: "SmartPhone",
                          slug: "smartphone",
                        },
                      ],
                    },
                  },
                ],
              },
            },
          },
        });
      }
    });

    cy.contains("Save").click();

    cy.wait("@getUpdatedAvailabilityDimensions");

    cy.contains("Editing").should("not.exist");

    cy.get("[data-testid=panel-body]").within(() => {
      cy.contains("Premium").should("not.exist");
    });
  });

  it("adds a dimension", () => {
    cy.get('input[name="search-query-input"]').type(
      allDevicesAllCustomersAvailability,
    );
    cy.openContentLibraryObjectPanelByText(allDevicesAllCustomersAvailability);

    cy.contains("button", "Audience").click();

    cy.get("[data-testid=panel-body]").within(() => {
      cy.contains("Premium");

      cy.contains("Customer type")
        .parent()
        .within(() => {
          cy.get("[data-testid=multiselect-input]").click();
        });
    });

    cy.contains("Kids").click();

    cy.contains("Editing");
    cy.contains("Kids");

    cy.contains("Save").click();

    cy.contains("Editing").should("not.exist");
  });
});
