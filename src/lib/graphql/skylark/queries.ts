import { getIntrospectionQuery } from "graphql";
import { gql } from "graphql-tag";

export const SKYLARK_SCHEMA_INTROSPECTION_QUERY_NAME = "IntrospectionQuery";
export const SKYLARK_SCHEMA_INTROSPECTION_QUERY = getIntrospectionQuery();

// The "ObjectTypes" enum is updated when an object is added or removed from Skylark
// This is used to check the user is connected to Skylark + in tests
export const GET_SKYLARK_OBJECT_TYPES = gql`
  query GET_SKYLARK_OBJECT_TYPES {
    __type(name: "Metadata") {
      possibleTypes {
        name
      }
    }
  }
`;

export const LIST_AVAILABILITY_DIMENSIONS = gql`
  query LIST_AVAILABILITY_DIMENSIONS($nextToken: String) {
    listDimensions(next_token: $nextToken, limit: 50) {
      objects {
        uid
        external_id
        title
        slug
        description
      }
      count
      next_token
    }
  }
`;

export const GET_AVAILABILITY_DIMENSIONS = gql`
  query GET_AVAILABILITY_DIMENSIONS($uid: String!, $nextToken: String) {
    getAvailability(uid: $uid) {
      title
      dimensions(limit: 50, next_token: $nextToken) {
        next_token
        objects {
          uid
          title
          slug
          values(limit: 50) {
            objects {
              uid
              title
              slug
            }
          }
        }
      }
    }
  }
`;
