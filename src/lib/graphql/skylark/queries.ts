import { gql } from "graphql-tag";

export const GET_SKYLARK_SCHEMA = gql`
  query GET_SKYLARK_SCHEMA {
    __schema {
      queryType {
        name
        fields {
          name
          type {
            name
            fields {
              name
              type {
                name
                kind
                ofType {
                  name
                  kind
                }
              }
            }
          }
        }
      }
      mutationType {
        name
        fields {
          name
          args {
            name
            type {
              name
              kind
              inputFields {
                name
                type {
                  name
                  kind
                  enumValues {
                    name
                  }
                  ofType {
                    name
                    kind
                  }
                  inputFields {
                    name
                    type {
                      name
                      kind
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  }
`;

// The "ObjectTypes" enum is updated when an object is added or removed from Skylark
export const GET_SKYLARK_OBJECT_TYPES = gql`
  query GET_SKYLARK_OBJECT_TYPES {
    __type(name: "Metadata") {
      possibleTypes {
        name
      }
    }
  }
`;

// Retrieve global and language fields for an object so the UI can separate them
// For example, for an Episode we would use variables { globalType: "_EpisodeGlobal", languageType: "_EpisodeLanguage" }
export const GET_OBJECT_GLOBAL_LANGUAGE_FIELDS = gql`
  query ($globalType: String!, $languageType: String!) {
    global: __type(name: $globalType) {
      fields {
        name
      }
    }
    language: __type(name: $languageType) {
      fields {
        name
      }
    }
  }
`;
