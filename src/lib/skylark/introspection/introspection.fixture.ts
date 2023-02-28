import { GQLSkylarkSchemaQueriesMutations } from "src/interfaces/graphql/introspection";
import GQLSkylarkObjectTypesQueryFixture from "src/tests/fixtures/skylark/queries/introspection/objectTypes.json";

export const SKYLARK_OBJECT_FIELDS_FIXTURE = [
  "uid",
  "title",
  "title_short",
  "title_long",
  "synopsis_short",
  "synopsis_long",
];

export const SKYLARK_OBJECT_TYPES_FIXTURE =
  GQLSkylarkObjectTypesQueryFixture.data.__type.possibleTypes.map(
    ({ name }) => name,
  );

const getQueries: GQLSkylarkSchemaQueriesMutations["__schema"]["queryType"]["fields"] =
  SKYLARK_OBJECT_TYPES_FIXTURE.map((objectType) => ({
    name: `get${objectType}`,
    type: {
      name: objectType,
      fields: SKYLARK_OBJECT_FIELDS_FIXTURE.map((name) => ({
        name,
        type: {
          __typename: "",
          name: "String",
          kind: "SCALAR",
          ofType: null,
          enumValues: null,
          fields: [],
          inputFields: [],
        },
      })),
    },
  }));

const listQueries: GQLSkylarkSchemaQueriesMutations["__schema"]["queryType"]["fields"] =
  SKYLARK_OBJECT_TYPES_FIXTURE.map((objectType) => ({
    name: `list${objectType}`,
    type: {
      name: objectType,
      fields: [],
    },
  }));

const createMutations: GQLSkylarkSchemaQueriesMutations["__schema"]["mutationType"]["fields"] =
  SKYLARK_OBJECT_TYPES_FIXTURE.map((objectType) => ({
    name: `create${objectType}`,
    args: [
      {
        name: objectType.toLowerCase(),
        type: {
          __typename: objectType,
          kind: "INPUT_OBJECT",
          enumValues: null,
          name: `${objectType}CreateInput`,
          fields: [],
          ofType: null,
          inputFields: [
            {
              name: "title",
              type: {
                __typename: "",
                name: "String",
                kind: "SCALAR",
                enumValues: null,
                fields: [],
                inputFields: [],
                ofType: null,
              },
            },
            {
              name: "type",
              type: {
                __typename: "",
                name: "String",
                kind: "ENUM",
                enumValues: [{ name: "SHORT" }, { name: "LONG" }],
                fields: [],
                inputFields: [],
                ofType: null,
              },
            },
          ],
        },
      },
    ],
  }));

const updateMutations: GQLSkylarkSchemaQueriesMutations["__schema"]["mutationType"]["fields"] =
  SKYLARK_OBJECT_TYPES_FIXTURE.map((objectType) => ({
    name: `update${objectType}`,
    args: [
      {
        name: objectType.toLowerCase(),
        type: {
          __typename: objectType,
          kind: "INPUT_OBJECT",
          enumValues: null,
          name: `${objectType}Input`,
          fields: [],
          ofType: null,
          inputFields: [
            {
              name: "title",
              type: {
                __typename: "",
                name: "String",
                kind: "SCALAR",
                enumValues: null,
                fields: [],
                inputFields: [],
                ofType: null,
              },
            },
            {
              name: "type",
              type: {
                __typename: "",
                name: "String",
                kind: "ENUM",
                enumValues: [{ name: "SHORT" }, { name: "LONG" }],
                fields: [],
                inputFields: [],
                ofType: null,
              },
            },
          ],
        },
      },
    ],
  }));

const deleteMutaions: GQLSkylarkSchemaQueriesMutations["__schema"]["mutationType"]["fields"] =
  SKYLARK_OBJECT_TYPES_FIXTURE.map((objectType) => ({
    name: `delete${objectType}`,
    args: [],
  }));

export const GQLSkylarkSchemaQueryFixture: {
  data: GQLSkylarkSchemaQueriesMutations;
} = {
  data: {
    __schema: {
      queryType: {
        name: "Query",
        fields: [...getQueries, ...listQueries],
      },
      mutationType: {
        name: "Mutation",
        fields: [...createMutations, ...updateMutations, ...deleteMutaions],
      },
    },
  },
};
