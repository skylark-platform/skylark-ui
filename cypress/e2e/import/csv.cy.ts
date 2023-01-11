describe("Import/CSV", () => {
  beforeEach(() => {
    cy.visit("/import/csv");
  });

  it("visit import/csv page", () => {
    cy.get("button").contains("Import").should("be.disabled");
    cy.get('[data-cy="status-card"]').should("have.length", "4");
    cy.get("a").contains("Start curating").should("have.class", "btn-disabled");
    cy.get(".btn-outline")
      .contains("New import")
      .should("have.class", "btn-disabled");
    cy.percySnapshot("import/csv");
  });

  it("select objectType", () => {
    cy.get('[data-cy="select"]').click();
    cy.get('[data-cy="select-options"]').should("be.visible");
    cy.percySnapshot("import/csv - objectType select open");

    cy.get('[data-cy="select-options"]')
      .get("li > span")
      .contains("Episode")
      .click();

    cy.get("button").contains("Import").should("not.disabled");
    cy.get('[data-cy="status-card"]')
      .first()
      .should("have.class", "border-t-success");
    cy.get(".border-t-manatee-500").should("have.length", "3");
    cy.percySnapshot("import/csv - objectType selected");
  });

  it("opens and closes Flatfile", () => {
    cy.get('[data-cy="select"]').click();
    cy.get('[data-cy="select-options"]').should("be.visible");
    cy.get('[data-cy="select-options"]')
      .get("li > span")
      .contains("Episode")
      .click();
    cy.get("button").contains("Import").click();

    cy.frameLoaded(".flatfile-sdk iframe");

    cy.get(".flatfile-close").click();

    cy.get(".flatfile-sdk iframe").should("not.exist");
    cy.get('[data-cy="status-card"]')
      .first()
      .should("have.class", "border-t-success");
    cy.get(".border-t-manatee-500").should("have.length", "3");
  });

  it("import a csv through Flatfile", { retries: 3 }, () => {
    cy.get('[data-cy="select"]').click();
    cy.get('[data-cy="select-options"]').should("be.visible");
    cy.get('[data-cy="select-options"]')
      .get("li > span")
      .contains("Episode")
      .click();
    cy.get("button").contains("Import").click();

    cy.frameLoaded(".flatfile-sdk iframe");

    // Allow Flatfile to load before checking for start over button
    cy.contains("Processing ...", { timeout: 10000 }).should("not.exist");
    cy.wait(5000);

    // If Start over button exists, click it before continuing tests
    cy.iframe(".flatfile-sdk iframe").then(($body) => {
      if ($body.find("button:contains('Start over')").length > 0) {
        cy.iframe().contains("Start over").click();
      }
    });

    cy.iframe()
      .contains("Drop your file here", { timeout: 10000 })
      .should("be.visible");

    cy.iframe()
      .find("#file-inputid")
      .selectFile(
        {
          contents: Cypress.Buffer.from(
            "title,slug\nWinter is Coming,winter-is-coming\nThe Kingsroad,the-kingsroad",
          ),
          fileName: "episodes.csv",
          mimeType: "text/csv",
          lastModified: Date.now(),
        },
        { force: true },
      );

    cy.iframe().contains("Change or confirm header selection");
    cy.iframe().contains("Continue").click();

    cy.iframe().contains("Change or confirm column matches");
    cy.iframe().contains("Continue").click();

    cy.iframe().contains("Review and finalize");
    cy.iframe().contains("Save and finalize").click();

    cy.get(".flatfile-sdk iframe").should("not.exist");

    cy.get('[data-cy="status-card"].border-t-success', {
      timeout: 10000,
    }).should("have.length", 4);

    cy.get("a")
      .contains("Start curating")
      .should("not.have.class", "btn-disabled");
    cy.get(".btn-outline")
      .contains("New import")
      .should("not.have.class", "btn-disabled");

    cy.get("button").contains("Import").should("be.disabled");
    cy.get('[data-cy="select"]').should("be.disabled");

    cy.percySnapshot("import/csv - import complete");

    cy.get(".btn-outline").contains("New import").click();
    cy.get("button").contains("Import").should("not.disabled");
    cy.get('[data-cy="status-card"]')
      .first()
      .should("have.class", "border-t-success");
    cy.get(".border-t-manatee-500").should("have.length", "3");
  });
});
