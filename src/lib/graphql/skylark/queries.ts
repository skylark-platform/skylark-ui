import { getIntrospectionQuery } from "graphql";
import { gql } from "graphql-tag";

import { wrapQueryName } from "./dynamicQueries";

export const SKYLARK_SCHEMA_INTROSPECTION_QUERY_NAME = "IntrospectionQuery";
export const SKYLARK_SCHEMA_INTROSPECTION_QUERY = getIntrospectionQuery();

// The "ObjectTypes" enum is updated when an object is added or removed from Skylark
// This is used to check the user is connected to Skylark + in tests
export const GET_SKYLARK_OBJECT_TYPES = gql`
  query ${wrapQueryName("GET_SKYLARK_OBJECT_TYPES")} {
    __type(name: "Metadata") {
      possibleTypes {
        name
      }
    }
  }
`;

export const LIST_AVAILABILITY_DIMENSIONS = gql`
  query ${wrapQueryName("LIST_AVAILABILITY_DIMENSIONS")}($nextToken: String) {
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
  query ${wrapQueryName(
    "GET_AVAILABILITY_DIMENSIONS",
  )}($uid: String!, $nextToken: String) {
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

export const GET_USER_AND_ACCOUNT = gql`
  query ${wrapQueryName("GET_USER_AND_ACCOUNT")} {
    getUser {
      account
      role
      permissions
    }
    getAccount {
      config {
        default_language
      }
      account_id
      skylark_version
    }
  }
`;

export const GET_ACCOUNT_STATUS = gql`
  fragment listSkylarkBackgroundTaskFields on SkylarkBackgroundTaskListing {
    next_token
    objects {
      created_at
      messages
      object_uid
      status
      task_type
      task_id
      updated_at
    }
  }

  query ${wrapQueryName("GET_ACCOUNT_STATUS")}(
    $queuedNextToken: String
    $inProgressNextToken: String
    $failedNextToken: String
    $backgroundTaskLimit: Int = 10
  ) {
    getActivationStatus {
      active_version
      update_in_progress
      update_started_at
    }
    queuedBackgroundTasks: listSkylarkBackgroundTask(
      next_token: $queuedNextToken
      limit: $backgroundTaskLimit
      status: QUEUED
    ) {
      ...listSkylarkBackgroundTaskFields
    }
    inProgressBackgroundTasks: listSkylarkBackgroundTask(
      next_token: $inProgressNextToken
      limit: $backgroundTaskLimit
      status: IN_PROGRESS
    ) {
      ...listSkylarkBackgroundTaskFields
    }
    failedBackgroundTasks: listSkylarkBackgroundTask(
      next_token: $failedNextToken
      limit: $backgroundTaskLimit
      status: FAILED
    ) {
      ...listSkylarkBackgroundTaskFields
    }
  }
`;

export const LIST_SCHEMA_VERSIONS = gql`
  query ${wrapQueryName("LIST_SCHEMA_VERSIONS")} {
    listConfigurationVersions {
      objects {
        active
        base_version
        published
        version
      }
    }
  }
`;

export const LIST_OBJECT_TYPE_RELATIONSHIP_CONFIGURATION = gql`
  query ${wrapQueryName(
    "LIST_OBJECT_TYPE_RELATIONSHIP_CONFIGURATION",
  )}($objectType: ObjectTypes!) {
    listRelationshipConfiguration(object_type: $objectType) {
      relationship_name
      config {
        default_sort_field
        inherit_availability
      }
    }
  }
`;

export const GET_CONFIGURATION_SCHEMA = gql`
query ${wrapQueryName(
  "GET_CONFIGURATION_SCHEMA",
)}($version: Int!, $query: String!) {
  getConfigurationSchema(version: $version, query: $query)
}
`;
