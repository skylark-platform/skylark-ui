import {
  hasMatchingVariable,
  hasOperationName,
} from "../../support/utils/graphqlTestUtils";

const allDevicesAllCustomersAvailability =
  "Always - All devices, all non-kids customer types";

const panelDragDeltaX = 1800;
const panelDragDeltaY = 500;

const searchContentLibrary = (str: string) => {
  cy.get('input[name="search-query-input"]').clear().type(str);
  cy.contains(str).should("exist");
};

const searchContentLibraryAndOpenPanel = (str: string) => {
  searchContentLibrary(str);
  cy.openContentLibraryObjectPanelByText(str);
};

const dragRowIntoPanel = (row: "first" | "last") => {
  const allRows = cy.get(`[data-cy="object-search-results-row-draggable"`);
  const cyRow = row === "first" ? allRows.first() : allRows.last();

  return cyRow
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
    .wait(100)
    .trigger("mousemove", {
      force: true,
      clientX: panelDragDeltaX,
      clientY: panelDragDeltaY,
    })
    .then(() => {
      cy.get("[data-cy=panel-drop-zone]").should("exist");
    })
    .wait(50)
    .trigger("mouseup", { force: true });
};

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
      if (hasOperationName(req, "SL_UI_GET_ACCOUNT_STATUS")) {
        req.reply({
          fixture: "./skylark/queries/getAccountStatus/default.json",
        });
      }
      if (hasOperationName(req, "SL_UI_GET_SKYLARKSET_RELATIONSHIPS")) {
        req.reply({
          fixture: "./skylark/queries/getObjectRelationships/homepage.json",
        });
      }
      if (hasOperationName(req, "SL_UI_GET_SKYLARKSET_AVAILABILITY")) {
        req.reply({
          fixture:
            "./skylark/queries/getObjectAvailability/fantasticMrFox_All_Availabilities.json",
        });
      }
      if (hasOperationName(req, "SL_UI_GET_SKYLARKSET")) {
        req.reply({
          fixture: "./skylark/queries/getObject/homepage.json",
        });
      }
      if (hasOperationName(req, "SL_UI_GET_AVAILABILITY")) {
        req.reply({
          fixture:
            "./skylark/queries/getObject/allDevicesAllCustomersAvailability.json",
        });
      }
      if (hasOperationName(req, "SL_UI_GET_USER_AND_ACCOUNT")) {
        req.reply({
          fixture: "./skylark/queries/getUserAndAccount.json",
        });
      }

      if (hasOperationName(req, "SL_UI_SEARCH")) {
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

            searchContentLibraryAndOpenPanel("Homepage");
            cy.contains("button", "Content").click();
            cy.get(`[data-cy=panel-for-${homepageObjectType}-${homepageUid}]`);

            cy.get("[data-cy=panel-drop-zone]").should("not.exist");

            dragRowIntoPanel("last").then(() => {
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

            searchContentLibraryAndOpenPanel("Homepage");
            cy.contains("button", "Content").click();
            cy.get(`[data-cy=panel-for-${homepageObjectType}-${homepageUid}]`);

            cy.get("[data-cy=panel-drop-zone]").should("not.exist");

            dragRowIntoPanel("last").then(() => {
              cy.contains("button", "Content").should("exist");
              cy.get("input.bg-success")
                .should("exist")
                .should("have.length", 1);
            });

            dragRowIntoPanel("last").then(() => {
              cy.get("[data-testid=toast]").within(() => {
                cy.contains("Existing Linked Object").should("exist");
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

            searchContentLibraryAndOpenPanel("Homepage");
            cy.contains("button", "Relationships").click();
            cy.get(`[data-cy=panel-for-${homepageObjectType}-${homepageUid}]`);

            cy.get("[data-cy=panel-drop-zone]").should("not.exist");

            dragRowIntoPanel("last").then(() => {
              cy.get("span.bg-success")
                .should("exist")
                .should("have.length", 1);
            });
          },
        );
      });

      it("expands the images relationship and adds an object by dragging", () => {
        cy.fixture("./skylark/queries/getObject/homepage.json").then(
          (homepageJson) => {
            const homepageUid = homepageJson.data.getObject.uid;
            const homepageObjectType = homepageJson.data.getObject.__typename;

            searchContentLibraryAndOpenPanel("Homepage");
            cy.contains("button", "Relationships").click();
            cy.get(`[data-cy=panel-for-${homepageObjectType}-${homepageUid}]`);

            cy.get("[data-cy=panel-drop-zone]").should("not.exist");

            // Expand images relationship
            cy.get("#panel-section-call_to_actions").should("exist");
            cy.get('[aria-label="expand images relationship"]').click();
            cy.get("#panel-section-call_to_actions").should("not.exist");

            dragRowIntoPanel("last").then(() => {
              cy.get("span.bg-success")
                .should("exist")
                .should("have.length", 1);
            });
          },
        );
      });

      it("expands the images relationship and shows an error toast when an invalid object type is dragged", () => {
        cy.fixture("./skylark/queries/getObject/homepage.json").then(
          (homepageJson) => {
            const homepageUid = homepageJson.data.getObject.uid;
            const homepageObjectType = homepageJson.data.getObject.__typename;

            searchContentLibraryAndOpenPanel("Homepage");
            cy.contains("button", "Relationships").click();
            cy.get(`[data-cy=panel-for-${homepageObjectType}-${homepageUid}]`);

            cy.get("[data-cy=panel-drop-zone]").should("not.exist");

            // Expand images relationship
            cy.get("#panel-section-call_to_actions").should("exist");
            cy.get('[aria-label="expand images relationship"]').click();
            cy.get("#panel-section-call_to_actions").should("not.exist");

            dragRowIntoPanel("first").then(() => {
              cy.get("[data-testid=toast]")
                .first()
                .within(() => {
                  cy.contains("Invalid Object Type for Relationship").should(
                    "exist",
                  );
                });
            });
          },
        );
      });

      it("shows an error toast when the relationship already exists", () => {
        cy.fixture("./skylark/queries/getObject/homepage.json").then(
          (homepageJson) => {
            const homepageUid = homepageJson.data.getObject.uid;
            const homepageObjectType = homepageJson.data.getObject.__typename;

            searchContentLibraryAndOpenPanel("Homepage");
            cy.contains("button", "Relationships").click();
            cy.get(`[data-cy=panel-for-${homepageObjectType}-${homepageUid}]`);

            cy.get("[data-cy=panel-drop-zone]").should("not.exist");

            dragRowIntoPanel("last").then(() => {
              cy.get("span.bg-success")
                .should("exist")
                .should("have.length", 1);
            });

            dragRowIntoPanel("last").then(() => {
              cy.get("[data-testid=toast]").within(() => {
                cy.contains("Existing Linked Object").should("exist");
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

            searchContentLibraryAndOpenPanel("Homepage");
            cy.contains("button", "Relationships").click();
            cy.get(`[data-cy=panel-for-${homepageObjectType}-${homepageUid}]`);

            cy.get("[data-cy=panel-drop-zone]").should("not.exist");

            dragRowIntoPanel("first").then(() => {
              cy.get("[data-testid=toast]")
                .first()
                .within(() => {
                  cy.contains("Invalid Object Type").should("exist");
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

            searchContentLibraryAndOpenPanel("Homepage");
            cy.get("[data-testid=panel-tabs]").within(() => {
              cy.contains("button", "Availability").click();
            });
            cy.get(`[data-cy=panel-for-${homepageObjectType}-${homepageUid}]`);

            searchContentLibrary(allDevicesAllCustomersAvailability);

            cy.get("[data-cy=panel-drop-zone]").should("not.exist");

            dragRowIntoPanel("last").then(() => {
              cy.get("[data-testid=panel]").within(() => {
                cy.contains(allDevicesAllCustomersAvailability).should("exist");
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

            searchContentLibraryAndOpenPanel("Homepage");
            cy.get("[data-testid=panel-tabs]").within(() => {
              cy.contains("button", "Availability").click();
            });
            cy.get(`[data-cy=panel-for-${homepageObjectType}-${homepageUid}]`);

            searchContentLibrary(allDevicesAllCustomersAvailability);

            cy.get("[data-cy=panel-drop-zone]").should("not.exist");

            dragRowIntoPanel("last").then(() => {
              cy.get("[data-testid=panel]").within(() => {
                cy.contains(allDevicesAllCustomersAvailability).should("exist");
              });
            });

            dragRowIntoPanel("last").then(() => {
              cy.get("[data-testid=toast]").within(() => {
                cy.contains(`Existing Linked Object`).should("exist");
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

            searchContentLibraryAndOpenPanel("Homepage");
            cy.get("[data-testid=panel-tabs]").within(() => {
              cy.contains("button", "Availability").click();
            });
            cy.get(`[data-cy=panel-for-${homepageObjectType}-${homepageUid}]`);

            cy.get("[data-cy=panel-drop-zone]").should("not.exist");

            dragRowIntoPanel("last").then(() => {
              cy.get("[data-testid=toast]").within(() => {
                cy.contains("Invalid Object Type").should("exist");
              });
            });
          },
        );
      });
    });

    describe("Availability Assigned To", () => {
      it("drags an object to add it", () => {
        searchContentLibraryAndOpenPanel(allDevicesAllCustomersAvailability);

        cy.contains("Assigned To").click();

        cy.contains("Assign to multiple objects dropzone");

        searchContentLibrary("Homepage");

        cy.get("[data-cy=panel-drop-zone]").should("not.exist");

        cy.get(`[data-cy="object-search-results-row-draggable"`)
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
            clientX: panelDragDeltaX,
            clientY: panelDragDeltaY,
          })
          .wait(100)
          .trigger("mouseup", { force: true })
          .wait(250)
          .then(() => {
            cy.get("[data-testid=panel]").within(() => {
              cy.contains("HomepageAfterCarousel");
            });
          });
      });

      it("shows an error toast when an Availability object is dragged into the drop zone", () => {
        searchContentLibraryAndOpenPanel(allDevicesAllCustomersAvailability);

        cy.contains("Assigned To").click();

        cy.contains("Assign to multiple objects dropzone");

        cy.get("[data-cy=panel-drop-zone]").should("not.exist");

        cy.get(`[data-cy="object-search-results-row-draggable"`)
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
            clientX: panelDragDeltaX,
            clientY: panelDragDeltaY,
          })
          .wait(100)
          .trigger("mouseup", { force: true })
          .wait(250)
          .then(() => {
            cy.get("[data-testid=toast]").within(() => {
              cy.contains("Invalid Object Type").should("exist");
            });
          });
      });
    });
  });
});
