import { useInfiniteQuery } from "@tanstack/react-query";
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
  createGetDimensionValueNextTokenVariables,
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

  const variables = createGetDimensionValueNextTokenVariables(
    entriesWithNextToken.map(({ uid, values }) => ({
      dimensionUid: uid,
      value: values.next_token,
    })),
  );

  return entriesWithNextToken.length > 0 ? variables : undefined;
};

export const useAvailabilityDimensionsWithValues = () => {
  const { dimensions: dimensionsWithoutValues } = useAvailabilityDimensions();

  const query = useMemo(
    () => createGetAvailabilityDimensionValues(dimensionsWithoutValues),
    [dimensionsWithoutValues],
  );

  const enabled = !!(dimensionsWithoutValues && query);

  const { data, fetchNextPage, hasNextPage, ...rest } =
    useInfiniteQuery<GQLSkylarkListAvailabilityDimensionValuesResponse>({
      queryKey: [QueryKeys.AvailabilityDimensions, query],
      queryFn: async ({ pageParam: variables }) =>
        skylarkRequest(query as DocumentNode, variables),
      getNextPageParam,
      enabled,
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
          const dimensionValuePages = data.pages.map(
            (page) =>
              hasProperty(page, `dimension_${dimension.uid}`) &&
              (page[
                `dimension_${dimension.uid}`
              ] as SkylarkGraphQLAvailabilityDimensionWithValues),
          );

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
    ...rest,
  };
};
