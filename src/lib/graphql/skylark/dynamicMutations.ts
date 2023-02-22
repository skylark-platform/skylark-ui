import { gql } from "@apollo/client";
import { jsonToGraphQLQuery, VariableType } from "json-to-graphql-query";

import {
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
  orderedContentObjects: ParsedSkylarkObjectContent["objects"],
) => {
  if (
    !object ||
    !object.operations.update ||
    orderedContentObjects.length === 0
  ) {
    return null;
  }

  console.log("vefore crashhhh ==", orderedContentObjects);

  const setContent = orderedContentObjects.reduce(
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
