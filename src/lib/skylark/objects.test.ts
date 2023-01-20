import {
  GQLSkylarkSchemaQueryFixture,
  SKYLARK_OBJECT_FIELDS_FIXTURE,
} from "src/tests/fixtures";

import { getAllSearchableObjectsMeta, getObjectOperations } from "./objects";

describe("getObjectOperations", () => {
  test("returns all operations", () => {
    const got = getObjectOperations(
      "Episode",
      GQLSkylarkSchemaQueryFixture.data.__schema,
    );
    expect(got).toEqual({
      name: "Episode",
      fields: SKYLARK_OBJECT_FIELDS_FIXTURE.map((name) => ({
        enumValues: undefined,
        isList: false,
        isRequired: false,
        name,
        type: "string",
      })),
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
        update: {
          name: "updateEpisode",
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
        delete: {
          name: "deleteEpisode",
          type: "Mutation",
          argName: "",
          inputs: [],
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
});

describe("getAllSearchableObjectFields", () => {
  test("returns Episode when it is searchable", () => {
    const got = getAllSearchableObjectsMeta(
      GQLSkylarkSchemaQueryFixture.data.__schema,
      ["Episode"],
    );
    expect(got).toEqual([
      {
        name: "Episode",
        fields: SKYLARK_OBJECT_FIELDS_FIXTURE.map((name) => ({
          enumValues: undefined,
          isList: false,
          isRequired: false,
          name,
          type: "string",
        })),
      },
    ]);
  });

  test("returns nothing when Episode is not searchable", () => {
    const got = getAllSearchableObjectsMeta(
      GQLSkylarkSchemaQueryFixture.data.__schema,
      ["UnknownObject"],
    );
    expect(got).toEqual([]);
  });
});
