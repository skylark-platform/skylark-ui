import { gql } from "@apollo/client";

export const GET_SKYLARK_SCHEMA = gql`
  query {
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

// The "ObjectTypes" enum is built in and updated each time an object is added or removed from Skylark
export const GET_SKYLARK_OBJECT_TYPES = gql`
  query {
    __type(name: "ObjectTypes") {
      enumValues {
        name
      }
    }
  }
`;
