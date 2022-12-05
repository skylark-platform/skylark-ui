import { gql, useQuery } from "@apollo/client";

import { SkylarkObjectType } from "src/interfaces/skylark/objects";
import { createListObjectQuery } from "src/lib/graphql/skylark/dynamicQueries";

import { useSkylarkObjectOperations } from "./useSkylarkObjectTypes";

const defaultValidQuery = gql("query { __unknown { name }}");

// TODO add pagination support

export const useListObjects = (objectType: SkylarkObjectType) => {
  const { object } = useSkylarkObjectOperations(objectType);

  const query = createListObjectQuery(object);

  const { data, ...rest } = useQuery<{
    listSkylarkObjects: {
      count: number;
      next_token: string | null;
      objects: {
        uid: string;
        external_id: string;
        [key: string]: string | number | boolean;
      }[];
    };
  }>(query || defaultValidQuery, {
    skip: !query,
  });

  return {
    data: data?.listSkylarkObjects,
    ...rest,
  };
};
