import { useInfiniteQuery } from "@tanstack/react-query";
import { RequestDocument } from "graphql-request";
import { useEffect, useMemo } from "react";

import { useUser } from "src/contexts/useUser";
import { QueryKeys } from "src/enums/graphql";
import {
  SkylarkGraphQLObject,
  GQLSkylarkSearchResponse,
} from "src/interfaces/skylark";
import { skylarkRequest } from "src/lib/graphql/skylark/client";
import {
  createSearchObjectsQuery,
  removeFieldPrefixFromReturnedObject,
} from "src/lib/graphql/skylark/dynamicQueries";
import { parseSkylarkObject } from "src/lib/skylark/parsers";

import { useAllObjectsMeta } from "./useSkylarkObjectTypes";

export interface SearchFilters {
  objectTypes: string[] | null;
  language?: string | null;
}

export const SEARCH_PAGE_SIZE = 50;

export const useSearch = (queryString: string, filters: SearchFilters) => {
  const { objects: searchableObjects, allFieldNames } = useAllObjectsMeta(true);
  const { objectTypes, language } = filters;

  // Used to rerender search results when the search changes but objects are the same
  const searchHash = `${queryString}-${language}-${objectTypes?.join("-")}`;

  const { query } = useMemo(() => {
    const query = createSearchObjectsQuery(
      searchableObjects,
      objectTypes || [],
    );
    return {
      query,
    };
  }, [searchableObjects, objectTypes]);

  const variables = {
    queryString,
    limit: SEARCH_PAGE_SIZE,
    offset: 0,
    language: language || null,
  };

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
    queryKey: [QueryKeys.Search, ...Object.values(variables), query],
    queryFn: async ({ pageParam: offset = 0 }) =>
      skylarkRequest(query as RequestDocument, {
        ...variables,
        offset,
      }),
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
