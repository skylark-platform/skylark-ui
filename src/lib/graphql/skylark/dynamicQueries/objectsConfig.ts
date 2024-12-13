import gql from "graphql-tag";
import { EnumType } from "json-to-graphql-query";

import { MAX_GRAPHQL_LIMIT } from "src/constants/skylark";
import { SkylarkObjectType } from "src/interfaces/skylark";

import { getObjectConfigFields, wrappedJsonQuery } from "./utils";

export const createGetAllObjectsConfigQuery = (
  objectTypes?: SkylarkObjectType[],
) => {
  if (!objectTypes || objectTypes.length === 0) {
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

  const graphQLQuery = wrappedJsonQuery(query);

  return gql(graphQLQuery);
};

export const createGetAllObjectsRelationshipConfigurationQuery = (
  objectTypes?: SkylarkObjectType[],
) => {
  if (!objectTypes) {
    return null;
  }

  const query = {
    query: {
      __name: "LIST_ALL_OBJECT_TYPES_RELATIONSHIP_CONFIGURATION",
      ...objectTypes.reduce((acc, objectType) => {
        return {
          ...acc,
          [objectType]: {
            __aliasFor: "listRelationshipConfiguration",
            __args: {
              object_type: new EnumType(objectType),
              default: true,
              limit: MAX_GRAPHQL_LIMIT,
            },
            count: true,
            next_token: true,
            objects: {
              uid: true,
              relationship_name: true,
              config: {
                default_sort_field: true,
                inherit_availability: true,
              },
            },
          },
        };
      }, {}),
    },
  };

  const graphQLQuery = wrappedJsonQuery(query);

  return gql(graphQLQuery);
};
