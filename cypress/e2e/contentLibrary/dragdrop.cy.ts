import {
  hasMatchingVariable,
  hasOperationName,
} from "../../support/utils/graphqlTestUtils";

const allDevicesAllCustomersAvailability =
  "Always - All devices, all customer types";

describe("Drag and Drop - Content and Relationship tab", () => {
  beforeEach(() => {
    cy.login();

    cy.intercept("POST", Cypress.env("skylark_graphql_uri"), (req) => {
      if (hasOperationName(req, "IntrospectionQuery")) {
        req.alias = "introspectionQuery";
        req.reply({
          fixture: "./skylark/queries/introspection/introspectionQuery.json",
        });
      }
      if (hasOperationName(req, "GET_SkylarkSet_RELATIONSHIPS")) {
        req.reply({
          fixture: "./skylark/queries/getObjectRelationships/homepage.json",
        });
      }
      if (hasOperationName(req, "GET_SkylarkSet_AVAILABILITY")) {
        req.reply({
          fixture:
            "./skylark/queries/getObjectAvailability/fantasticMrFox_All_Availabilities.json",
        });
      }
      if (hasOperationName(req, "GET_SkylarkSet")) {
        req.reply({
          fixture: "./skylark/queries/getObject/homepage.json",
        });
      }

      if (hasOperationName(req, "SEARCH")) {
        if (hasMatchingVariable(req, "queryString", "Homepage")) {
          req.reply({
            fixture: "./skylark/queries/search/homepage.json",
          });
        } else if (
          hasMatchingVariable(
            req,
            "queryString",
            allDevicesAllCustomersAvailability,
          )
        ) {
          req.reply({
            fixture:
              "./skylark/queries/search/allDevicesAllCustomersAvailability.json",
          });
        } else {
          req.reply({
            fixture: "./skylark/queries/search/gotPage1.json",
          });
        }
      }
    });

    cy.visit("/");
    cy.wait("@introspectionQuery");
  });

  describe("Drag & Drop", () => {
    describe("Set Content", () => {
      it("drags an object into Set content", () => {
        cy.fixture("./skylark/queries/getObject/homepage.json").then(
          (homepageJson) => {
            const homepageUid = homepageJson.data.getObject.uid;
            const homepageObjectType = homepageJson.data.getObject.__typename;

            cy.get('input[name="search-query-input"]').type("Homepage");
            cy.contains("Homepage").should("exist");
            cy.openContentLibraryObjectPanelByText("Homepage");
            cy.contains("button", "Content").click();
            cy.get(`[data-cy=panel-for-${homepageObjectType}-${homepageUid}]`);

            const deltaX = 500;
            const deltaY = 500;

            cy.get("[data-cy=panel-drop-zone]").should("not.exist");

            cy.get(`[data-cy="draggable-item"`)
              .last()
              .trigger("mousedown", {
                button: 0,
                release: false,
                force: true,
              })
              .trigger("mousemove", {
                force: true,
                clientX: 20,
                clientY: 20,
              })
              .wait(500)
              .trigger("mousemove", {
                force: true,
                clientX: deltaX,
                clientY: deltaY,
              })
              .then(() => {
                cy.get("[data-cy=panel-drop-zone]").should("exist");
              })
              .wait(100)
              .trigger("mouseup", { force: true })
              .wait(250)
              .then(() => {
                cy.contains("button", "Content").should("exist");
                cy.get("input.bg-success")
                  .should("exist")
                  .should("have.length", 1);
              });
          },
        );
      });

      it("shows a warning toast when the item is already in the Set content", () => {
        cy.fixture("./skylark/queries/getObject/homepage.json").then(
          (homepageJson) => {
            const homepageUid = homepageJson.data.getObject.uid;
            const homepageObjectType = homepageJson.data.getObject.__typename;

            cy.get('input[name="search-query-input"]').type("Homepage");
            cy.contains("Homepage").should("exist");
            cy.openContentLibraryObjectPanelByText("Homepage");
            cy.contains("button", "Content").click();
            cy.get(`[data-cy=panel-for-${homepageObjectType}-${homepageUid}]`);

            const deltaX = 500;
            const deltaY = 500;

            cy.get("[data-cy=panel-drop-zone]").should("not.exist");

            cy.get(`[data-cy="draggable-item"`)
              .last()
              .trigger("mousedown", {
                button: 0,
                release: false,
                force: true,
              })
              .trigger("mousemove", {
                force: true,
                clientX: 20,
                clientY: 20,
              })
              .wait(500)
              .trigger("mousemove", {
                force: true,
                clientX: deltaX,
                clientY: deltaY,
              })
              .then(() => {
                cy.get("[data-cy=panel-drop-zone]").should("exist");
              })
              .wait(100)
              .trigger("mouseup", { force: true })
              .wait(250)
              .then(() => {
                cy.contains("button", "Content").should("exist");
                cy.get("input.bg-success")
                  .should("exist")
                  .should("have.length", 1);
              });

            cy.get(`[data-cy="draggable-item"`)
              .last()
              .trigger("mousedown", {
                button: 0,
                release: false,
                force: true,
              })
              .trigger("mousemove", {
                force: true,
                clientX: 20,
                clientY: 20,
              })
              .wait(500)
              .trigger("mousemove", {
                force: true,
                clientX: deltaX,
                clientY: deltaY,
              })
              .then(() => {
                cy.get("[data-cy=panel-drop-zone]").should("exist");
              })
              .wait(100)
              .trigger("mouseup", { force: true })
              .wait(250)
              .then(() => {
                cy.get("[data-cy=toast]").within(() => {
                  cy.contains("Existing").should("exist");
                  cy.contains("exists as content").should("exist");
                });
              });
          },
        );
      });
    });

    describe("Relationships", () => {
      it("drags an object and adds it as a relationship", () => {
        cy.fixture("./skylark/queries/getObject/homepage.json").then(
          (homepageJson) => {
            const homepageUid = homepageJson.data.getObject.uid;
            const homepageObjectType = homepageJson.data.getObject.__typename;

            cy.get('input[name="search-query-input"]').type("Homepage");
            cy.contains("Homepage").should("exist");
            cy.openContentLibraryObjectPanelByText("Homepage");
            cy.contains("button", "Relationships").click();
            cy.get(`[data-cy=panel-for-${homepageObjectType}-${homepageUid}]`);

            const deltaX = 500;
            const deltaY = 500;

            cy.get("[data-cy=panel-drop-zone]").should("not.exist");

            cy.get(`[data-cy="draggable-item"`)
              .last()
              .trigger("mousedown", {
                button: 0,
                release: false,
                force: true,
              })
              .trigger("mousemove", {
                force: true,
                clientX: 20,
                clientY: 20,
              })
              .then(() => {
                cy.get("[data-cy=panel-drop-zone]").should("exist");
              })
              .wait(500)
              .trigger("mousemove", {
                force: true,
                clientX: deltaX,
                clientY: deltaY,
              })
              .wait(100)
              .trigger("mouseup", { force: true })
              .wait(250)
              .then(() => {
                cy.get("span.bg-success")
                  .should("exist")
                  .should("have.length", 1);
              });
          },
        );
      });

      it("shows a warning toast when the relationship already exists", () => {
        cy.fixture("./skylark/queries/getObject/homepage.json").then(
          (homepageJson) => {
            const homepageUid = homepageJson.data.getObject.uid;
            const homepageObjectType = homepageJson.data.getObject.__typename;

            cy.get('input[name="search-query-input"]').type("Homepage");
            cy.contains("Homepage").should("exist");
            cy.openContentLibraryObjectPanelByText("Homepage");
            cy.contains("button", "Relationships").click();
            cy.get(`[data-cy=panel-for-${homepageObjectType}-${homepageUid}]`);

            const deltaX = 500;
            const deltaY = 500;

            cy.get("[data-cy=panel-drop-zone]").should("not.exist");

            cy.get(`[data-cy="draggable-item"`)
              .last()
              .trigger("mousedown", {
                button: 0,
                release: false,
                force: true,
              })
              .trigger("mousemove", {
                force: true,
                clientX: 20,
                clientY: 20,
              })
              .then(() => {
                cy.get("[data-cy=panel-drop-zone]").should("exist");
              })
              .wait(500)
              .trigger("mousemove", {
                force: true,
                clientX: deltaX,
                clientY: deltaY,
              })
              .wait(100)
              .trigger("mouseup", { force: true })
              .wait(250)
              .then(() => {
                cy.get("span.bg-success")
                  .should("exist")
                  .should("have.length", 1);
              });

            cy.get(`[data-cy="draggable-item"`)
              .last()
              .trigger("mousedown", {
                button: 0,
                release: false,
                force: true,
              })
              .trigger("mousemove", {
                force: true,
                clientX: 20,
                clientY: 20,
              })
              .then(() => {
                cy.get("[data-cy=panel-drop-zone]").should("exist");
              })
              .wait(500)
              .trigger("mousemove", {
                force: true,
                clientX: deltaX,
                clientY: deltaY,
              })
              .wait(100)
              .trigger("mouseup", { force: true })
              .wait(250)
              .then(() => {
                cy.get("[data-cy=toast]").within(() => {
                  cy.contains("Relationship exists").should("exist");
                });
              });
          },
        );
      });

      it("shows an error toast when an invalid object type is dragged", () => {
        cy.fixture("./skylark/queries/getObject/homepage.json").then(
          (homepageJson) => {
            const homepageUid = homepageJson.data.getObject.uid;
            const homepageObjectType = homepageJson.data.getObject.__typename;

            cy.get('input[name="search-query-input"]').type("Homepage");
            cy.contains("Homepage").should("exist");
            cy.openContentLibraryObjectPanelByText("Homepage");
            cy.contains("button", "Relationships").click();
            cy.get(`[data-cy=panel-for-${homepageObjectType}-${homepageUid}]`);

            const deltaX = 500;
            const deltaY = 500;

            cy.get("[data-cy=panel-drop-zone]").should("not.exist");

            cy.get(`[data-cy="draggable-item"`)
              .first()
              .trigger("mousedown", {
                button: 0,
                release: false,
                force: true,
              })
              .trigger("mousemove", {
                force: true,
                clientX: 20,
                clientY: 20,
              })
              .then(() => {
                cy.get("[data-cy=panel-drop-zone]").should("exist");
              })
              .wait(500)
              .trigger("mousemove", {
                force: true,
                clientX: deltaX,
                clientY: deltaY,
              })
              .wait(100)
              .trigger("mouseup", { force: true })
              .wait(250)
              .then(() => {
                cy.get("[data-cy=toast]").within(() => {
                  cy.contains("Invalid relationship").should("exist");
                });
              });
          },
        );
      });
    });

    describe("Availability", () => {
      it("drags an Availability object to add it", () => {
        cy.fixture("./skylark/queries/getObject/homepage.json").then(
          (homepageJson) => {
            const homepageUid = homepageJson.data.getObject.uid;
            const homepageObjectType = homepageJson.data.getObject.__typename;

            cy.get('input[name="search-query-input"]').type("Homepage");
            cy.contains("Homepage").should("exist");
            cy.openContentLibraryObjectPanelByText("Homepage");
            cy.contains("button", "Availability").click();
            cy.get(`[data-cy=panel-for-${homepageObjectType}-${homepageUid}]`);

            cy.get('input[name="search-query-input"]')
              .clear()
              .type(allDevicesAllCustomersAvailability);

            cy.contains(allDevicesAllCustomersAvailability).should("exist");

            const deltaX = 500;
            const deltaY = 500;

            cy.get("[data-cy=panel-drop-zone]").should("not.exist");

            cy.get(`[data-cy="draggable-item"`)
              .last()
              .trigger("mousedown", {
                button: 0,
                release: false,
                force: true,
              })
              .trigger("mousemove", {
                force: true,
                clientX: 20,
                clientY: 20,
              })
              .then(() => {
                cy.get("[data-cy=panel-drop-zone]").should("exist");
              })
              .wait(500)
              .trigger("mousemove", {
                force: true,
                clientX: deltaX,
                clientY: deltaY,
              })
              .wait(100)
              .trigger("mouseup", { force: true })
              .wait(250)
              .then(() => {
                cy.get("[data-testid=panel]").within(() => {
                  cy.contains(allDevicesAllCustomersAvailability).should(
                    "exist",
                  );
                });
              });
          },
        );
      });

      it("shows a warning toast when the Availability is already assigned", () => {
        cy.fixture("./skylark/queries/getObject/homepage.json").then(
          (homepageJson) => {
            const homepageUid = homepageJson.data.getObject.uid;
            const homepageObjectType = homepageJson.data.getObject.__typename;

            cy.get('input[name="search-query-input"]').type("Homepage");
            cy.contains("Homepage").should("exist");
            cy.openContentLibraryObjectPanelByText("Homepage");
            cy.contains("button", "Availability").click();
            cy.get(`[data-cy=panel-for-${homepageObjectType}-${homepageUid}]`);

            cy.get('input[name="search-query-input"]')
              .clear()
              .type(allDevicesAllCustomersAvailability);

            cy.contains(allDevicesAllCustomersAvailability).should("exist");

            const deltaX = 500;
            const deltaY = 500;

            cy.get("[data-cy=panel-drop-zone]").should("not.exist");

            cy.get(`[data-cy="draggable-item"`)
              .last()
              .trigger("mousedown", {
                button: 0,
                release: false,
                force: true,
              })
              .trigger("mousemove", {
                force: true,
                clientX: 20,
                clientY: 20,
              })
              .then(() => {
                cy.get("[data-cy=panel-drop-zone]").should("exist");
              })
              .wait(500)
              .trigger("mousemove", {
                force: true,
                clientX: deltaX,
                clientY: deltaY,
              })
              .wait(100)
              .trigger("mouseup", { force: true })
              .wait(250)
              .then(() => {
                cy.get("[data-testid=panel]").within(() => {
                  cy.contains(allDevicesAllCustomersAvailability).should(
                    "exist",
                  );
                });
              });

            cy.get(`[data-cy="draggable-item"`)
              .last()
              .trigger("mousedown", {
                button: 0,
                release: false,
                force: true,
              })
              .trigger("mousemove", {
                force: true,
                clientX: 20,
                clientY: 20,
              })
              .then(() => {
                cy.get("[data-cy=panel-drop-zone]").should("exist");
              })
              .wait(500)
              .trigger("mousemove", {
                force: true,
                clientX: deltaX,
                clientY: deltaY,
              })
              .wait(100)
              .trigger("mouseup", { force: true })
              .wait(250)
              .then(() => {
                cy.get("[data-cy=toast]").within(() => {
                  cy.contains(
                    `Availability "${allDevicesAllCustomersAvailability}" is already assigned`,
                  ).should("exist");
                });
              });
          },
        );
      });

      it("shows an error toast when a non-Availability object is dragged into the drop zone", () => {
        cy.fixture("./skylark/queries/getObject/homepage.json").then(
          (homepageJson) => {
            const homepageUid = homepageJson.data.getObject.uid;
            const homepageObjectType = homepageJson.data.getObject.__typename;

            cy.get('input[name="search-query-input"]').type("Homepage");
            cy.contains("Homepage").should("exist");
            cy.openContentLibraryObjectPanelByText("Homepage");
            cy.contains("button", "Availability").click();
            cy.get(`[data-cy=panel-for-${homepageObjectType}-${homepageUid}]`);

            const deltaX = 500;
            const deltaY = 500;

            cy.get("[data-cy=panel-drop-zone]").should("not.exist");

            cy.get(`[data-cy="draggable-item"`)
              .last()
              .trigger("mousedown", {
                button: 0,
                release: false,
                force: true,
              })
              .trigger("mousemove", {
                force: true,
                clientX: 20,
                clientY: 20,
              })
              .then(() => {
                cy.get("[data-cy=panel-drop-zone]").should("exist");
              })
              .wait(500)
              .trigger("mousemove", {
                force: true,
                clientX: deltaX,
                clientY: deltaY,
              })
              .wait(100)
              .trigger("mouseup", { force: true })
              .wait(250)
              .then(() => {
                cy.get("[data-cy=toast]").within(() => {
                  cy.contains("is not an Availability object").should("exist");
                });
              });
          },
        );
      });
    });
  });
});
