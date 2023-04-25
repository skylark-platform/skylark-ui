import "@percy/cypress";
import "cypress-iframe";

import { LOCAL_STORAGE } from "../../src/constants/localStorage";

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
    LOCAL_STORAGE.betaAuth.uri,
    Cypress.env("skylark_graphql_uri"),
  );
  window.localStorage.setItem(LOCAL_STORAGE.betaAuth.token, "token");
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

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Cypress {
    interface Chainable {
      login(): Chainable<void>;
      clickOutside(): Chainable<void>;
      getByLabel(l: string): Chainable<void>;
      /**
       * Visit a Storybook story
       */
      visitStory(id: string): Chainable<Window>;

      /**
       * Find the first draggable item in the document.
       */
      findFirstDraggableItem(): Chainable<Element>;

      /**
       * Find a draggable handle within an item.
       */
      findDraggableHandle(): Chainable<Element>;

      /**
       * Move a draggable element by the specified number of pixels.
       */
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

      /**
       * Move a sortable element in a given direction
       */
      keyboardMoveBy(amount: number, direction: string): Chainable<Element>;

      /**
       * Find a draggable element node by id
       */
      findItemById(id: string): Chainable<Element>;

      /**
       * Get the index for a given sortable element
       */
      getIndexForItem(id: string): Chainable<number>;
    }
  }
}

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

Cypress.Commands.add("findFirstDraggableItem", () => {
  return cy.get(`[data-cy="draggable-item"`).first();
});

Cypress.Commands.add(
  "findDraggableHandle",
  {
    prevSubject: "element",
  },
  (subject) => {
    return cy
      .wrap(subject, { log: false })
      .find(`[data-cypress="draggable-handle"]`);
  },
);

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
          .then((subject: any) => {
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

Cypress.Commands.add("findItemById", (id) => {
  return cy.get(`[data-id="${id}"]`);
});

Cypress.Commands.add("getIndexForItem", (id) => {
  return cy
    .get(`[data-id="${id}"]`)
    .invoke("attr", "data-index")
    .then((index) => {
      return index ? parseInt(index, 10) : -1;
    });
});

Cypress.Commands.add("visitStory", (id) => {
  return cy.visit(`/iframe.html?id=${id}`, { log: false });
});

const Keys = {
  Space: " ",
};

Cypress.Commands.add(
  "keyboardMoveBy",
  {
    prevSubject: "element",
  },
  (subject, times: number, direction: string) => {
    const arrowKey = `{${direction}arrow}`;

    Cypress.log({
      $el: subject,
      name: "Move",
    });

    cy.wrap(subject, { log: false })
      .focus({ log: false })
      .type(Keys.Space, {
        delay: 150,
        scrollBehavior: false,
        force: true,
        log: false,
      })
      .closest("body")
      .type(arrowKey.repeat(times), {
        scrollBehavior: false,
        delay: 150,
        force: true,
      })
      .wait(150)
      .type(Keys.Space, {
        force: true,
        scrollBehavior: false,
      })
      .wait(250);
  },
);
