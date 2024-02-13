import "@percy/cypress";
import "cypress-iframe";

import { LOCAL_STORAGE } from "../../src/constants/localStorage";

function getDocumentScroll() {
  if (document.scrollingElement) {
    const { scrollTop, scrollLeft } = document.scrollingElement;

    return {
      x: scrollTop,
      y: scrollLeft,
    };
  }

  return {
    x: 0,
    y: 0,
  };
}

/// <reference types="cypress" />
// ***********************************************
// This example commands.ts shows you how to
// create various custom commands and overwrite
// existing commands.
//
// For more comprehensive examples of custom
// commands please read more here:
// https://on.cypress.io/custom-commands
// ***********************************************
//
//
// -- This is a parent command --
Cypress.Commands.add("login", () => {
  window.localStorage.setItem(
    LOCAL_STORAGE.auth.active,
    JSON.stringify({
      uri: Cypress.env("skylark_graphql_uri"),
      token: "token",
    }),
  );
});

Cypress.Commands.add("clickOutside", () => {
  cy.get("body").click(0, 0); //0,0 here are the x and y coordinates
});

Cypress.Commands.add("getByLabel", (label) => {
  // you can disable individual command logging
  // by passing {log: false} option
  cy.log("**getByLabel**");
  cy.contains("label", label)
    .invoke("attr", "for")
    .then((id) => {
      cy.get("#" + id);
    });
});

Cypress.Commands.add("openContentLibraryObjectPanelByText", (text) => {
  cy.contains("[data-testid=object-search-results-row]", text)
    .trigger("mouseover")
    .should((el) => {
      // eslint-disable-next-line jest/valid-expect
      expect(Cypress.dom.isDetached(el)).to.eq(false);
    });

  // TODO this wait is crap and purely here to allow React to rerender to open the correct object
  cy.wait(1000);
  cy.get('[aria-label="object-info"]').click({ force: true });
});

// Taken from https://github.com/clauderic/dnd-kit/blob/694dcc2f62e5269541fc941fa6c9af46ccd682ad/cypress/support/commands.ts#L45
Cypress.Commands.add(
  "mouseMoveBy",
  {
    prevSubject: "element",
  },
  (subject, x: number, y: number, options?: { delay: number }) => {
    cy.wrap(subject, { log: false })
      .then((subject) => {
        const initialRect = subject.get(0).getBoundingClientRect();
        const windowScroll = getDocumentScroll();

        return [subject, initialRect, windowScroll] as const;
      })
      .then(([subject, initialRect, initialWindowScroll]) => {
        cy.wrap(subject)
          .trigger("mousedown", { force: true })
          .wait(options?.delay || 0, { log: Boolean(options?.delay) })
          .trigger("mousemove", {
            force: true,
            clientX: Math.floor(
              initialRect.left + initialRect.width / 2 + x / 2,
            ),
            clientY: Math.floor(
              initialRect.top + initialRect.height / 2 + y / 2,
            ),
          })
          .trigger("mousemove", {
            force: true,
            clientX: Math.floor(initialRect.left + initialRect.width / 2 + x),
            clientY: Math.floor(initialRect.top + initialRect.height / 2 + y),
          })
          .wait(100)
          .trigger("mouseup", { force: true })
          .wait(250)
          .then((subject) => {
            const finalRect = subject.get(0).getBoundingClientRect();
            const windowScroll = getDocumentScroll();
            const windowScrollDelta = {
              x: windowScroll.x - initialWindowScroll.x,
              y: windowScroll.y - initialWindowScroll.y,
            };

            const delta = {
              x: Math.round(
                finalRect.left - initialRect.left - windowScrollDelta.x,
              ),
              y: Math.round(
                finalRect.top - initialRect.top - windowScrollDelta.y,
              ),
            };

            return [subject, { initialRect, finalRect, delta }] as const;
          });
      });
  },
);

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Cypress {
    interface Chainable {
      login(): Chainable<void>;
      clickOutside(): Chainable<void>;
      getByLabel(l: string): Chainable<void>;
      openContentLibraryObjectPanelByText(t: string): Chainable<void>;
      mouseMoveBy(
        x: number,
        y: number,
        options?: { delay: number },
      ): Chainable<
        [
          Element,
          {
            initialRect: ClientRect;
            finalRect: ClientRect;
            delta: { x: number; y: number };
          },
        ]
      >;
    }
  }
}
