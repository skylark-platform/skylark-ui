import { createMocks } from "node-mocks-http";

import * as constants from "src/constants/flatfile";
import * as flatfile from "src/lib/flatfile";
import handler from "src/pages/api/flatfile/import";

jest.mock("../../../../lib/flatfile", () => ({
  ...jest.requireActual("../../../../lib/flatfile"),
  exchangeFlatfileAccessKey: jest.fn(),
}));

jest.mock("../../../../lib/graphql/skylark/client", () => ({
  ...jest.requireActual("../../../../lib/graphql/skylark/client"),
  createSkylarkClient: jest.fn(),
  skylarkClient: {
    requestDataFromUser: jest.fn(({ onComplete }) =>
      onComplete({ batchId: "batchId" }),
    ),
  },
}));

const mockConstants = constants as {
  FLATFILE_ACCESS_KEY_ID: string | null;
  FLATFILE_SECRET_KEY: string | null;
  FLATFILE_ORG: {
    id: string;
    name: string;
  };
};

let spiedExchangeFlatfileAccessKey: jest.SpyInstance;

beforeEach(() => {
  mockConstants.FLATFILE_ACCESS_KEY_ID = "accessKeyId";
  mockConstants.FLATFILE_SECRET_KEY = "secretKey";

  spiedExchangeFlatfileAccessKey = jest.spyOn(
    flatfile,
    "exchangeFlatfileAccessKey",
  );
});

afterEach(() => {
  jest.resetAllMocks();
});

test("returns 501 when the method is not POST", async () => {
  const { req, res } = createMocks({
    method: "GET",
  });

  await handler(req, res);

  expect(res._getStatusCode()).toBe(501);
});

test("returns 400 when a request body is missing", async () => {
  const { req, res } = createMocks({
    method: "POST",
  });

  await handler(req, res);

  expect(res._getStatusCode()).toBe(400);
  expect(res._getData()).toEqual("Invalid request body");
});

test("returns 500 when FLATFILE_ACCESS_KEY_ID or FLATFILE_SECRET_KEY are falsy", async () => {
  mockConstants.FLATFILE_ACCESS_KEY_ID = null;

  const { req, res } = createMocks({
    method: "POST",
    body: {
      batchId: "",
    },
  });

  await handler(req, res);

  expect(res._getStatusCode()).toBe(500);
});

test("returns 500 when the objectType is missing from the request body", async () => {
  const { req, res } = createMocks({
    method: "POST",
    body: {
      batchId: "",
    },
  });

  await handler(req, res);

  expect(res._getStatusCode()).toBe(500);
  expect(res._getData()).toEqual("batchId and objectType are mandatory");
});

test.skip("returns 500 when an error occurs while getting a token from Flatfile", async () => {
  spiedExchangeFlatfileAccessKey.mockImplementationOnce(async () => {
    throw new Error("fail");
  });

  const { req, res } = createMocks({
    method: "POST",
    body: {
      batchId: "xxxx-xxxx-xxxx",
      objectType: "Episode",
    },
  });

  await handler(req, res);

  expect(res._getData()).toEqual("Error exchanging Flatfile token");
  expect(res._getStatusCode()).toBe(500);
});
