import {
  GQLSkylarkSchemaQueriesMutations,
  GQLSkylarkSearchableObjectsUnionResponse,
} from "src/interfaces/graphql/introspection";

export const SKYLARK_OBJECT_FIELDS_FIXTURE = [
  "uid",
  "title",
  "title_short",
  "title_long",
  "synopsis_short",
  "synopsis_long",
];

export const SKYLARK_OBJECT_TYPES_FIXTURE = [
  "Brand",
  "Season",
  "Episode",
  "Movie",
  "Theme",
  "Genre",
];

export const GQLSkylarkObjectTypesQueryFixture = {
  data: {
    __type: {
      enumValues: SKYLARK_OBJECT_TYPES_FIXTURE.map((name) => ({ name })),
    },
  },
};

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
        fields: [
          {
            name: "createEpisode",
            args: [
              {
                name: "episode",
                type: {
                  __typename: "episode",
                  kind: "INPUT_OBJECT",
                  enumValues: null,
                  name: "EpisodeCreateInput",
                  fields: [],
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
                  ofType: null,
                },
              },
            ],
          },
          {
            name: "updateEpisode",
            args: [],
          },
          {
            name: "deleteEpisode",
            args: [],
          },
        ],
      },
    },
  },
};

export const GQLSkylarkSearchableObjectsQueryFixture: GQLSkylarkSearchableObjectsUnionResponse =
  {
    __type: {
      name: "Searchable",
      possibleTypes: SKYLARK_OBJECT_TYPES_FIXTURE.map((name) => ({ name })),
    },
  } as GQLSkylarkSearchableObjectsUnionResponse;
