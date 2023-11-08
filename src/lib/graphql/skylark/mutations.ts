import gql from "graphql-tag";

export const UPDATE_OBJECT_TYPE_CONFIG = gql`
  mutation UPDATE_OBJECT_TYPE_CONFIG(
    $objectType: VisibleObjectTypes!
    $objectTypeConfig: ObjectConfigInput!
  ) {
    setObjectTypeConfiguration(
      object_type: $objectType
      object_type_config: $objectTypeConfig
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
  mutation BATCH_DELETE($objects: [DeleteInput]) {
    batchDeleteObjects(objects: $objects) {
      language
      removed_relationships
      message
      task_id
    }
  }
`;
