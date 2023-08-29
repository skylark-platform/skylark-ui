import { useInfiniteQuery } from "@tanstack/react-query";
import { RequestDocument, Variables } from "graphql-request";
import { useEffect, useMemo } from "react";

import { REQUEST_HEADERS } from "src/constants/skylark";
import { useUser } from "src/contexts/useUser";
import { QueryKeys } from "src/enums/graphql";
import {
  SkylarkGraphQLObject,
  GQLSkylarkSearchResponse,
} from "src/interfaces/skylark";
import { skylarkRequest } from "src/lib/graphql/skylark/client";
import {
  convertAvailabilityDimensionsObjectToGQLDimensions,
  createSearchObjectsQuery,
  removeFieldPrefixFromReturnedObject,
} from "src/lib/graphql/skylark/dynamicQueries";
import {
  convertDateAndTimezoneToISO,
  convertToUTCDate,
} from "src/lib/skylark/availability";
import { parseSkylarkObject } from "src/lib/skylark/parsers";

import { useAllObjectsMeta } from "./useSkylarkObjectTypes";

export interface SearchFilters {
  query: string;
  objectTypes: string[] | null;
  language?: string | null;
  availability: {
    dimensions: Record<string, string> | null;
    timeTravel: {
      datetime: string;
      timezone: string;
    } | null;
  };
}

export const SEARCH_PAGE_SIZE = 25;

export const useSearch = ({
  query: queryString,
  objectTypes,
  language,
  availability,
}: SearchFilters) => {
  const { objects: searchableObjects, allFieldNames } = useAllObjectsMeta(true);

  // Used to rerender search results when the search changes but objects are the same
  const searchHash = `${queryString}-${language}-${objectTypes?.join("-")}`;

  const { query } = useMemo(() => {
    const query = createSearchObjectsQuery(searchableObjects, {
      typesToRequest: objectTypes || [],
    });
    return {
      query,
    };
  }, [searchableObjects, objectTypes]);

  const dimensions = convertAvailabilityDimensionsObjectToGQLDimensions(
    availability.dimensions,
  );

  const variables: Variables = {
    queryString,
    limit: SEARCH_PAGE_SIZE,
    offset: 0,
    language: language || null,
    dimensions,
  };

  const headers: HeadersInit = {
    [REQUEST_HEADERS.ignoreAvailability]: "true",
  };

  if (
    availability.dimensions &&
    Object.keys(availability.dimensions).length > 0
  ) {
    headers[REQUEST_HEADERS.ignoreAvailability] = "false";
    headers[REQUEST_HEADERS.ignoreTime] = "true";

    if (availability.timeTravel) {
      headers[REQUEST_HEADERS.ignoreTime] = "false";
      // Send as UTC
      headers[REQUEST_HEADERS.timeTravel] = convertDateAndTimezoneToISO(
        availability.timeTravel.datetime,
        availability.timeTravel.timezone,
      );
    }
  }

  const {
    data: searchResponse,
    error,
    isLoading,
    hasNextPage,
    isFetchingNextPage,
    isRefetching,
    refetch,
    fetchNextPage,
  } = useInfiniteQuery<GQLSkylarkSearchResponse>({
    queryKey: [
      QueryKeys.Search,
      ...Object.values(variables),
      ...Object.values(headers),
      query,
    ],
    queryFn: async ({ pageParam: offset = 0 }) =>
      skylarkRequest(
        "query",
        query as RequestDocument,
        {
          ...variables,
          offset,
        },
        {},
        headers,
      ),
    getNextPageParam: (lastPage, pages): number | undefined => {
      const totalNumObjects = pages.flatMap(
        (page) => page.search.objects,
      ).length;
      const shouldFetchMore =
        totalNumObjects % SEARCH_PAGE_SIZE === 0 &&
        lastPage.search.objects.length > 0;
      return shouldFetchMore ? totalNumObjects : undefined;
    },
    enabled: !!query,
  });

  const { dispatch } = useUser();

  const { data, allAvailableLanguages, totalHits } = useMemo(() => {
    // Using the errorPolicy "all" means that some data could be null
    const nonNullObjects = searchResponse?.pages
      ?.flatMap((page) => page.search.objects)
      .filter((obj) => obj !== null) as SkylarkGraphQLObject[] | undefined;

    const normalisedObjects = nonNullObjects?.map(
      removeFieldPrefixFromReturnedObject<SkylarkGraphQLObject>,
    );

    const parsedObjects = normalisedObjects?.map((obj) => {
      const objectMeta = searchableObjects?.find(
        ({ name }) => name === obj.__typename,
      );
      return parseSkylarkObject(obj, objectMeta);
    });

    const allAvailableLanguages = parsedObjects
      ? [
          ...new Set(
            parsedObjects.flatMap(
              ({ meta: { availableLanguages } }) => availableLanguages,
            ),
          ),
        ]
      : [];

    // Sometimes the first page's total_count is out of date
    const largestTotalCount = searchResponse?.pages.reduce(
      (previousTotal, { search: { total_count } }) => {
        return total_count && total_count > previousTotal
          ? total_count
          : previousTotal;
      },
      0,
    );

    return {
      data: parsedObjects,
      allAvailableLanguages,
      totalHits: largestTotalCount,
    };
  }, [searchResponse?.pages, searchableObjects]);

  useEffect(() => {
    if (allAvailableLanguages.length > 0) {
      dispatch({ type: "addUsedLanguages", value: allAvailableLanguages });
    }
  }, [allAvailableLanguages, dispatch]);

  if (
    data &&
    hasNextPage &&
    !isFetchingNextPage &&
    data.length < SEARCH_PAGE_SIZE * 2
  ) {
    fetchNextPage();
  }

  return {
    data,
    error,
    isLoading,
    hasNextPage,
    isFetchingNextPage,
    isRefetching,
    refetch,
    fetchNextPage,
    totalHits,
    properties: allFieldNames,
    query,
    variables,
    searchHash,
  };
};
