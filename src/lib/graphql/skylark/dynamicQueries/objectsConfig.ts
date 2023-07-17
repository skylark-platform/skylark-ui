import gql from "graphql-tag";
import { EnumType, jsonToGraphQLQuery } from "json-to-graphql-query";

import { SkylarkObjectType } from "src/interfaces/skylark";

import { getObjectConfigFields } from "./utils";

export const createGetAllObjectsConfigQuery = (
  objectTypes?: SkylarkObjectType[],
) => {
  if (!objectTypes) {
    return null;
  }

  const query = {
    query: {
      __name: "GET_OBJECTS_CONFIG",
      ...objectTypes.reduce((acc, objectType) => {
        return {
          ...acc,
          [objectType]: {
            __aliasFor: "getObjectConfiguration",
            __args: {
              object: new EnumType(objectType),
            },
            ...getObjectConfigFields(true)._config,
          },
        };
      }, {}),
    },
  };

  const graphQLQuery = jsonToGraphQLQuery(query, { pretty: true });

  return gql(graphQLQuery);
};
