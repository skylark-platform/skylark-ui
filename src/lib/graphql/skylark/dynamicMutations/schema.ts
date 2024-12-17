import gql from "graphql-tag";
import { EnumType } from "json-to-graphql-query";

import {
  GQLObjectTypeRelationshipConfig,
  ParsedSkylarkObjectTypeRelationshipConfigurations,
  SkylarkObjectType,
} from "src/interfaces/skylark";
import { wrappedJsonMutation } from "src/lib/graphql/skylark/dynamicQueries";

export const createUpdateRelationshipConfigMutation = (
  objectType: SkylarkObjectType,
  relationshipConfig: ParsedSkylarkObjectTypeRelationshipConfigurations,
) => {
  const relationshipConfigUpdates = Object.entries(relationshipConfig).reduce(
    (prev, [relationshipName, config]) => {
      const relationship_config: GQLObjectTypeRelationshipConfig = {
        default_sort_field: config.defaultSortField || null,
        inherit_availability: config.inheritAvailability || false,
      };

      return {
        ...prev,
        [`${objectType}_${relationshipName}`]: {
          __aliasFor: "setRelationshipConfiguration",
          __args: {
            object: new EnumType(objectType),
            relationship_name: relationshipName,
            relationship_config,
          },
          default_sort_field: true,
          inherit_availability: true,
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
