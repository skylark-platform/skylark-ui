import { useQuery } from "@tanstack/react-query";
import { DocumentNode } from "graphql";

import { QueryErrorMessages, QueryKeys } from "src/enums/graphql";
import { ErrorCodes } from "src/interfaces/errors";
import {
  SkylarkObjectType,
  GQLSkylarkErrorResponse,
} from "src/interfaces/skylark";
import { GQLSkylarkGetObjectResponse } from "src/interfaces/skylark";
import { skylarkRequest } from "src/lib/graphql/skylark/client";
import { createGetObjectQuery } from "src/lib/graphql/skylark/dynamicQueries";
import { parseSkylarkObject } from "src/lib/skylark/parsers";
import { hasProperty } from "src/lib/utils";

import {
  useAllObjectsMeta,
  useSkylarkObjectOperations,
} from "./useSkylarkObjectTypes";

export interface GetObjectOptions {
  language: string | null;
}

export const createGetObjectKeyPrefix = ({
  objectType,
  uid,
}: {
  objectType: string;
  uid: string;
}) => [QueryKeys.GetObject, objectType, uid];

export const useGetObject = (
  objectType: SkylarkObjectType,
  uid: string,
  opts?: GetObjectOptions,
) => {
  const { language }: GetObjectOptions = opts || { language: null };

  const {
    objectOperations: objectMeta,
    error: objectMetaError,
    isError: isObjectMetaError,
  } = useSkylarkObjectOperations(objectType);
  const { objects: contentObjects } = useAllObjectsMeta(false);

  const query = createGetObjectQuery(objectMeta, contentObjects, !!language);
  const variables = { uid, language };

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

  const parsedObject =
    data?.getObject && parseSkylarkObject(data?.getObject, objectMeta);

  return {
    ...rest,
    error,
    data: parsedObject,
    objectMeta,
    isLoading: (rest.isLoading || !query) && !isObjectMetaError,
    isNotFound:
      error?.response.errors?.[0]?.errorType === QueryErrorMessages.NotFound,
    isObjectTypeNotFound:
      objectMetaError && hasProperty(objectMetaError, "code")
        ? objectMetaError.code === ErrorCodes.NotFound
        : false,
    isError: rest.isError || isObjectMetaError,
    query,
    variables,
  };
};
