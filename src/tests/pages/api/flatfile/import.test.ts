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
