import { SetupWorker, setupWorker } from "msw";

import { handlers } from "./handlers";

// This configures a Service Worker with the given request handlers.
export const worker = setupWorker(...handlers);

// Cypress needs the worker added to the window object
(window as unknown as { msw: { worker: SetupWorker } }).msw = {
  worker,
};
