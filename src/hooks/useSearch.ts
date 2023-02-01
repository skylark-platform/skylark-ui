import { useQuery } from "@apollo/client";
import { useMemo } from "react";

import {
  SkylarkGraphQLObjectImage,
  ParsedSkylarkObject,
  SkylarkGraphQLObject,
  ParsedSkylarkObjectMetadata,
} from "src/interfaces/skylark";
import { GQLSkylarkSearchResponse } from "src/interfaces/skylark";
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

  const { data: searchResponse, ...rest } = useQuery<GQLSkylarkSearchResponse>(
    query || defaultValidBlankQuery,
    {
      skip: !query,
      variables: {
        queryString,
      },
      // Using "all" so we can get data even when some is invalid
      // https://www.apollographql.com/docs/react/data/error-handling/#graphql-error-policies
      errorPolicy: "all",
      // Don't cache search so we always get up to date results
      fetchPolicy: "network-only",
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

  return {
    data,
    properties: allFieldNames,
    query,
    ...rest,
  };
};
