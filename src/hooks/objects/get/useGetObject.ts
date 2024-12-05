import { useQuery } from "@tanstack/react-query";
import { DocumentNode } from "graphql";
import { useCallback, useEffect } from "react";

import { useUser } from "src/contexts/useUser";
import { QueryErrorMessages, QueryKeys } from "src/enums/graphql";
import { useSkylarkObjectOperations } from "src/hooks/useSkylarkObjectTypes";
import { ErrorCodes } from "src/interfaces/errors";
import {
  SkylarkObjectType,
  GQLSkylarkErrorResponse,
  ParsedSkylarkObject,
} from "src/interfaces/skylark";
import { GQLSkylarkGetObjectResponse } from "src/interfaces/skylark";
import { skylarkRequest } from "src/lib/graphql/skylark/client";
import { createGetObjectQuery } from "src/lib/graphql/skylark/dynamicQueries";
import { parseSkylarkObject } from "src/lib/skylark/parsers";
import {
  hasProperty,
  isAvailabilityOrAvailabilitySegment,
} from "src/lib/utils";

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
}) => [
  QueryKeys.GetObject,
  uid,
  objectType,
  {
    language: isAvailabilityOrAvailabilitySegment(objectType) ? null : language,
  },
];

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

  const query = createGetObjectQuery(objectMeta, !!language);
  const variables = { uid, language };

  const {
    data: parsedObject,
    error,
    isLoading,
    isError,
  } = useQuery<
    GQLSkylarkGetObjectResponse,
    GQLSkylarkErrorResponse<GQLSkylarkGetObjectResponse>,
    ParsedSkylarkObject
  >({
    // eslint-disable-next-line @tanstack/query/exhaustive-deps
    queryKey: createGetObjectKeyPrefix({ objectType, uid, language }),
    queryFn: async () =>
      skylarkRequest("query", query as DocumentNode, variables),
    enabled: query !== null,
    select: useCallback(
      (
        data: GQLSkylarkGetObjectResponse | ParsedSkylarkObject,
      ): ParsedSkylarkObject => {
        // data will be ParsedSkylarkObject when pre-loaded into the cache
        if (hasProperty(data, "getObject") && !hasProperty(data, "metadata")) {
          return parseSkylarkObject(data?.getObject, objectMeta);
        }

        return data as ParsedSkylarkObject;
      },
      [objectMeta],
    ),
  });

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
    error,
    data: parsedObject,
    objectMeta,
    isLoading: (isLoading || !query) && !isObjectMetaError,
    isNotFound:
      error?.response?.errors?.[0]?.errorType === QueryErrorMessages.NotFound,
    isObjectTypeNotFound:
      objectMetaError && hasProperty(objectMetaError, "code")
        ? objectMetaError.code === ErrorCodes.NotFound
        : false,
    isError: isError || isObjectMetaError,
    query,
    variables,
  };
};
