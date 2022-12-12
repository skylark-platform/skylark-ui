import { GQLSkylarkSchemaQueriesMutations } from "src/interfaces/graphql/introspection";

export const GQLSkylarkObjectTypesQueryFixture = {
  data: {
    __type: {
      enumValues: [
        {
          name: "Episode",
        },
        {
          name: "Brand",
        },
        {
          name: "Season",
        },
      ],
    },
  },
};

export const GQLSkylarkSchemaQueryFixture: {
  data: GQLSkylarkSchemaQueriesMutations;
} = {
  data: {
    __schema: {
      queryType: {
        name: "Query",
        fields: [
          {
            name: "getEpisode",
            type: {
              name: "Episode",
              fields: [
                {
                  name: "title",
                  type: {
                    __typename: "",
                    name: "String",
                    kind: "SCALAR",
                    ofType: null,
                    enumValues: null,
                    fields: [],
                    inputFields: [],
                  },
                },
              ],
            },
          },
          {
            name: "listEpisode",
            type: {
              name: "Episode",
              fields: [],
            },
          },
        ],
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
