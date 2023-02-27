import { GraphQLClient } from "graphql-request";

import { createSkylarkClient } from "src/lib/graphql/skylark/client";

import {
  getSkylarkObjectOperations,
  getSkylarkObjectTypes,
} from "./introspection";
import { SKYLARK_OBJECT_TYPES_FIXTURE } from "./introspection.fixture";

afterEach(() => {
  jest.resetAllMocks();
});

describe("getSkylarkObjectOperations", () => {
  let mockClient: GraphQLClient;

  beforeEach(() => {
    mockClient = createSkylarkClient("http://localhost:3000", "token");
  });

  test("returns the operations for an Episode", async () => {
    const got = await getSkylarkObjectOperations(mockClient, "Episode");

    expect(got.get?.name).toEqual("getEpisode");
    expect(got.get?.type).toEqual("Query");
    expect(got.create.name).toEqual("createEpisode");
    expect(got.create.argName).toEqual("episode");
    expect(got.update.name).toEqual("updateEpisode");
    expect(got.list?.name).toEqual("listEpisode");
    expect(got.delete.name).toEqual("deleteEpisode");
  });
});

describe("getSkylarkObjectTypes", () => {
  let mockClient: GraphQLClient;

  beforeEach(() => {
    mockClient = createSkylarkClient("http://localhost:3000", "token");
  });

  test("returns the expected values", async () => {
    const got = await getSkylarkObjectTypes(mockClient);

    expect(got).toEqual(SKYLARK_OBJECT_TYPES_FIXTURE);
  });
});
