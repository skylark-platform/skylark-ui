import { IntrospectionSchema } from "graphql";

import GQLSkylarkSchemaQueryFixtureJSON from "src/__tests__/fixtures/skylark/queries/introspection/introspectionQuery.json";
import GQLSkylarkSchemaWithoutEpisodeObjectQueryFixtureJSON from "src/__tests__/fixtures/skylark/queries/introspection/introspectionQueryWithoutEpisode.json";
import { getAllObjectsMeta } from "src/lib/skylark/objects";

import { compareSkylarkSchemas } from "./schemaComparison";

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

  const got = compareSkylarkSchemas(schema1, schema2);

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

  const got = compareSkylarkSchemas(schema1, schema2);

  expect(got).toEqual({
    objectTypes: {
      added: [],
      removed: ["Episode"],
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

  const got = compareSkylarkSchemas(schema1, schema2);

  expect(got).toEqual({
    objectTypes: {
      added: [],
      removed: ["Episode"],
      modified: expect.any(Array),
      unmodified: expect.any(Array),
      isEqual: false,
    },
  });

  expect(got.objectTypes.modified.length).toEqual(10);

  // Check relationship removed from an object
  const skylarkImageChanges = got.objectTypes.modified.find(
    ({ objectType }) => objectType === "SkylarkImage",
  );
  expect(skylarkImageChanges?.fields.added).toEqual([]);
  expect(skylarkImageChanges?.fields.removed).toEqual([]);
  expect(skylarkImageChanges?.fields.modified).toEqual([]);

  expect(skylarkImageChanges?.relationships.added).toEqual([]);
  expect(skylarkImageChanges?.relationships.removed).toEqual([
    { objectType: "Episode", relationshipName: "episodes" },
  ]);
  expect(skylarkImageChanges?.relationships.modified).toEqual([]);
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

  const got = compareSkylarkSchemas(schema1, schema2);

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

  expect(brandFields).toEqual({
    isEqual: false,
    added: [],
    unmodified: expect.any(Array),
    modified: [],
    removed: [
      {
        enumValues: undefined,
        isList: false,
        isRequired: false,
        name: "title",
        originalType: "String",
        type: "string",
      },
    ],
  });
});

test.only("detects title field has been modified as its type has changed from String to Integer from object", () => {
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

  const got = compareSkylarkSchemas(schema1, schema2);

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

  expect(brandFields).toEqual({
    isEqual: false,
    added: [],
    unmodified: expect.any(Array),
    modified: [
      {
        isModified: true,
        name: "title",
        values: {
          enumValues: {
            base: undefined,
            isModified: false,
            updated: undefined,
          },
          isList: {
            base: false,
            isModified: false,
            updated: false,
          },
          isRequired: {
            base: false,
            isModified: false,
            updated: false,
          },
          name: {
            base: "title",
            isModified: false,
            updated: "title",
          },
          originalType: {
            base: "String",
            isModified: true,
            updated: "Int",
          },
          type: {
            base: "string",
            isModified: true,
            updated: "int",
          },
        },
      },
    ],
    removed: [],
  });
});
