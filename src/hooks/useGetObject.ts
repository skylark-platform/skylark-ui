import { useQuery } from "@tanstack/react-query";
import { DocumentNode } from "graphql";
import { useEffect, useMemo } from "react";

import { useUser } from "src/contexts/useUser";
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
  language,
}: {
  objectType: string;
  uid: string;
  language?: string | null;
}) => [QueryKeys.GetObject, { objectType, uid }, { language }];

export const useGetObject = (
  objectType: SkylarkObjectType,
  uid: string,
  opts?: GetObjectOptions,
) => {
  const { language }: GetObjectOptions = opts || { language: null };

  const { dispatch } = useUser();

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
    // eslint-disable-next-line @tanstack/query/exhaustive-deps
    queryKey: createGetObjectKeyPrefix({ objectType, uid, language }),
    queryFn: async () => skylarkRequest(query as DocumentNode, variables),
    enabled: query !== null,
  });

  const parsedObject = useMemo(
    () => data?.getObject && parseSkylarkObject(data?.getObject, objectMeta),
    [data?.getObject, objectMeta],
  );

  useEffect(() => {
    if (
      parsedObject?.meta?.availableLanguages &&
      parsedObject?.meta?.availableLanguages.length > 0
    ) {
      dispatch({
        type: "addUsedLanguages",
        value: parsedObject?.meta?.availableLanguages,
      });
    }
  }, [dispatch, parsedObject?.meta?.availableLanguages]);

  return {
    ...rest,
    error,
    data: parsedObject,
    objectMeta,
    isLoading: (rest.isLoading || !query) && !isObjectMetaError,
    isNotFound:
      error?.response?.errors?.[0]?.errorType === QueryErrorMessages.NotFound,
    isObjectTypeNotFound:
      objectMetaError && hasProperty(objectMetaError, "code")
        ? objectMetaError.code === ErrorCodes.NotFound
        : false,
    isError: rest.isError || isObjectMetaError,
    query,
    variables,
  };
};
