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
} from "src/lib/graphql/skylark/dynamicQueries";
import {
  parseObjectAvailability,
  parseObjectRelationship,
} from "src/lib/skylark/parsers";

import { useAllSearchableObjectMeta } from "./useSkylarkObjectTypes";

export interface SearchFilters {
  objectTypes: string[] | null;
}

// When making a search request, we use GraphQL value aliases to eliminate any clashes between
// objects in the Skylark schema sharing the same value name but with different types - causes errors
// e.g. an image type with a string and a set type with a required string are different types and throw an error
// From docs:
// - If multiple field selections with the same response names are encountered during execution,
//   the field and arguments to execute and the resulting value should be unambiguous.
//   Therefore any two field selections which might both be encountered for the same object are only valid if they are equivalent.
const removeFieldPrefixFromSearchObjects = (
  objectsWithPrefixes: SkylarkGraphQLObject[],
): SkylarkGraphQLObject[] => {
  const objects = objectsWithPrefixes.map((objectWithPrefix) => {
    const searchAliasPrefix = `__${objectWithPrefix.__typename}__`;
    const result = Object.fromEntries(
      Object.entries(objectWithPrefix).map(([key, val]) => {
        const newKey = key.startsWith(searchAliasPrefix)
          ? key.replace(searchAliasPrefix, "")
          : key;
        return [newKey, val];
      }),
    );
    return result as SkylarkGraphQLObject;
  });
  return objects;
};

export const useSearch = (queryString: string, filters: SearchFilters) => {
  const { objects: searchableObjects, allFieldNames } =
    useAllSearchableObjectMeta();

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
    ) as SkylarkGraphQLObject[];
    const normalisedObjects = removeFieldPrefixFromSearchObjects(
      nonNullObjects || [],
    );

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
