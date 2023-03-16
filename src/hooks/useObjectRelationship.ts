import { useQuery, UseQueryResult } from "@tanstack/react-query";
import { DocumentNode } from "graphql";

import {
  GQLSkylarkErrorResponse,
  GQLSkylarkGetObjectRelationshipsResponse,
  GQLSkylarkGetObjectResponse,
  NormalizedObjectField,
  SkylarkGraphQLObject,
  SkylarkObjectMeta,
  SkylarkObjectType,
} from "src/interfaces/skylark";
import { skylarkRequest } from "src/lib/graphql/skylark/client";
import { createGetObjectRelationshipsQuery } from "src/lib/graphql/skylark/dynamicQueries";

import { createGetObjectKeyPrefix } from "./useGetObject";
import { useSkylarkObjectOperations } from "./useSkylarkObjectTypes";

export const FieldsFromObjectType = (objectType: string) => {
  const { objectOperations } = useSkylarkObjectOperations(objectType);
  return objectOperations?.fields;
};

export const useObjectRelationships = (
  objectType: SkylarkObjectType,
  uid: string,
): { data: SkylarkGraphQLObject | undefined } => {
  const { objectOperations } = useSkylarkObjectOperations(objectType);

  const relationshipsFields: { [key: string]: NormalizedObjectField[] } =
    objectOperations?.relationships.reduce((acc, { objectType }) => {
      const fields = FieldsFromObjectType(objectType);
      return { ...acc, [objectType]: fields };
    }, {}) || {};

  // console.log("starting point party ----------- > ", objectOperations);
  // console.log("fields ----------- > ", relationshipsFields);

  const query = createGetObjectRelationshipsQuery(
    objectOperations,
    relationshipsFields,
  );
  const variables = { uid, nextToken: "" };

  const { data, ...rest } = useQuery<
    GQLSkylarkGetObjectRelationshipsResponse,
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

  return { data: data?.getObjectRelationships, ...rest };
};
