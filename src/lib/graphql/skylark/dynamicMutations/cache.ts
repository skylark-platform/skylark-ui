import gql from "graphql-tag";
import { EnumType } from "json-to-graphql-query";

import { SkylarkObjectType } from "src/interfaces/skylark";
import { wrappedJsonMutation } from "src/lib/graphql/skylark/dynamicQueries";

export const createPurgeObjectTypesCacheMutation = (
  purgeConfiguration: Record<SkylarkObjectType, string[]>,
) => {
  const relationshipConfigUpdates = Object.entries(purgeConfiguration).reduce(
    (prev, [objectType, uids]) => {
      return {
        ...prev,
        [`PURGE_CACHE_OBJECT_TYPE_${objectType}`]: {
          __aliasFor: "purgeCache",
          __args: {
            all: false,
            type: {
              name: new EnumType(objectType),
              uids,
            },
          },
          type: true,
          uids: true,
        },
      };
    },
    {},
  );

  const mutation = {
    mutation: {
      __name: `PURGE_CACHE_OBJECT_TYPES`,
      ...relationshipConfigUpdates,
    },
  };

  const graphQLQuery = wrappedJsonMutation(mutation);

  return gql(graphQLQuery);
};
