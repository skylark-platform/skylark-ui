import { MockApolloClient, createMockClient } from "mock-apollo-client";

import {
  GET_SKYLARK_OBJECT_TYPES,
  GET_SKYLARK_SCHEMA,
} from "src/lib/graphql/skylark/queries";
import * as fixtures from "src/tests/fixtures";
import { SKYLARK_OBJECT_TYPES_FIXTURE } from "src/tests/fixtures";

import {
  getSkylarkObjectOperations,
  getSkylarkObjectTypes,
} from "./introspection";

jest.mock("src/lib/graphql/skylark/client", () => ({
  ...jest.requireActual("src/lib/graphql/skylark/client"),
  createSkylarkClient: jest.fn(),
}));

afterEach(() => {
  jest.resetAllMocks();
});

describe("getSkylarkObjectOperations", () => {
  let mockClient: MockApolloClient;
  let schemaQueryHandler: jest.Mock;

  beforeEach(() => {
    mockClient = createMockClient();

    schemaQueryHandler = jest
      .fn()
      .mockResolvedValue(fixtures.GQLSkylarkSchemaQueryFixture);

    mockClient.setRequestHandler(GET_SKYLARK_SCHEMA, schemaQueryHandler);
  });

  test("makes the get schema query", async () => {
    await getSkylarkObjectOperations(mockClient, "Episode");

    expect(schemaQueryHandler).toHaveBeenCalled();
  });

  test("returns the operations for an Episode", async () => {
    const got = await getSkylarkObjectOperations(mockClient, "Episode");

    expect(got).toEqual({
      get: {
        name: "getEpisode",
        type: "Query",
      },
      list: {
        name: "listEpisode",
        type: "Query",
      },
      create: {
        name: "createEpisode",
        type: "Mutation",
        argName: "episode",
        inputs: [
          {
            enumValues: undefined,
            isList: false,
            isRequired: false,
            name: "title",
            type: "string",
          },
          {
            enumValues: ["SHORT", "LONG"],
            isList: false,
            isRequired: false,
            name: "type",
            type: "enum",
          },
        ],
        relationships: [],
      },
    });
  });
});

describe("getSkylarkObjectTypes", () => {
  let mockClient: MockApolloClient;
  let queryHandler: jest.Mock;

  beforeEach(() => {
    mockClient = createMockClient();

    queryHandler = jest
      .fn()
      .mockResolvedValue(fixtures.GQLSkylarkObjectTypesQueryFixture);

    mockClient.setRequestHandler(GET_SKYLARK_OBJECT_TYPES, queryHandler);
  });

  test("makes the get object types query", async () => {
    await getSkylarkObjectTypes(mockClient);

    expect(queryHandler).toHaveBeenCalled();
  });

  test("returns the expected values", async () => {
    const got = await getSkylarkObjectTypes(mockClient);

    expect(got).toEqual(SKYLARK_OBJECT_TYPES_FIXTURE);
  });
});
