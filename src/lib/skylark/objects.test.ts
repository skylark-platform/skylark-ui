import { GQLSkylarkSchemaQueryFixture } from "src/tests/fixtures";

import { getObjectOperations } from "./objects";

test("returns all operations", () => {
  const got = getObjectOperations(
    "Episode",
    GQLSkylarkSchemaQueryFixture.data.__schema,
  );
  expect(got).toEqual({
    name: "Episode",
    fields: [
      {
        enumValues: undefined,
        isList: false,
        isRequired: false,
        name: "title",
        type: "string",
      },
    ],
    operations: {
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
        inputs: [
          {
            enumValues: undefined,
            isList: false,
            isRequired: false,
            name: "title",
            type: "string",
          },
        ],
        relationships: [],
      },
    },
  });
});

test("throws when an operation doesn't exist for an object type", () => {
  expect(() =>
    getObjectOperations(
      "NonExistantObject",
      GQLSkylarkSchemaQueryFixture.data.__schema,
    ),
  ).toThrow("Skylark ObjectType is missing expected operation");
});
