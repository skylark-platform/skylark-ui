import { useQuery } from "@apollo/client";
import { useCallback, useMemo } from "react";

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
    ...rest
  } = useQuery<GQLSkylarkSearchResponse>(query || defaultValidBlankQuery, {
    skip: !query,
    variables: {
      queryString,
      limit: 50,
    },
    notifyOnNetworkStatusChange: true,
    // Using "all" so we can get data even when some is invalid
    // https://www.apollographql.com/docs/react/data/error-handling/#graphql-error-policies
    errorPolicy: "all",
    // Don't cache search so we always get up to date results
    fetchPolicy: "no-cache",
    nextFetchPolicy: "network-only",
  });

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

  const fetchMoreWrapper = useCallback(() => {
    // console.log(
    //   "**** FETCH MORE CALLED. Offset: ",
    //   searchResponse?.search.objects.length,
    // );
    return fetchMore({
      variables: {
        offset: searchResponse?.search.objects.length,
      },
      updateQuery(previousData, options) {
        if (Object.keys(previousData).length === 0) {
          return options.fetchMoreResult;
        }

        console.log({ previousData, options });

        const updatedData = {
          ...previousData,
          search: {
            ...previousData.search,
            objects: [
              ...previousData.search.objects,
              ...options.fetchMoreResult.search.objects,
            ],
          },
        };
        return updatedData;
      },
    });
  }, [searchResponse?.search.objects.length, fetchMore]);

  console.log(rest.networkStatus);

  return {
    data,
    properties: allFieldNames,
    query,
    fetchMoreResults: fetchMoreWrapper,
    ...rest,
    loading: rest.networkStatus === 1,
    fetchingMore: rest.networkStatus === 3,
  };
};
