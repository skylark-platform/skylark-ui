import gql from "graphql-tag";

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
