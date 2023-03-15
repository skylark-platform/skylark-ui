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

export const Test = (objectType: string) => {
  const { objectOperations } = useSkylarkObjectOperations(objectType);
  return objectOperations?.fields;
};

export const useObjectRelationships = (
  objectType: SkylarkObjectType,
  uid: string,
): any => {
  const { objectOperations } = useSkylarkObjectOperations(objectType);

  const relationshipsFields = objectOperations?.relationships.reduce(
    (acc, { objectType }) => {
      // const { objectOperations } = useSkylarkObjectOperations(objectType);
      const t = Test(objectType);
      return { ...acc, [objectType]: t };
    },
    {},
  );

  console.log("starting point party ----------- > ", objectOperations);
  console.log("fields ----------- > ", relationshipsFields);

  const query = createGetObjectRelationshipsQuery(
    objectOperations,
    relationshipsFields,
  );
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
  const relationships = data?.getObjectRelationships;

  return { data: relationships };
};
