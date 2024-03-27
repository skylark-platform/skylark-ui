import {
  InfiniteData,
  QueryKey,
  useInfiniteQuery,
} from "@tanstack/react-query";
import { DocumentNode } from "graphql";
import { useMemo } from "react";

import { QueryKeys } from "src/enums/graphql";
import {
  GQLSkylarkListAvailabilityDimensionValuesResponse,
  ParsedSkylarkDimensionsWithValues,
  SkylarkGraphQLAvailabilityDimensionWithValues,
} from "src/interfaces/skylark";
import { skylarkRequest } from "src/lib/graphql/skylark/client";
import {
  createGetAvailabilityDimensionValues,
  createGetAvailabilityDimensionValuesQueryAlias,
} from "src/lib/graphql/skylark/dynamicQueries";
import { hasProperty } from "src/lib/utils";

import { useAvailabilityDimensions } from "./useAvailabilityDimensions";

const getNextPageParam = (
  lastPage: GQLSkylarkListAvailabilityDimensionValuesResponse,
): Record<string, string> | undefined => {
  const entries = Object.values(lastPage);

  const entriesWithNextToken = entries.filter(
    (entry) => !!entry.values.next_token,
  );

  const nextTokens = entriesWithNextToken.reduce(
    (acc, { uid, values }) => ({
      ...acc,
      [uid]: values.next_token,
    }),
    {},
  );

  return entriesWithNextToken.length > 0 ? nextTokens : undefined;
};

export const useAvailabilityDimensionsWithValues = (opts?: {
  enabled?: boolean;
}) => {
  const {
    dimensions: dimensionsWithoutValues,
    isLoading: isLoadingDimensions,
  } = useAvailabilityDimensions({ enabled: opts?.enabled });

  const hasDimensions = Boolean(
    dimensionsWithoutValues && dimensionsWithoutValues.length > 0,
  );

  const { data, fetchNextPage, hasNextPage, isLoading } = useInfiniteQuery<
    GQLSkylarkListAvailabilityDimensionValuesResponse,
    Error,
    InfiniteData<GQLSkylarkListAvailabilityDimensionValuesResponse>,
    QueryKey,
    Record<string, string>
  >({
    queryKey: [QueryKeys.AvailabilityDimensions, dimensionsWithoutValues],
    queryFn: async ({ pageParam: nextTokens }) => {
      const query = createGetAvailabilityDimensionValues(
        dimensionsWithoutValues,
        nextTokens,
      );
      return skylarkRequest("query", query as DocumentNode);
    },
    initialPageParam: {},
    getNextPageParam,
    enabled: hasDimensions && (opts?.enabled || opts?.enabled === undefined),
  });

  // This if statement ensures that all data is fetched
  if (hasNextPage) {
    void fetchNextPage();
  }

  const dimensionsWithValues = useMemo(():
    | ParsedSkylarkDimensionsWithValues[]
    | undefined => {
    if (!dimensionsWithoutValues) {
      return undefined;
    }

    if (data && !hasNextPage) {
      return dimensionsWithoutValues.map(
        (dimension): ParsedSkylarkDimensionsWithValues => {
          const dimensionValuePages = data.pages.map((page) => {
            const queryAlias =
              createGetAvailabilityDimensionValuesQueryAlias(dimension);
            return (
              hasProperty(page, queryAlias) &&
              (page[
                queryAlias
              ] as SkylarkGraphQLAvailabilityDimensionWithValues)
            );
          });

          const flattenedValues = dimensionValuePages
            .flatMap((page) => (page ? page.values.objects : undefined))
            .filter(
              (item): item is SkylarkGraphQLAvailabilityDimensionWithValues =>
                !!item,
            );

          return {
            ...dimension,
            values: flattenedValues,
          };
        },
      );
    }

    return dimensionsWithoutValues.map((dimension) => {
      return {
        ...dimension,
        values: [],
      };
    });
  }, [data, dimensionsWithoutValues, hasNextPage]);

  return {
    dimensions: dimensionsWithValues,
    isLoading: isLoadingDimensions || (hasDimensions && isLoading),
  };
};
