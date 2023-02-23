import { useInfiniteQuery } from "@tanstack/react-query";
import { RequestDocument } from "graphql-request";
import { useEffect, useMemo, useState } from "react";

import {
  SkylarkGraphQLObjectImage,
  ParsedSkylarkObject,
  SkylarkGraphQLObject,
  ParsedSkylarkObjectMetadata,
  GQLSkylarkSearchResponse,
} from "src/interfaces/skylark";
import { request } from "src/lib/graphql/skylark/client";
import {
  createSearchObjectsQuery,
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

export const SEARCH_PAGE_SIZE = 20;

export const useSearch = (queryString: string, filters: SearchFilters) => {
  const { objects: searchableObjects, allFieldNames } = useAllObjectsMeta();
  const [allResultsFetched, setAllResultsFetched] = useState(false);

  const query = useMemo(
    () =>
      createSearchObjectsQuery(searchableObjects, filters.objectTypes || []),
    [searchableObjects, filters.objectTypes],
  );

  const variables = {
    queryString,
    limit: SEARCH_PAGE_SIZE,
    offset: 0,
  };

  const { data: searchResponse, ...rest } =
    useInfiniteQuery<GQLSkylarkSearchResponse>({
      queryKey: [query, variables],
      queryFn: async ({ pageParam: offset = 0 }) =>
        request(query as RequestDocument, {
          ...variables,
          offset,
        }),
      getNextPageParam: (_, pages): number | undefined => {
        const totalNumObjects = pages.flatMap(
          (page) => page.search.objects,
        ).length;
        const shouldFetchMore =
          !allResultsFetched && totalNumObjects % SEARCH_PAGE_SIZE === 0;
        return shouldFetchMore ? totalNumObjects : undefined;
      },
    });

  const data = useMemo(() => {
    // Using the errorPolicy "all" means that some data could be null
    const nonNullObjects = searchResponse?.pages
      .flatMap((page) => page.search.objects)
      .filter((obj) => obj !== null) as SkylarkGraphQLObject[] | undefined;

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
  }, [searchResponse?.pages]);

  useEffect(() => {
    setAllResultsFetched(false);
  }, [query]);

  return {
    ...rest,
    data,
    properties: allFieldNames,
    query,
    variables,
  };
};
