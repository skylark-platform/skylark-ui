import { useQuery, UseQueryResult } from "@tanstack/react-query";
import { DocumentNode } from "graphql";

import {
  GQLSkylarkErrorResponse,
  GQLSkylarkGetObjectResponse,
  SkylarkObjectType,
} from "src/interfaces/skylark";
import { skylarkRequest } from "src/lib/graphql/skylark/client";
import { createGetObjectRelationshipsQuery } from "src/lib/graphql/skylark/dynamicQueries";
import {
  getObjectOperations,
  getAllObjectsMeta,
} from "src/lib/skylark/objects";

import { createGetObjectKeyPrefix } from "./useGetObject";
import { useSkylarkObjectOperations } from "./useSkylarkObjectTypes";
import {
  useSkylarkSchema,
  useSkylarkSchemaInterfaceType,
} from "./useSkylarkSchemaIntrospection";

export const useObjectRelationships = (
  objectType: SkylarkObjectType,
  uid: string,
): any => {
  const { objectOperations } = useSkylarkObjectOperations(objectType);

  console.log("starting point party ----------- > ", objectOperations);

  const query = createGetObjectRelationshipsQuery(objectOperations);
  const variables = { uid, nextToken: "" };

  const { data, error, ...rest } = useQuery<
    any,
    GQLSkylarkErrorResponse<GQLSkylarkGetObjectResponse>
  >({
    queryKey: [
      ...createGetObjectKeyPrefix({ objectType, uid }),
      query,
      variables,
    ],
    queryFn: async () => skylarkRequest(query as DocumentNode, variables),
    enabled: query !== null,
  });

  console.log("query pleeaaaase", data);

  return;
};
