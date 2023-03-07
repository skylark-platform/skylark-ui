import { rest } from "msw";
import { NextApiRequest, NextApiResponse } from "next";
import { createMocks, Mocks } from "node-mocks-http";

import { erroredFlatfileAccessKeyExchangeHandler } from "src/__tests__/mocks/handlers/flatfile";
import { skylarkObjectTypesHandler } from "src/__tests__/mocks/handlers/introspectionHandlers";
import { server } from "src/__tests__/mocks/server";
import * as constants from "src/constants/flatfile";
import { FlatfileRow } from "src/interfaces/flatfile/responses";
import handler from "src/pages/api/flatfile/import";

const mockConstants = constants as {
  FLATFILE_ACCESS_KEY_ID: string | null;
  FLATFILE_SECRET_KEY: string | null;
  FLATFILE_ORG: {
    id: string;
    name: string;
  };
};

beforeEach(() => {
  mockConstants.FLATFILE_ACCESS_KEY_ID = "accessKeyId";
  mockConstants.FLATFILE_SECRET_KEY = "secretKey";
});

afterEach(() => {
  jest.resetAllMocks();
});

describe("request validation", () => {
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
        batchId: "123",
      },
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(500);
  });

  test("returns 500 when the batchId is empty in the request body", async () => {
    const { req, res } = createMocks({
      method: "POST",
      body: {
        batchId: "",
      },
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(500);
    expect(res._getData()).toEqual("batchId is mandatory");
  });
});

describe("validated request", () => {
  let req: Mocks<
    NextApiRequest,
    NextApiResponse<string | FlatfileRow[]>
  >["req"];
  let res: Mocks<
    NextApiRequest,
    NextApiResponse<string | FlatfileRow[]>
  >["res"];

  beforeEach(() => {
    const requestMocks = createMocks({
      method: "POST",
      body: {
        batchId: "batchId",
        objectType: "Episode",
        graphQLUri: "http://localhost:3000/graphql",
        graphQLToken: "token",
      },
    });
    req = requestMocks.req;
    res = requestMocks.res;
  });

  test("returns 500 and the error message while getting a token from Flatfile", async () => {
    // Arrange
    server.use(skylarkObjectTypesHandler(["Episode"]));
    server.use(erroredFlatfileAccessKeyExchangeHandler);

    // Act
    await handler(req, res);

    // Assert
    expect(res._getData()).toEqual("Error exchanging Flatfile token");
    expect(res._getStatusCode()).toBe(500);
  });

  test("returns 500 and the error message when the Flatfile response is a bad format", async () => {
    // Arrange
    server.use(skylarkObjectTypesHandler(["Episode"]));
    server.use(
      rest.post(
        "https://api.us.flatfile.io/auth/access-key/exchange/",
        (req, res, ctx) => {
          const tokenResponse = {
            invalid: true,
          };

          return res(ctx.status(200), ctx.json(tokenResponse));
        },
      ),
    );

    // Act
    await handler(req, res);

    // Assert
    expect(res._getData()).toEqual("Invalid response returned by Flatfile");
    expect(res._getStatusCode()).toBe(500);
  });

  test("returns 200 status and created data imported from Flatfile with non-accepted data filtered out", async () => {
    // Arrange
    server.use(skylarkObjectTypesHandler(["Episode"]));

    // Act
    await handler(req, res);

    // Assert
    expect(res._getStatusCode()).toBe(200);
    expect(res._getData()).toEqual([
      {
        id: 1,
        status: "accepted",
        valid: true,
        data: {
          title: "episode 1",
        },
      },
    ]);
  });
});
