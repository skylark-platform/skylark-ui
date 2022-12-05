import { gql, useQuery } from "@apollo/client";

import { SkylarkObjectType } from "src/interfaces/skylark/objects";
import { createGetObjectQuery } from "src/lib/graphql/skylark/dynamicQueries";

import { useSkylarkObjectOperations } from "./useSkylarkObjectTypes";

const defaultValidQuery = gql("query { __unknown { name }}");

export const useGetObject = (
  objectType: SkylarkObjectType,
  lookupValue: { externalId?: string; uid?: string },
) => {
  const { object } = useSkylarkObjectOperations(objectType);

  const query = createGetObjectQuery(object);

  return useQuery(query || defaultValidQuery, {
    skip: !query,
    variables: {
      ...lookupValue,
    },
  });
};
