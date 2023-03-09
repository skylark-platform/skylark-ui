import { getIntrospectionQuery } from "graphql";
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

export const SKYLARK_SCHEMA_INTROSPECTION_QUERY_NAME = "IntrospectionQuery";
export const SKYLARK_SCHEMA_INTROSPECTION_QUERY = getIntrospectionQuery();

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

const x = gql`
  mutation createEpisode {
    createEpisode(
      episode: {
        title: "Loads of availability"
        availability: {
          create: [
            {
              start: "2022-01-01T00:00:00+00:00"
              end: "2038-01-19T03:14:07+00:00"
              title: "Test Availability 3331"
              slug: "test-3331"
            }
            {
              start: "2022-01-01T00:00:00+00:00"
              end: "2038-01-19T03:14:07+00:00"
              title: "Test Availability 1"
              slug: "test-1"
            }
            {
              start: "2022-01-01T00:00:00+00:00"
              end: "2038-01-19T03:14:07+00:00"
              title: "Test Availability 3332"
              slug: "test-3332"
            }
            {
              start: "2022-01-01T00:00:00+00:00"
              end: "2038-01-19T03:14:07+00:00"
              title: "Test Availability 2"
              slug: "test-2"
            }
            {
              start: "2022-01-01T00:00:00+00:00"
              end: "2038-01-19T03:14:07+00:00"
              title: "Test Availability 3333"
              slug: "test-3333"
            }
            {
              start: "2022-01-01T00:00:00+00:00"
              end: "2038-01-19T03:14:07+00:00"
              title: "Test Availability 3"
              slug: "test-3"
            }
            {
              start: "2022-01-01T00:00:00+00:00"
              end: "2038-01-19T03:14:07+00:00"
              title: "Test Availability 3334"
              slug: "test-3334"
            }
            {
              start: "2022-01-01T00:00:00+00:00"
              end: "2038-01-19T03:14:07+00:00"
              title: "Test Availability 4"
              slug: "test-4"
            }
            {
              start: "2022-01-01T00:00:00+00:00"
              end: "2038-01-19T03:14:07+00:00"
              title: "Test Availability 3335"
              slug: "test-3335"
            }
            {
              start: "2022-01-01T00:00:00+00:00"
              end: "2038-01-19T03:14:07+00:00"
              title: "Test Availability 5"
              slug: "test-5"
            }
            {
              start: "2022-01-01T00:00:00+00:00"
              end: "2038-01-19T03:14:07+00:00"
              title: "Test Availability 3336"
              slug: "test-3336"
            }
            {
              start: "2022-01-01T00:00:00+00:00"
              end: "2038-01-19T03:14:07+00:00"
              title: "Test Availability 6"
              slug: "test-6"
            }
            {
              start: "2022-01-01T00:00:00+00:00"
              end: "2038-01-19T03:14:07+00:00"
              title: "Test Availability 3337"
              slug: "test-3337"
            }
            {
              start: "2022-01-01T00:00:00+00:00"
              end: "2038-01-19T03:14:07+00:00"
              title: "Test Availability 7"
              slug: "test-7"
            }
            {
              start: "2022-01-01T00:00:00+00:00"
              end: "2038-01-19T03:14:07+00:00"
              title: "Test Availability 3338"
              slug: "test-3338"
            }
            {
              start: "2022-01-01T00:00:00+00:00"
              end: "2038-01-19T03:14:07+00:00"
              title: "Test Availability 8"
              slug: "test-8"
            }
            {
              start: "2022-01-01T00:00:00+00:00"
              end: "2038-01-19T03:14:07+00:00"
              title: "Test Availability 3339"
              slug: "test-3339"
            }
            {
              start: "2022-01-01T00:00:00+00:00"
              end: "2038-01-19T03:14:07+00:00"
              title: "Test Availability 9"
              slug: "test-9"
            }
            {
              start: "2022-01-01T00:00:00+00:00"
              end: "2038-01-19T03:14:07+00:00"
              title: "Test Availability 33310"
              slug: "test-33310"
            }
            {
              start: "2022-01-01T00:00:00+00:00"
              end: "2038-01-19T03:14:07+00:00"
              title: "Test Availability 10"
              slug: "test-10"
            }
            {
              start: "2022-01-01T00:00:00+00:00"
              end: "2038-01-19T03:14:07+00:00"
              title: "Test Availability 33311"
              slug: "test-33311"
            }
            {
              start: "2022-01-01T00:00:00+00:00"
              end: "2038-01-19T03:14:07+00:00"
              title: "Test Availability 11"
              slug: "test-11"
            }
            {
              start: "2022-01-01T00:00:00+00:00"
              end: "2038-01-19T03:14:07+00:00"
              title: "Test Availability 33312"
              slug: "test-33312"
            }
            {
              start: "2022-01-01T00:00:00+00:00"
              end: "2038-01-19T03:14:07+00:00"
              title: "Test Availability 12"
              slug: "test-12"
            }
            {
              start: "2022-01-01T00:00:00+00:00"
              end: "2038-01-19T03:14:07+00:00"
              title: "Test Availability 33313"
              slug: "test-33313"
            }
            {
              start: "2022-01-01T00:00:00+00:00"
              end: "2038-01-19T03:14:07+00:00"
              title: "Test Availability 13"
              slug: "test-13"
            }
            {
              start: "2022-01-01T00:00:00+00:00"
              end: "2038-01-19T03:14:07+00:00"
              title: "Test Availability 33314"
              slug: "test-33314"
            }
            {
              start: "2022-01-01T00:00:00+00:00"
              end: "2038-01-19T03:14:07+00:00"
              title: "Test Availability 14"
              slug: "test-14"
            }
            {
              start: "2022-01-01T00:00:00+00:00"
              end: "2038-01-19T03:14:07+00:00"
              title: "Test Availability 33315"
              slug: "test-33315"
            }
            {
              start: "2022-01-01T00:00:00+00:00"
              end: "2038-01-19T03:14:07+00:00"
              title: "Test Availability 15"
              slug: "test-15"
            }
            {
              start: "2022-01-01T00:00:00+00:00"
              end: "2038-01-19T03:14:07+00:00"
              title: "Test Availability 33316"
              slug: "test-33316"
            }
            {
              start: "2022-01-01T00:00:00+00:00"
              end: "2038-01-19T03:14:07+00:00"
              title: "Test Availability 16"
              slug: "test-16"
            }
            {
              start: "2022-01-01T00:00:00+00:00"
              end: "2038-01-19T03:14:07+00:00"
              title: "Test Availability 33317"
              slug: "test-33317"
            }
            {
              start: "2022-01-01T00:00:00+00:00"
              end: "2038-01-19T03:14:07+00:00"
              title: "Test Availability 17"
              slug: "test-17"
            }
            {
              start: "2022-01-01T00:00:00+00:00"
              end: "2038-01-19T03:14:07+00:00"
              title: "Test Availability 33318"
              slug: "test-33318"
            }
            {
              start: "2022-01-01T00:00:00+00:00"
              end: "2038-01-19T03:14:07+00:00"
              title: "Test Availability 18"
              slug: "test-18"
            }
            {
              start: "2022-01-01T00:00:00+00:00"
              end: "2038-01-19T03:14:07+00:00"
              title: "Test Availability 33319"
              slug: "test-33319"
            }
            {
              start: "2022-01-01T00:00:00+00:00"
              end: "2038-01-19T03:14:07+00:00"
              title: "Test Availability 19"
              slug: "test-19"
            }
            {
              start: "2022-01-01T00:00:00+00:00"
              end: "2038-01-19T03:14:07+00:00"
              title: "Test Availability 33320"
              slug: "test-33320"
            }
            {
              start: "2022-01-01T00:00:00+00:00"
              end: "2038-01-19T03:14:07+00:00"
              title: "Test Availability 20"
              slug: "test-20"
            }
          ]
        }
      }
    ) {
      uid
    }
  }
`;
