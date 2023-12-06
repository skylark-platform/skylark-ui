import { useQuery } from "@tanstack/react-query";
import { DocumentNode } from "graphql";

import { QueryKeys } from "src/enums/graphql";
import {
  BuiltInSkylarkObjectType,
  GQLSkylarkErrorResponse,
  GQLSkylarkListAllObjectTypesRelationshipConfiguration,
  GQLSkylarkListObjectTypeRelationshipConfiguration,
  ParsedSkylarkObjectTypeRelationshipConfiguration,
  SkylarkObjectType,
} from "src/interfaces/skylark";
import { skylarkRequest } from "src/lib/graphql/skylark/client";
import { createGetAllObjectsRelationshipConfigurationQuery } from "src/lib/graphql/skylark/dynamicQueries";
import { LIST_OBJECT_TYPE_RELATIONSHIP_CONFIGURATION } from "src/lib/graphql/skylark/queries";

import { useSkylarkObjectTypes } from "./useSkylarkObjectTypes";
import { useSkylarkSchemaIntrospection } from "./useSkylarkSchemaIntrospection";

const mapGQLRelationshipConfigToParsed = ({
  relationship_name,
  config,
}: GQLSkylarkListObjectTypeRelationshipConfiguration["listRelationshipConfiguration"][0]) => ({
  relationshipName: relationship_name,
  config: {
    defaultSortField: config.default_sort_field,
    inheritAvailability: config.inherit_availability,
  },
});

const select = (
  data: GQLSkylarkListObjectTypeRelationshipConfiguration,
): ParsedSkylarkObjectTypeRelationshipConfiguration =>
  data.listRelationshipConfiguration.reduce(
    (
      prev,
      { relationship_name, config },
    ): ParsedSkylarkObjectTypeRelationshipConfiguration => {
      return {
        ...prev,
        [relationship_name]: {
          defaultSortField: config.default_sort_field,
          inheritAvailability: config.inherit_availability,
        },
      };
    },
    {},
  );

const allObjectTypesSelect = (
  data: GQLSkylarkListAllObjectTypesRelationshipConfiguration,
): Record<string, ParsedSkylarkObjectTypeRelationshipConfiguration> =>
  Object.entries(data).reduce(
    (prev, [objectType, relationshipConfiguration]) => {
      return {
        ...prev,
        [objectType]: relationshipConfiguration.map(
          mapGQLRelationshipConfigToParsed,
        ),
      };
    },
    {},
  );

export const useObjectTypeRelationshipConfiguration = (
  objectType: SkylarkObjectType | null,
) => {
  const { data: introspection } = useSkylarkSchemaIntrospection();

  // TODO remove this enabled check when the backend PR is merged to production
  const enabled =
    !!introspection?.__schema.types.find(
      (type) => type.name === "RelationshipConfigList",
    ) && !!objectType;

  const { data, isLoading } = useQuery<
    GQLSkylarkListObjectTypeRelationshipConfiguration,
    GQLSkylarkErrorResponse<GQLSkylarkListObjectTypeRelationshipConfiguration>,
    ParsedSkylarkObjectTypeRelationshipConfiguration
  >({
    enabled,
    queryKey: [
      QueryKeys.ObjectTypeRelationshipConfig,
      LIST_OBJECT_TYPE_RELATIONSHIP_CONFIGURATION,
      objectType,
    ],
    queryFn: async () =>
      skylarkRequest("query", LIST_OBJECT_TYPE_RELATIONSHIP_CONFIGURATION, {
        objectType,
      }),
    select,
  });

  return {
    objectTypeRelationshipConfig: data,
    isLoading,
    enabled,
  };
};

export const useAllObjectTypesRelationshipConfiguration = () => {
  const { data: introspection } = useSkylarkSchemaIntrospection();

  // TODO remove this enabled check when the backend PR is merged to production
  const enabled = !!introspection?.__schema.types.find(
    (type) => type.name === "RelationshipConfigList",
  );

  const { objectTypes } = useSkylarkObjectTypes(false);

  const query = createGetAllObjectsRelationshipConfigurationQuery(
    objectTypes?.filter(
      (str) => str !== BuiltInSkylarkObjectType.SkylarkFavoriteList,
    ),
  );

  const { data, isLoading } = useQuery<
    GQLSkylarkListAllObjectTypesRelationshipConfiguration,
    GQLSkylarkErrorResponse<GQLSkylarkListAllObjectTypesRelationshipConfiguration>,
    Record<string, ParsedSkylarkObjectTypeRelationshipConfiguration>
  >({
    enabled: enabled && query !== null,
    queryKey: [QueryKeys.ObjectTypeRelationshipConfig, query],
    queryFn: async () => skylarkRequest("query", query as DocumentNode),
    select: allObjectTypesSelect,
  });

  return {
    objectTypeRelationshipConfig: data,
    isLoading,
    enabled,
  };
};
