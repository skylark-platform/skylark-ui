// Extend Jest "expect" functionality with Testing Library assertions.
import "@testing-library/jest-dom";
// Polyfill "window.fetch" used in the React component.
import "whatwg-fetch";

import { server } from "./src/__tests__/mocks/server";
import { LOCAL_STORAGE } from "./src/constants/localStorage";

// Establish API mocking before all tests.
beforeAll(() => {
  Storage.prototype.getItem = jest.fn().mockImplementation((key) => {
    if (key === LOCAL_STORAGE.auth.active) {
      return JSON.stringify({
        uri: "http://localhost:3000",
        token: "token",
      });
    }
  });
  return server.listen();
});
beforeEach(() => {
  // IntersectionObserver isn't available in test environment
  const mockIntersectionObserver = jest.fn();
  mockIntersectionObserver.mockReturnValue({
    observe: () => null,
    unobserve: () => null,
    disconnect: () => null,
  });
  window.IntersectionObserver = mockIntersectionObserver;

  const mockResizeObserver = jest.fn();
  mockResizeObserver.mockReturnValue({
    observe: () => null,
    unobserve: () => null,
    disconnect: () => null,
  });
  global.ResizeObserver = mockResizeObserver;
});
// Reset any request handlers that we may add during the tests,
// so they don't affect other tests.
afterEach(() => server.resetHandlers());
// Clean up after the tests are finished.
afterAll(() => server.close());
