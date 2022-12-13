import { ApolloClient, gql } from "@apollo/client";
import { createMockClient, MockApolloClient } from "mock-apollo-client";
import { NextApiRequest, NextApiResponse } from "next";
import { createMocks, Mocks } from "node-mocks-http";

import * as constants from "src/constants/flatfile";
import { FlatfileRow } from "src/interfaces/flatfile/responses";
import { SkylarkImportedObject } from "src/interfaces/skylark/import";
import * as flatfile from "src/lib/flatfile";
import * as flatfileClient from "src/lib/graphql/flatfile/client";
import { GET_FINAL_DATABASE_VIEW } from "src/lib/graphql/flatfile/queries";
import * as skylarkClient from "src/lib/graphql/skylark/client";
import { GET_SKYLARK_SCHEMA } from "src/lib/graphql/skylark/queries";
import * as skylarkIntrospection from "src/lib/skylark/introspection";
import handler from "src/pages/api/flatfile/import";
import { GQLSkylarkSchemaQueryFixture } from "src/tests/fixtures";

jest.mock("../../../../lib/flatfile", () => ({
  ...jest.requireActual("../../../../lib/flatfile"),
  exchangeFlatfileAccessKey: jest.fn(),
}));

jest.mock("../../../../lib/graphql/skylark/client", () => ({
  createSkylarkClient: jest.fn(),
}));

jest.mock("../../../../lib/graphql/flatfile/client", () => ({
  createFlatfileClient: jest.fn(),
}));

const mockConstants = constants as {
  FLATFILE_ACCESS_KEY_ID: string | null;
  FLATFILE_SECRET_KEY: string | null;
  FLATFILE_ORG: {
    id: string;
    name: string;
  };
};

const flatfileRows: FlatfileRow[] = [
  {
    id: 1,
    status: "accepted",
    valid: true,
    data: { title: "episode 1" },
  },
  {
    id: 2,
    status: "invalid",
    valid: false, // This one will be filtered out, if it breaks the GraphQL mutation below will fail
    data: { title: "episode 2" },
  },
];

const CREATE_EPISODE_MUTATION = gql`
  mutation createEpisode_batchId {
    createEpisode_batchId_1: createEpisode(episode: { title: "episode 1" }) {
      uid
      external_id
    }
  }
`;

let spiedExchangeFlatfileAccessKey: jest.SpyInstance;
let spiedGetSkylarkObjectTypes: jest.SpyInstance;

beforeEach(() => {
  mockConstants.FLATFILE_ACCESS_KEY_ID = "accessKeyId";
  mockConstants.FLATFILE_SECRET_KEY = "secretKey";

  spiedExchangeFlatfileAccessKey = jest.spyOn(
    flatfile,
    "exchangeFlatfileAccessKey",
  );

  spiedGetSkylarkObjectTypes = jest.spyOn(
    skylarkIntrospection,
    "getSkylarkObjectTypes",
  );
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
});

describe("validated request", () => {
  let req: Mocks<
    NextApiRequest,
    NextApiResponse<string | SkylarkImportedObject[]>
  >["req"];
  let res: Mocks<
    NextApiRequest,
    NextApiResponse<string | SkylarkImportedObject[]>
  >["res"];

  let createFlatfileClient: jest.SpyInstance;
  let mockFlatfileClient: MockApolloClient;
  let getFinalDatabaseHandler: jest.Mock;

  let mockSkylarkClient: MockApolloClient;
  let getSkylarkSchemaHandler: jest.Mock;
  let createEpisodeHandler: jest.Mock;

  beforeEach(() => {
    const requestMocks = createMocks({
      method: "POST",
      body: {
        batchId: "batchId",
        objectType: "Episode",
      },
    });
    req = requestMocks.req;
    res = requestMocks.res;
  });

  beforeEach(() => {
    mockFlatfileClient = createMockClient();
    createFlatfileClient = jest
      .spyOn(flatfileClient, "createFlatfileClient")
      .mockReturnValue(mockFlatfileClient);

    getFinalDatabaseHandler = jest.fn().mockResolvedValue({
      data: {
        getFinalDatabaseView: {
          rows: flatfileRows,
        },
      },
    });

    mockFlatfileClient.setRequestHandler(
      GET_FINAL_DATABASE_VIEW,
      getFinalDatabaseHandler,
    );
  });

  beforeEach(() => {
    mockSkylarkClient = createMockClient();
    jest
      .spyOn(skylarkClient, "createSkylarkClient")
      .mockReturnValue(mockSkylarkClient);

    getSkylarkSchemaHandler = jest
      .fn()
      .mockResolvedValue(GQLSkylarkSchemaQueryFixture);

    createEpisodeHandler = jest.fn().mockResolvedValue({
      data: {
        createEpisode_batchId_1: {
          external_id: "external_1",
          uid: "1",
        },
      },
    });

    mockSkylarkClient.setRequestHandler(
      GET_SKYLARK_SCHEMA,
      getSkylarkSchemaHandler,
    );
    mockSkylarkClient.setRequestHandler(
      CREATE_EPISODE_MUTATION,
      createEpisodeHandler,
    );
  });

  test("returns 500 when the object type is not valid", async () => {
    // Arrange
    spiedGetSkylarkObjectTypes.mockResolvedValue([]);

    // Act
    await handler(req, res);

    // Assert
    expect(res._getData()).toEqual(
      `Object type "Episode" does not exist in Skylark`,
    );
    expect(res._getStatusCode()).toBe(500);
  });

  test("returns 500 and the error message while getting a token from Flatfile", async () => {
    // Arrange
    spiedGetSkylarkObjectTypes.mockResolvedValue(["Episode"]);
    spiedExchangeFlatfileAccessKey.mockImplementationOnce(async () => {
      throw new Error("actual error message");
    });

    // Act
    await handler(req, res);

    // Assert
    expect(res._getData()).toEqual("actual error message");
    expect(res._getStatusCode()).toBe(500);
  });

  test("returns 500 and a generic error message while getting a token from Flatfile with no error message", async () => {
    // Arrange
    spiedGetSkylarkObjectTypes.mockResolvedValue(["Episode"]);
    spiedExchangeFlatfileAccessKey.mockImplementationOnce(async () => {
      throw new Error();
    });

    // Act
    await handler(req, res);

    // Assert
    expect(res._getData()).toEqual("Error exchanging Flatfile token");
    expect(res._getStatusCode()).toBe(500);
  });

  test("creates a Flatfile client using the token from the exchange flatfile access key call", async () => {
    // Arrange
    spiedGetSkylarkObjectTypes.mockResolvedValue(["Episode"]);
    spiedExchangeFlatfileAccessKey.mockResolvedValue({
      accessToken: "flatfileAccessToken",
    });

    // Act
    await handler(req, res);

    // Assert
    expect(createFlatfileClient).toHaveBeenCalledWith("flatfileAccessToken");
  });

  test("returns 200 status and created data imported from Flatfile with non-accepted data filtered out", async () => {
    // Arrange
    spiedGetSkylarkObjectTypes.mockResolvedValue(["Episode"]);
    spiedExchangeFlatfileAccessKey.mockResolvedValue({
      accessToken: "flatfileAccessToken",
    });

    // Act
    await handler(req, res);

    // Assert
    expect(res._getStatusCode()).toBe(200);
    expect(res._getData()).toEqual([
      {
        external_id: "external_1",
        uid: "1",
      },
    ]);
  });
});
