import "@percy/cypress";
import "cypress-iframe";
import msw, {
  GraphQLContext,
  GraphQLRequest,
  GraphQLVariables,
  ResponseComposition,
} from "msw";

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

Cypress.Commands.add("openContentLibraryObjectPanelByText", (text) => {
  cy.contains("tr", text)
    .should(($el) => {
      // eslint-disable-next-line jest/valid-expect
      expect(Cypress.dom.isDetached($el)).to.eq(false);
    })
    .within(() => {
      cy.get('[aria-label="object-info"]').click({ force: true });
    });
});

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Cypress {
    interface Chainable {
      login(): Chainable<void>;
      clickOutside(): Chainable<void>;
      getByLabel(l: string): Chainable<void>;
      openContentLibraryObjectPanelByText(t: string): Chainable<void>;

      // interceptQuery(
      //   name: string,
      //   fn: (
      //     req: GraphQLRequest<GraphQLVariables>,
      //     // eslint-disable-next-line @typescript-eslint/no-explicit-any
      //     res: ResponseComposition<any>,
      //     ctx: GraphQLContext<Record<string, unknown>>,
      //   ) => void,
      //   alias?: string,
      // ): Chainable<void>;
    }
  }
  // eslint-disable-next-line @typescript-eslint/no-namespace
  interface Window {
    msw: {
      worker: msw.SetupWorker;
    };
  }
}
