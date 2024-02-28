import { IntrospectionSchema } from "graphql";

import GQLSkylarkSchemaQueryFixtureJSON from "src/__tests__/fixtures/skylark/queries/introspection/introspectionQuery.json";
import GQLSkylarkSchemaWithoutEpisodeObjectQueryFixtureJSON from "src/__tests__/fixtures/skylark/queries/introspection/introspectionQueryWithoutEpisode.json";
import { getAllObjectsMeta } from "src/lib/skylark/objects";

import {
  compareSkylarkObjectTypes,
  generateSchemaObjectTypeCountsText,
} from "./schemaComparison";

describe("compareSkylarkObjectTypes", () => {
  test("shows schemas as equal when no object types are given", () => {
    const schema1 = getAllObjectsMeta(
      GQLSkylarkSchemaQueryFixtureJSON.data
        .__schema as unknown as IntrospectionSchema,
      [],
    );
    const schema2 = getAllObjectsMeta(
      GQLSkylarkSchemaWithoutEpisodeObjectQueryFixtureJSON.data
        .__schema as unknown as IntrospectionSchema,
      [],
    );

    const got = compareSkylarkObjectTypes(schema1, schema2);

    expect(got).toEqual({
      objectTypes: {
        added: [],
        removed: [],
        modified: [],
        unmodified: [],
        isEqual: true,
      },
    });
  });

  test("detects Episode object is missing from second schema (only Episode object type given)", () => {
    const schema1 = getAllObjectsMeta(
      GQLSkylarkSchemaQueryFixtureJSON.data
        .__schema as unknown as IntrospectionSchema,
      ["Episode"],
    );
    const schema2 = getAllObjectsMeta(
      GQLSkylarkSchemaWithoutEpisodeObjectQueryFixtureJSON.data
        .__schema as unknown as IntrospectionSchema,
      [],
    );

    const got = compareSkylarkObjectTypes(schema1, schema2);

    expect(got.objectTypes.added.map(({ name }) => name)).toEqual([]);
    expect(got.objectTypes.removed.map(({ name }) => name)).toEqual([
      "Episode",
    ]);
    expect(got.objectTypes.modified.map(({ name }) => name)).toEqual([]);
    expect(got.objectTypes.unmodified.map(({ name }) => name)).toEqual([]);

    expect(got).toEqual({
      objectTypes: {
        added: [],
        removed: expect.any(Array),
        modified: [],
        unmodified: [],
        isEqual: false,
      },
    });
  });

  test("detects Episode object is missing from second schema (all object types)", () => {
    const objectTypesSchema1 =
      GQLSkylarkSchemaQueryFixtureJSON.data.__schema.types
        .find(({ name }) => name === "VisibleObjectTypes")
        ?.enumValues?.map(({ name }) => name) || [];

    const objectTypesSchema2 =
      GQLSkylarkSchemaWithoutEpisodeObjectQueryFixtureJSON.data.__schema.types
        .find(({ name }) => name === "VisibleObjectTypes")
        ?.enumValues?.map(({ name }) => name) || [];

    const schema1 = getAllObjectsMeta(
      GQLSkylarkSchemaQueryFixtureJSON.data
        .__schema as unknown as IntrospectionSchema,
      objectTypesSchema1,
    );
    const schema2 = getAllObjectsMeta(
      GQLSkylarkSchemaWithoutEpisodeObjectQueryFixtureJSON.data
        .__schema as unknown as IntrospectionSchema,
      objectTypesSchema2,
    );

    const got = compareSkylarkObjectTypes(schema1, schema2);

    expect(got).toEqual({
      objectTypes: {
        added: [],
        removed: [expect.objectContaining({ name: "Episode" })],
        modified: expect.any(Array),
        unmodified: expect.any(Array),
        isEqual: false,
      },
    });

    expect(got.objectTypes.modified.length).toEqual(10);

    // Check relationship removed from an object
    const skylarkImageChanges = got.objectTypes.modified.find(
      ({ name }) => name === "SkylarkImage",
    );

    expect(
      skylarkImageChanges?.fields.filter(({ type }) => type === "added").length,
    ).toEqual(0);
    expect(
      skylarkImageChanges?.fields.filter(({ type }) => type === "removed")
        .length,
    ).toEqual(0);
    expect(
      skylarkImageChanges?.fields.filter(({ type }) => type === "modified")
        .length,
    ).toEqual(0);
    expect(
      skylarkImageChanges?.fields.filter(({ type }) => type === "equal").length,
    ).toEqual(14);

    expect(
      skylarkImageChanges?.relationships.filter(({ type }) => type === "added")
        .length,
    ).toEqual(0);
    expect(
      skylarkImageChanges?.relationships.filter(
        ({ type }) => type === "removed",
      ).length,
    ).toEqual(1);
    expect(
      skylarkImageChanges?.relationships.filter(
        ({ type }) => type === "modified",
      ).length,
    ).toEqual(0);
    expect(
      skylarkImageChanges?.relationships.filter(({ type }) => type === "equal")
        .length,
    ).toEqual(14);
  });

  test("detects title field is missing from object", () => {
    const schema1 = getAllObjectsMeta(
      GQLSkylarkSchemaQueryFixtureJSON.data
        .__schema as unknown as IntrospectionSchema,
      ["SkylarkSet"],
    );

    const filterTitleField = ({ name }: { name: string }) => name !== "title";

    const schema2 = getAllObjectsMeta(
      {
        ...GQLSkylarkSchemaWithoutEpisodeObjectQueryFixtureJSON.data.__schema,
        types: [
          ...GQLSkylarkSchemaWithoutEpisodeObjectQueryFixtureJSON.data.__schema.types.map(
            (type) => {
              if (
                type.name === "SkylarkSetCreateInput" ||
                type.name === "SkylarkSet"
              ) {
                return {
                  ...type,
                  inputFields: type.inputFields?.filter(filterTitleField),
                  fields: type.fields?.filter(({ name }) => name !== "title"),
                };
              }

              return type;
            },
          ),
          {},
        ],
      } as unknown as IntrospectionSchema,
      ["SkylarkSet"],
    );

    const got = compareSkylarkObjectTypes(schema1, schema2);

    expect(got).toEqual({
      objectTypes: {
        added: [],
        removed: [],
        modified: expect.any(Array),
        unmodified: [],
        isEqual: false,
      },
    });
    expect(got.objectTypes.modified.length).toEqual(1);

    const brandFields = got.objectTypes.modified[0].fields
      .filter(({ type }) => type === "removed")
      .map(({ name }) => name);

    expect(brandFields).toEqual(["title"]);
  });

  test("detects title field has been modified as its type has changed from String to Integer from object", () => {
    const schema1 = getAllObjectsMeta(
      GQLSkylarkSchemaQueryFixtureJSON.data
        .__schema as unknown as IntrospectionSchema,
      ["SkylarkSet"],
    );

    const replaceStrTitleWithInt = (field: { name: string }) =>
      field.name === "title"
        ? {
            ...field,
            type: {
              kind: "SCALAR",
              name: "Int",
              ofType: null,
            },
          }
        : field;

    const schema2 = getAllObjectsMeta(
      {
        ...GQLSkylarkSchemaWithoutEpisodeObjectQueryFixtureJSON.data.__schema,
        types: [
          ...GQLSkylarkSchemaWithoutEpisodeObjectQueryFixtureJSON.data.__schema.types.map(
            (type) => {
              if (
                type.name === "SkylarkSetCreateInput" ||
                type.name === "SkylarkSet"
              ) {
                return {
                  ...type,
                  fields: type.fields?.map(replaceStrTitleWithInt),
                  inputFields: type.inputFields?.map(replaceStrTitleWithInt),
                };
              }

              return type;
            },
          ),
          {},
        ],
      } as unknown as IntrospectionSchema,
      ["SkylarkSet"],
    );

    const got = compareSkylarkObjectTypes(schema1, schema2);

    expect(got).toEqual({
      objectTypes: {
        added: [],
        removed: [],
        modified: expect.any(Array),
        unmodified: [],
        isEqual: false,
      },
    });
    expect(got.objectTypes.modified.length).toEqual(1);

    const brandFields = got.objectTypes.modified[0].fields;

    const modifiedBrandFields = brandFields
      .filter(({ type }) => type === "modified")
      .map(({ name }) => name);

    expect(modifiedBrandFields).toEqual(["title"]);
  });
});

