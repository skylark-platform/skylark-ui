import { gql } from "@apollo/client";

export const GET_SKYLARK_SCHEMA = gql`
  {
    __schema {
      mutationType {
        name
        fields {
          name
          type {
            name
            kind
            description
            fields {
              name
            }
          }
          args {
            name
            defaultValue
            type {
              name
              kind
              description
              inputFields {
                name
                type {
                  name
                  kind
                  description
                  enumValues {
                    name
                  }
                  ofType {
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
`;

export const GET_SKYLARK_OBJECT_INPUT_FIELDS = gql`
  query ($objectTypeInput: String!) {
    __type(name: $objectTypeInput) {
      name
      kind
      description
      inputFields {
        name
        type {
          name
          kind
          description
          enumValues {
            name
          }
          ofType {
            name
            kind
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
