import { gql } from "@apollo/client";

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
    __type(name: "ObjectTypes") {
      enumValues {
        name
      }
    }
  }
`;

// The "Searchable" union is updated when an object is added or removed from Skylark
export const GET_SEARCHABLE_OBJECTS = gql`
  query GET_SEARCHABLE_OBJECTS {
    __type(name: "Searchable") {
      name
      possibleTypes {
        name
      }
    }
  }
`;
