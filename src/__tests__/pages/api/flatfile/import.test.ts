import { rest } from "msw";
import { NextApiRequest, NextApiResponse } from "next";
import {
  createMocks,
  createRequest,
  createResponse,
  Mocks,
} from "node-mocks-http";

import {
  erroredFlatfileAccessKeyExchangeHandler,
  mockFlatfileGetFinalDatabaseView,
  mockFlatfileGetFinalDatabaseViewPaginated,
} from "src/__tests__/mocks/handlers/flatfile";
import { server } from "src/__tests__/mocks/server";
import * as constants from "src/constants/csv";
import handler from "src/pages/api/flatfile/import";

type ApiRequest = NextApiRequest & ReturnType<typeof createRequest>;
type ApiResponse = NextApiResponse & ReturnType<typeof createResponse>;

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
    const { req, res } = createMocks<ApiRequest, ApiResponse>({
      method: "GET",
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(501);
  });

  test("returns 400 when a request body is missing", async () => {
    const { req, res } = createMocks<ApiRequest, ApiResponse>({
      method: "POST",
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(400);
    expect(res._getData()).toEqual("Invalid request body");
  });

  test("returns 500 when FLATFILE_ACCESS_KEY_ID or FLATFILE_SECRET_KEY are falsy", async () => {
    mockConstants.FLATFILE_ACCESS_KEY_ID = null;

    const { req, res } = createMocks<ApiRequest, ApiResponse>({
      method: "POST",
      body: {
        batchId: "123",
      },
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(500);
  });

  test("returns 500 when the limit isn't given in the request body", async () => {
    const { req, res } = createMocks<ApiRequest, ApiResponse>({
      method: "POST",
      body: {
        batchId: "",
      },
    });

    await handler(req, res);

    expect(res._getStatusCode()).toBe(500);
    expect(res._getData()).toEqual("batchId and limit are mandatory");
  });
});

describe("validated request", () => {
  let req: Mocks<ApiRequest, ApiResponse>["req"];
  let res: Mocks<ApiRequest, ApiResponse>["res"];

  beforeEach(() => {
    const requestMocks = createMocks<ApiRequest, ApiResponse>({
      method: "POST",
      body: {
        batchId: "batchId",
        limit: 1000,
      },
    });
    req = requestMocks.req;
    res = requestMocks.res;
  });

  test("returns 500 and the error message while getting a token from Flatfile", async () => {
    // Arrange
    server.use(erroredFlatfileAccessKeyExchangeHandler);

    // Act
    await handler(req, res);

    // Assert
    expect(res._getData()).toEqual("Error exchanging Flatfile token");
    expect(res._getStatusCode()).toBe(500);
  });

  test("returns 500 and the error message when the Flatfile response is a bad format", async () => {
    // Arrange
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

  test("returns 200 status and Flatfile import data", async () => {
    // Act
    await handler(req, res);

    // Assert
    expect(res._getStatusCode()).toBe(200);
    expect(res._getData()).toEqual(
      mockFlatfileGetFinalDatabaseView.getFinalDatabaseView,
    );
  });

  test("returns 200 status and Flatfile import data when offset is given", async () => {
    // Arrange
    const requestMocks = createMocks<ApiRequest, ApiResponse>({
      method: "POST",
      body: {
        batchId: "batchId",
        limit: 1000,
        offset: 20,
      },
    });

    // Act
    await handler(requestMocks.req, requestMocks.res);

    // Assert
    expect(requestMocks.res._getStatusCode()).toBe(200);
    expect(requestMocks.res._getData()).toEqual(
      mockFlatfileGetFinalDatabaseViewPaginated.getFinalDatabaseView,
    );
  });
});
