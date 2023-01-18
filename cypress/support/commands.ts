import "@percy/cypress";
import "cypress-iframe";

import { LOCAL_STORAGE } from "../../src/constants/skylark";

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
    "http://localhost:3000/graphql",
  );
  window.localStorage.setItem(LOCAL_STORAGE.betaAuth.token, "token");
});

Cypress.Commands.add("clickOutside", () => {
  cy.get("body").click(0, 0); //0,0 here are the x and y coordinates
});
//
//
// -- This is a child command --
// Cypress.Commands.add('drag', { prevSubject: 'element'}, (subject, options) => { ... })
//
//
// -- This is a dual command --
// Cypress.Commands.add('dismiss', { prevSubject: 'optional'}, (subject, options) => { ... })
//
//
// -- This will overwrite an existing command --
// Cypress.Commands.overwrite('visit', (originalFn, url, options) => { ... })
//
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Cypress {
    interface Chainable {
      login(): Chainable<void>;
      clickOutside(): Chainable<void>;
      // drag(subject: string, options?: Partial<TypeOptions>): Chainable<Element>;
      // dismiss(
      //   subject: string,
      //   options?: Partial<TypeOptions>,
      // ): Chainable<Element>;
      // visit(
      //   originalFn: CommandOriginalFn,
      //   url: string,
      //   options: Partial<VisitOptions>,
      // ): Chainable<Element>;
    }
  }
}
