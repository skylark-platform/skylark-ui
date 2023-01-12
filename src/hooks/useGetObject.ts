import { useQuery } from "@apollo/client";

import { SkylarkObjectType } from "src/interfaces/skylark/objects";
import {
  createGetObjectQuery,
  defaultValidBlankQuery,
} from "src/lib/graphql/skylark/dynamicQueries";

import { useSkylarkObjectOperations } from "./useSkylarkObjectTypes";

export const useGetObject = (
  objectType: SkylarkObjectType,
  lookupValue: { externalId?: string; uid?: string },
) => {
  const { object } = useSkylarkObjectOperations(objectType);

  const query = createGetObjectQuery(object);

  return useQuery(query || defaultValidBlankQuery, {
    skip: !query,
    variables: {
      ...lookupValue,
    },
  });
};
