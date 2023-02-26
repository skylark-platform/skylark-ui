// Extend Jest "expect" functionality with Testing Library assertions.
import "@testing-library/jest-dom";
// Polyfill "window.fetch" used in the React component.
import "whatwg-fetch";

import { LOCAL_STORAGE } from "./src/constants/skylark";
// TODO potentially remove this package after proper auth is implemented
// TODO remove this package
// import { enableFetchMocks } from "jest-fetch-mock";
// enableFetchMocks();
import { server } from "./src/tests/mocks/server";

// Establish API mocking before all tests.
beforeAll(() => {
  Storage.prototype.getItem = jest.fn().mockImplementation((key) => {
    if (key === LOCAL_STORAGE.betaAuth.uri) {
      return "http://localhost:3000";
    }
    if (key === LOCAL_STORAGE.betaAuth.token) {
      return "token";
    }
  });
  return server.listen();
});
// Reset any request handlers that we may add during the tests,
// so they don't affect other tests.
afterEach(() => server.resetHandlers());
// Clean up after the tests are finished.
afterAll(() => server.close());
