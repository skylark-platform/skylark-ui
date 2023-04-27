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

export const LIST_AVAILABILITY_DIMENSION_VALUES = gql`
  query LIST_AVAILABILITY_DIMENSION_VALUES($uid: String!, $nextToken: String) {
    getDimension(dimension_id: $uid) {
      uid
      values(next_token: $nextToken, limit: 50) {
        objects {
          description
          external_id
          slug
          title
          uid
        }
        next_token
      }
    }
  }
`;
