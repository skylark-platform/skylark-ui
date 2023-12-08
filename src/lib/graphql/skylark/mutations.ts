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

export const EDIT_FIELD_CONFIGURATION = gql`
mutation ${wrapQueryName(
  "EDIT_FIELD_CONFIGURATION",
)}($version: Int, $objectType: ObjectTypes!, $fields: [EditFieldInput]!) {
  editFieldConfiguration(
    fields: $fields
    object_class: $objectType
    version: $version
  ) {
    messages
    version
  }
}
`;
