import { DocumentNode } from "graphql";
import { Variables } from "graphql-request";
import { useMemo } from "react";

import { SEGMENT_KEYS } from "src/constants/segment";
import { ParsedSkylarkObject } from "src/interfaces/skylark";
import { segment } from "src/lib/analytics/segment";

import { useGetObjectGeneric } from "./objects/get/useGetObjectGeneric";
import { SearchFilters, useSearch } from "./useSearch";

export enum SearchType {
  Search = "search",
  UIDExtIDLookup = "uid-extid-lookup",
}

interface UseSearchWithLookupTypeOpts {
  type: SearchType;
  filters: SearchFilters;
}

interface UseSearchWithLookupTypeRet {
  data: ParsedSkylarkObject[];
  error: unknown;
  isLoading: boolean;
  totalHits?: number;
  properties?: string[];
  graphqlSearchQuery: {
    query: DocumentNode | null;
    variables: Variables;
    headers: Record<string, string>;
  };
  isRefetching: boolean;
  searchHash: string;
  refetch: () => void;
  hasNextPage?: boolean;
  isFetchingNextPage: boolean;
  fetchNextPage?: () => void;
}

const useSearchWrapper = ({
  type,
  filters,
}: UseSearchWithLookupTypeOpts): UseSearchWithLookupTypeRet => {
  const {
    data,
    error,
    isLoading,
    totalHits,
    properties,
    query: graphqlSearchQuery,
    variables: graphqlSearchQueryVariables,
    headers: graphqlSearchQueryHeaders,
    isRefetching,
    searchHash,
    refetch,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
  } = useSearch({ filters, disabled: type !== SearchType.Search });

  return {
    data,
    error,
    isLoading,
    totalHits: totalHits,
    properties,
    graphqlSearchQuery: {
      query: graphqlSearchQuery,
      variables: graphqlSearchQueryVariables,
      headers: graphqlSearchQueryHeaders,
    },
    isRefetching,
    searchHash,
    refetch,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
  };
};

const useGetObjectGenericWrapper = ({
  type,
  filters,
}: UseSearchWithLookupTypeOpts): Omit<
  UseSearchWithLookupTypeRet,
  "searchHash" | "properties"
> => {
  const { error, isLoading, data, isRefetching, refetch, graphqlQuery } =
    useGetObjectGeneric({
      uid: filters.query,
      externalId: filters.query,
      objectTypes: filters.objectTypes,
      availability: filters.availability,
      language: filters.language,
      disabled: type !== SearchType.UIDExtIDLookup,
    });

  const dataArr = useMemo(() => (data ? [data] : []), [data]);

  return {
    data: dataArr,
    error,
    isLoading,
    totalHits: isLoading ? undefined : dataArr.length,
    graphqlSearchQuery: graphqlQuery,
    isRefetching,
    refetch,
    hasNextPage: false,
    isFetchingNextPage: false,
  };
};

export const useSearchWithLookupType = (
  opts: UseSearchWithLookupTypeOpts,
): UseSearchWithLookupTypeRet => {
  const search = useSearchWrapper(opts);

  const getObject = useGetObjectGenericWrapper(opts);

  const result = opts.type === SearchType.UIDExtIDLookup ? getObject : search;

  segment.track(SEGMENT_KEYS.objectSearch.search, {
    opts,
    result,
    searchHash: search.searchHash,
    properties: search.properties,
  });

  return {
    ...result,
    // Some values we always take from search
    searchHash: search.searchHash,
    properties: search.properties,
  };
};
