import { gql, useQuery } from "@apollo/client";
import { useEffect, useState } from "react";

import { createSearchObjectsQuery } from "src/lib/graphql/skylark/dynamicQueries";

import { useAllSearchableObjectFields } from "./useSkylarkObjectTypes";

const defaultValidQuery = gql("query { __unknown { name }}");

// TODO rename Objjj
interface Objjj {
  __typename: string;
  uid: string;
  external_id: string;
  [key: string]: string | number | boolean;
}

// When making a search request, we use GraphQL value aliases to eliminate any clashes between
// objects in the Skylark schema sharing the same value name but with different types - causes errors
// e.g. an image type with a string and a set type with a required string are different types and throw an error
// From docs:
// - If multiple field selections with the same response names are encountered during execution,
//   the field and arguments to execute and the resulting value should be unambiguous.
//   Therefore any two field selections which might both be encountered for the same object are only valid if they are equivalent.
const removeFieldPrefixFromSearchObjects = (
  objectsWithPrefixes: Objjj[],
): Objjj[] => {
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
    return result as Objjj;
  });
  return objects;
};

export interface SearchFilters {
  objectTypes: string[] | null;
}

export const useSearch = (queryString: string, filters: SearchFilters) => {
  const [data, setData] = useState<Objjj[]>([]);

  const { objects: searchableObjects, allFieldNames } =
    useAllSearchableObjectFields();

  const query = createSearchObjectsQuery(
    searchableObjects,
    filters.objectTypes || [],
  );

  const { data: searchResponse, ...rest } = useQuery<{
    search: {
      objects: (Objjj | null)[];
    };
  }>(query || defaultValidQuery, {
    skip: !query,
    variables: {
      queryString,
    },
    // Using "all" so we can get data even when some is invalid
    // https://www.apollographql.com/docs/react/data/error-handling/#graphql-error-policies
    errorPolicy: "all",
    // Don't cache search so we always get up to date results
    fetchPolicy: "no-cache",
  });

  useEffect(() => {
    // Using the errorPolicy "all" means that some data could be null
    const nonNullObjects = searchResponse?.search.objects.filter(
      (obj) => obj !== null,
    ) as Objjj[];
    const parsedObjects = removeFieldPrefixFromSearchObjects(
      nonNullObjects || [],
    );

    setData(parsedObjects);
  }, [searchResponse?.search.objects]);

  return {
    data,
    properties: allFieldNames,
    ...rest,
  };
};
