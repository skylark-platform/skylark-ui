import { useQuery } from "@tanstack/react-query";
import { DocumentNode } from "graphql";
import { useMemo } from "react";

import { QueryKeys } from "src/enums/graphql";
import {
  BuiltInSkylarkObjectType,
  GQLObjectTypeRelationshipConfig,
  GQLSkylarkErrorResponse,
  GQLSkylarkListAllObjectTypesRelationshipConfiguration,
  GQLSkylarkListObjectTypeRelationshipConfiguration,
  ParsedSkylarkObjectTypeRelationshipConfiguration,
  ParsedSkylarkObjectTypeRelationshipConfigurations,
  ParsedSkylarkObjectTypesRelationshipConfigurations,
  SkylarkObjectType,
} from "src/interfaces/skylark";
import { skylarkRequest } from "src/lib/graphql/skylark/client";
import { createGetAllObjectsRelationshipConfigurationQuery } from "src/lib/graphql/skylark/dynamicQueries";
import { LIST_OBJECT_TYPE_RELATIONSHIP_CONFIGURATION } from "src/lib/graphql/skylark/queries";
import { isAvailabilityOrAudienceSegment } from "src/lib/utils";

import { useSkylarkObjectTypes } from "./useSkylarkObjectTypes";

const reducer = (
  prev: ParsedSkylarkObjectTypeRelationshipConfigurations,
  {
    relationship_name,
    config,
  }: {
    uid: string;
    relationship_name: string;
    config: GQLObjectTypeRelationshipConfig;
  },
): ParsedSkylarkObjectTypeRelationshipConfigurations => {
  const parsedConfig: ParsedSkylarkObjectTypeRelationshipConfiguration = {
    defaultSortField: config.default_sort_field || null,
    inheritAvailability: config.inherit_availability || false,
  };

  return {
    ...prev,
    [relationship_name]: parsedConfig,
  };
};

const select = (
  data: GQLSkylarkListObjectTypeRelationshipConfiguration,
): ParsedSkylarkObjectTypeRelationshipConfigurations =>
  data.listRelationshipConfiguration.objects.reduce(reducer, {});

const allObjectTypesSelect = (
  data: GQLSkylarkListAllObjectTypesRelationshipConfiguration,
): ParsedSkylarkObjectTypesRelationshipConfigurations =>
  Object.entries(data).reduce(
    (prev, [objectType, relationshipConfiguration]) => {
      return {
        ...prev,
        [objectType]:
          relationshipConfiguration?.objects.reduce(reducer, {}) || {},
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
      objectType && !isAvailabilityOrAudienceSegment(objectType),
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

  console.log({ allObjectTypesRelationshipConfig });

  return {
    allObjectTypesRelationshipConfig,
    isLoading,
  };
};
