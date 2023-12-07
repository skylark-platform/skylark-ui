import gql from "graphql-tag";
import { EnumType } from "json-to-graphql-query";

import {
  ParsedSkylarkObjectTypeRelationshipConfiguration,
  SkylarkObjectType,
} from "src/interfaces/skylark";
import { wrappedJsonMutation } from "src/lib/graphql/skylark/dynamicQueries";

export const createUpdateRelationshipConfigMutation = (
  objectType: SkylarkObjectType,
  relationshipConfig: ParsedSkylarkObjectTypeRelationshipConfiguration,
) => {
  const relationshipConfigUpdates = Object.entries(relationshipConfig).reduce(
    (prev, [relationshipName, config]) => {
      return {
        ...prev,
        [`${objectType}_${relationshipName}`]: {
          __aliasFor: "setRelationshipConfiguration",
          __args: {
            object: new EnumType(objectType),
            relationship_config: {
              default_sort_field: config.defaultSortField,
            },
            relationship_name: relationshipName,
          },
          default_sort_field: true,
        },
      };
    },
    {},
  );

  const mutation = {
    mutation: {
      __name: `UPDATE_RELATIONSHIP_CONFIG_${objectType}`,
      ...relationshipConfigUpdates,
    },
  };

  const graphQLQuery = wrappedJsonMutation(mutation);

  return gql(graphQLQuery);
};
