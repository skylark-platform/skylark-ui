import gql from "graphql-tag";

import { wrapQueryName } from "./dynamicQueries";

export const UPDATE_OBJECT_TYPE_CONFIG = gql`
  mutation ${wrapQueryName("UPDATE_OBJECT_TYPE_CONFIG")}(
    $objectType: VisibleObjectTypes!
    $displayName: String
    $primaryField: String
    $colour: String
    $fieldConfig: [FieldConfigInput]
  ) {
    setObjectTypeConfiguration(
      object_type: $objectType
      object_type_config: {
        display_name: $displayName
        primary_field: $primaryField
        colour: $colour
        field_config: $fieldConfig
      }
    ) {
      display_name
      primary_field
      colour
      field_config {
        name
        ui_field_type
        ui_position
      }
    }
  }
`;

export const BATCH_DELETE = gql`
  mutation ${wrapQueryName("BATCH_DELETE")}($objects: [DeleteInput]) {
    batchDeleteObjects(objects: $objects) {
      language
      removed_relationships
      message
      task_id
    }
  }
`;

export const CREATE_API_KEY = gql`
  mutation ${wrapQueryName("CREATE_API_KEY")}($apiKey: APIKeyInput!) {
    createApiKey(api_key: $apiKey) {
      name
      active
      api_key
      expires
      permissions
    }
  }
`;

export const UPDATE_API_KEY = gql`
  mutation ${wrapQueryName("UPDATE_API_KEY")}($name: String!, $apiKey: APIKeyInputUpdate!) {
    updateApiKey(name: $name, api_key: $apiKey) {
      name
      active
      api_key
      expires
      permissions
    }
  }
`;

export const DELETE_API_KEY = gql`
  mutation ${wrapQueryName("DELETE_API_KEY")}($name: String!) {
    deleteApiKey(name: $name)
  }
`;

export const PURGE_CACHE_ALL = gql`
  mutation ${wrapQueryName("PURGE_CACHE_ALL")} {
    purgeCache(all: true) {
      type
      uids
    }
  }
`;

export const PURGE_CACHE_OBJECT_TYPE = gql`
  mutation ${wrapQueryName("PURGE_CACHE_OBJECT_TYPE")}($objectType: ObjectTypes!, $uids: [String]) {
    purgeCache(all: false, type: { name: $objectType, uids: $uids }) {
      type
      uids
    }
  }
`;

export const CREATE_SCHEMA_VERSION = gql`
  mutation ${wrapQueryName("CREATE_SCHEMA_VERSION")}($basedOnVersion: Int!) {
  createSchemaVersion(based_on: $basedOnVersion) {
    active
    base_version
    published
    version
  }
}
`;
