import { useQuery } from "@tanstack/react-query";
import { DocumentNode } from "graphql";
import { useMemo } from "react";

import { QueryKeys } from "src/enums/graphql";
import {
  BuiltInSkylarkObjectType,
  GQLSkylarkErrorResponse,
  GQLSkylarkListAllObjectTypesRelationshipConfiguration,
  GQLSkylarkListObjectTypeRelationshipConfiguration,
  ParsedSkylarkObjectTypeRelationshipConfigurations,
  ParsedSkylarkObjectTypesRelationshipConfigurations,
  SkylarkObjectType,
} from "src/interfaces/skylark";
import { skylarkRequest } from "src/lib/graphql/skylark/client";
import { createGetAllObjectsRelationshipConfigurationQuery } from "src/lib/graphql/skylark/dynamicQueries";
import { LIST_OBJECT_TYPE_RELATIONSHIP_CONFIGURATION } from "src/lib/graphql/skylark/queries";
import { isAvailabilityOrAvailabilitySegment } from "src/lib/utils";

import { useSkylarkObjectTypes } from "./useSkylarkObjectTypes";

const mapGQLRelationshipConfigToParsed = ({
  relationship_name,
  config,
}: GQLSkylarkListObjectTypeRelationshipConfiguration["listRelationshipConfiguration"]["objects"][0]) => ({
  relationshipName: relationship_name,
  config: {
    defaultSortField: config.default_sort_field,
    inheritAvailability: config.inherit_availability,
  },
});

const select = (
  data: GQLSkylarkListObjectTypeRelationshipConfiguration,
): ParsedSkylarkObjectTypeRelationshipConfigurations =>
  data.listRelationshipConfiguration.objects.reduce(
    (
      prev,
      { relationship_name, config },
    ): ParsedSkylarkObjectTypeRelationshipConfigurations => {
      return {
        ...prev,
        [relationship_name]: {
          defaultSortField: config.default_sort_field || null,
          inheritAvailability: config.inherit_availability || false,
        },
      };
    },
    {},
  );

const allObjectTypesSelect = (
  data: GQLSkylarkListAllObjectTypesRelationshipConfiguration,
): Record<string, ParsedSkylarkObjectTypeRelationshipConfigurations> =>
  Object.entries(data).reduce(
    (prev, [objectType, relationshipConfiguration]) => {
      return {
        ...prev,
        [objectType]:
          relationshipConfiguration?.objects.map(
            mapGQLRelationshipConfigToParsed,
          ) || [],
      };
    },
    {},
  );

export const useObjectTypeRelationshipConfiguration = (
  objectType: SkylarkObjectType | null,
) => {
  const { data, isLoading } = useQuery<
    GQLSkylarkListObjectTypeRelationshipConfiguration,
    GQLSkylarkErrorResponse<GQLSkylarkListObjectTypeRelationshipConfiguration>,
    ParsedSkylarkObjectTypeRelationshipConfigurations
  >({
    enabled: Boolean(
      objectType && !isAvailabilityOrAvailabilitySegment(objectType),
    ),
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
  };
};

export const useAllObjectTypesRelationshipConfiguration = () => {
  const { objectTypes } = useSkylarkObjectTypes({ searchable: false });

  const query = createGetAllObjectsRelationshipConfigurationQuery(
    objectTypes?.filter(
      (str) => str !== BuiltInSkylarkObjectType.SkylarkFavoriteList,
    ),
  );

  const { data, isLoading, error } = useQuery<
    GQLSkylarkListAllObjectTypesRelationshipConfiguration,
    GQLSkylarkErrorResponse<GQLSkylarkListAllObjectTypesRelationshipConfiguration>,
    ParsedSkylarkObjectTypesRelationshipConfigurations
  >({
    enabled: query !== null,
    queryKey: [QueryKeys.ObjectTypeRelationshipConfig, query],
    queryFn: async () => skylarkRequest("query", query as DocumentNode),
    select: allObjectTypesSelect,
  });

  // TODO when an Object Type not having a Config doesn't throw an error, remove this error handling
  const allObjectTypesRelationshipConfig = useMemo(
    () =>
      error?.response.data ? allObjectTypesSelect(error.response.data) : data,
    [data, error?.response.data],
  );

  return {
    allObjectTypesRelationshipConfig,
    isLoading,
  };
};
