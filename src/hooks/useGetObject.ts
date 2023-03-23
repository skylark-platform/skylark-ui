import { useQuery } from "@tanstack/react-query";
import { DocumentNode } from "graphql";

import { QueryErrorMessages, QueryKeys } from "src/enums/graphql";
import {
  SkylarkObjectType,
  GQLSkylarkErrorResponse,
} from "src/interfaces/skylark";
import { GQLSkylarkGetObjectResponse } from "src/interfaces/skylark";
import { skylarkRequest } from "src/lib/graphql/skylark/client";
import { createGetObjectQuery } from "src/lib/graphql/skylark/dynamicQueries";
import { parseSkylarkObject } from "src/lib/skylark/parsers";

import {
  useAllObjectsMeta,
  useSkylarkObjectOperations,
} from "./useSkylarkObjectTypes";

export const createGetObjectKeyPrefix = ({
  objectType,
  uid,
}: {
  objectType: string;
  uid: string;
}) => [QueryKeys.GetObject, objectType, uid];

export const useGetObject = (objectType: SkylarkObjectType, uid: string) => {
  const { objectOperations } = useSkylarkObjectOperations(objectType);
  const { objects: searchableObjects } = useAllObjectsMeta();

  const query = createGetObjectQuery(objectOperations, searchableObjects);
  const variables = { uid };

  const { data, error, ...rest } = useQuery<
    GQLSkylarkGetObjectResponse,
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

  const parsedObject = data?.getObject && parseSkylarkObject(data?.getObject);

  return {
    ...rest,
    error,
    data: parsedObject,
    isLoading: rest.isLoading || !query,
    isNotFound:
      error?.response.errors?.[0]?.errorType === QueryErrorMessages.NotFound,
    query,
    variables,
  };
};
