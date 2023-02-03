// mutation {
//   updateSet(
//     uid: "48d1e078-4ec0-47df-afd9-7a993e4d822b"
//     set: {
//       content: {
//         Episode: {
//           reposition: [
//             { uid: "1c379e29-27f0-446e-8dcc-4c7e54ea772f", position: 1 }
//             { uid: "2bcac925-3d9d-4f27-a361-d93b8d395d40", position: 2 }
//           ]
//         }
//       }
//     }
//   ) {
//     uid
//   }
// }
import { gql } from "@apollo/client";
import { jsonToGraphQLQuery, VariableType } from "json-to-graphql-query";

import {
  ParsedSkylarkObject,
  ParsedSkylarkObjectContent,
  SkylarkObjectMeta,
} from "src/interfaces/skylark";

export const createDeleteObjectMutation = (
  object: SkylarkObjectMeta | null,
) => {
  if (!object || !object.operations.delete) {
    return null;
  }

  const mutation = {
    mutation: {
      __name: `DELETE_${object.name}`,
      __variables: {
        uid: "String!",
      },
      deleteObject: {
        __aliasFor: object.operations.delete.name,
        __args: {
          uid: new VariableType("uid"),
        },
        uid: true,
      },
    },
  };

  const graphQLQuery = jsonToGraphQLQuery(mutation);

  return gql(graphQLQuery);
};

export const createUpdateSetContentPositionMutation = (
  object: SkylarkObjectMeta | null,
  content: ParsedSkylarkObjectContent["objects"],
) => {
  if (!object || !object.operations.update || content.length === 0) {
    return null;
  }

  const setContent = content.reduce(
    (prev, { objectType, object: { uid } }, index) => {
      const position = index + 1;

      if (prev[objectType]) {
        return {
          ...prev,
          [objectType]: {
            reposition: [...prev[objectType].reposition, { uid, position }],
          },
        };
      }

      return {
        ...prev,
        [objectType]: {
          reposition: [{ uid, position }],
        },
      };
    },
    {} as Record<string, { reposition: { uid: string; position: number }[] }>,
  );

  const mutation = {
    mutation: {
      __name: `UPDATE_OBJECT_CONTENT_${object.name}`,
      __variables: {
        uid: "String!",
      },
      updateObjectContentPositioning: {
        __aliasFor: object.operations.update.name,
        __args: {
          uid: new VariableType("uid"),
          [object.operations.update.argName]: {
            content: setContent,
          },
        },
        uid: true,
      },
    },
  };

  const graphQLQuery = jsonToGraphQLQuery(mutation);

  return gql(graphQLQuery);
};