describe("generateSchemaObjectTypeCountsText", () => {
  it("returns an empty string when all counts are 0", () => {
    const got = generateSchemaObjectTypeCountsText("field", {
      added: 0,
      removed: 0,
      equal: 0,
      modified: 0,
    });

    expect(got).toEqual("");
  });

  it("returns an empty string when only the equal count is not 0", () => {
    const got = generateSchemaObjectTypeCountsText("field", {
      added: 0,
      removed: 0,
      equal: 20,
      modified: 0,
    });

    expect(got).toEqual("");
  });

  it("returns '1 field added' when the added count is 1 and others are 0", () => {
    const got = generateSchemaObjectTypeCountsText("field", {
      added: 1,
      removed: 0,
      equal: 0,
      modified: 0,
    });

    expect(got).toEqual("1 field added");
  });

  it("returns '2 fields added' when the added count is 2 and others are 0", () => {
    const got = generateSchemaObjectTypeCountsText("field", {
      added: 2,
      removed: 0,
      equal: 0,
      modified: 0,
    });

    expect(got).toEqual("2 fields added");
  });

  it("returns '3 fields changed' when the added count is 2, removed count is 1 and others are 0", () => {
    const got = generateSchemaObjectTypeCountsText("field", {
      added: 2,
      removed: 1,
      equal: 0,
      modified: 0,
    });

    expect(got).toEqual("3 fields changed");
  });

  it("returns '6 fields changed' all counts are 2 as equal fields are not counted", () => {
    const got = generateSchemaObjectTypeCountsText("field", {
      added: 2,
      removed: 2,
      equal: 2,
      modified: 2,
    });

    expect(got).toEqual("6 fields changed");
  });

  it("returns '1 relationship added' (test relationship type)", () => {
    const got = generateSchemaObjectTypeCountsText("relationship", {
      added: 1,
      removed: 0,
      equal: 0,
      modified: 0,
    });

    expect(got).toEqual("1 relationship added");
  });

  it("returns '6 relationships changed' (test relationship type)", () => {
    const got = generateSchemaObjectTypeCountsText("relationship", {
      added: 2,
      removed: 2,
      equal: 2,
      modified: 2,
    });

    expect(got).toEqual("6 relationships changed");
  });
});
