import { createMocks } from "node-mocks-http";
import handler from "src/pages/api/flatfile/import";

afterEach(() => {
  jest.resetAllMocks();
});

test("The method should be POST", async () => {
  const { req, res } = createMocks({
    method: "GET",
    query: {},
  });

  await handler(req, res);

  expect(res._getStatusCode()).toBe(501);
});

test("The body element cannot be empty", async () => {
  const { req, res } = createMocks({
    method: "POST",
    query: {},
  });

  await handler(req, res);

  expect(res._getStatusCode()).toBe(500);
});

test("check if body", async () => {
  const { req, res } = createMocks({
    method: "POST",
    query: {},
  });

  await handler(req, res);

  expect(res._getStatusCode()).toBe(500);
});

test("check if batchId and objectType it query", async () => {
  const { req, res } = createMocks({
    method: "POST",
    query: {
      batchId: "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
      objectType: "Person",
    },
  });

  await handler(req, res);

  expect(res._getStatusCode()).toBe(500);
});
