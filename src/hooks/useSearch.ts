import { useQuery } from "@apollo/client";
import { useEffect, useMemo } from "react";

import {
  SkylarkGraphQLObjectImage,
  ParsedSkylarkObject,
  SkylarkGraphQLObject,
  ParsedSkylarkObjectMetadata,
  GQLSkylarkSearchResponse,
} from "src/interfaces/skylark";
import {
  createSearchObjectsQuery,
  defaultValidBlankQuery,
  removeFieldPrefixFromReturnedObject,
} from "src/lib/graphql/skylark/dynamicQueries";
import {
  parseObjectAvailability,
  parseObjectRelationship,
} from "src/lib/skylark/parsers";

import { useAllObjectsMeta } from "./useSkylarkObjectTypes";

export interface SearchFilters {
  objectTypes: string[] | null;
}

export const SEARCH_PAGE_SIZE = 30;

export const useSearch = (queryString: string, filters: SearchFilters) => {
  const { objects: searchableObjects, allFieldNames } = useAllObjectsMeta();

  const query = useMemo(
    () =>
      createSearchObjectsQuery(searchableObjects, filters.objectTypes || []),
    [searchableObjects, filters.objectTypes],
  );

  const {
    data: searchResponse,
    fetchMore,
    refetch,
    ...rest
  } = useQuery<GQLSkylarkSearchResponse | undefined>(
    query || defaultValidBlankQuery,
    {
      skip: !query,
      variables: {
        queryString,
        limit: SEARCH_PAGE_SIZE,
      },
      notifyOnNetworkStatusChange: true,
      // Using "all" so we can get data even when some is invalid
      // https://www.apollographql.com/docs/react/data/error-handling/#graphql-error-policies
      errorPolicy: "all",
      // Don't cache search so we always get up to date results
      fetchPolicy: "network-only",
      nextFetchPolicy: "network-only",
    },
  );

  const data = useMemo(() => {
    // Using the errorPolicy "all" means that some data could be null
    const nonNullObjects = searchResponse?.search.objects.filter(
      (obj) => obj !== null,
    ) as SkylarkGraphQLObject[] | undefined;

    const normalisedObjects =
      nonNullObjects?.map(
        removeFieldPrefixFromReturnedObject<SkylarkGraphQLObject>,
      ) || [];

    const parsedObjects = normalisedObjects.map((obj): ParsedSkylarkObject => {
      return {
        config: {
          colour: obj._config?.colour,
          primaryField: obj._config?.primary_field,
        },
        uid: obj.uid,
        objectType: obj.__typename,
        // TODO filter out any values in obj that are relationships (not metadata types)
        metadata: obj as ParsedSkylarkObjectMetadata,
        availability: parseObjectAvailability(obj.availability),
        images: parseObjectRelationship<SkylarkGraphQLObjectImage>(obj.images),
        relationships: [] as string[],
      };
    });

    return parsedObjects;
  }, [searchResponse?.search.objects]);

  const fetchMoreWrapper = () => {
    fetchMore({
      variables: {
        offset: searchResponse?.search.objects.length || 0,
      },
    });
  };

  useEffect(() => {
    refetch();
  }, [refetch, query]);

  // TODO detect when all data has been fetched, rather than guessing the end
  const moreResultsAvailable = data.length % SEARCH_PAGE_SIZE === 0;

  return {
    data,
    properties: allFieldNames,
    query,
    fetchMoreResults: fetchMoreWrapper,
    refetch,
    ...rest,
    // https://github.com/apollographql/apollo-client/blob/d470c964db46728d8a5dfc63990859c550fa1656/src/core/networkStatus.ts#L4
    // Loading is either "loading" or "refetching" - we use refetching when updating the search filters
    loading: rest.networkStatus === 1 || rest.networkStatus === 4,
    fetchingMore: rest.networkStatus === 3,
    moreResultsAvailable,
  };
};
