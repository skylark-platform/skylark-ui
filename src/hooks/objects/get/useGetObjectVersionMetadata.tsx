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
  GQLSkylarkGetObjectVersionMetadataResponse,
  ParsedSkylarkObjectMetadata,
} from "src/interfaces/skylark";
import { GQLSkylarkGetObjectResponse } from "src/interfaces/skylark";
import { skylarkRequest } from "src/lib/graphql/skylark/client";
import { createGetObjectQuery } from "src/lib/graphql/skylark/dynamicQueries";
import { createGetObjectVersionMetadataQuery } from "src/lib/graphql/skylark/dynamicQueries";
import { parseSkylarkObject } from "src/lib/skylark/parsers";
import { hasProperty } from "src/lib/utils";

export interface GetObjectMetadataVersionOptions {
  language: string | null;
  languageVersion?: number;
  globalVersion?: number;
}

export const createGetObjectMetadataVersionKeyPrefix = ({
  objectType,
  uid,
  language,
  languageVersion,
  globalVersion,
}: {
  objectType: string;
  uid: string;
} & GetObjectMetadataVersionOptions) => [
  QueryKeys.GetObjectMetadataVersion,
  uid,
  objectType,
  globalVersion,
  languageVersion,
  language,
];

export const useGetObjectVersionMetadata = (
  objectType: SkylarkObjectType,
  uid: string,
  { languageVersion, globalVersion, language }: GetObjectMetadataVersionOptions,
) => {
  const {
    objectOperations: objectMeta,
    error: objectMetaError,
    isError: isObjectMetaError,
  } = useSkylarkObjectOperations(objectType);

  const query = createGetObjectVersionMetadataQuery(objectMeta, !!language);
  const variables = { uid, languageVersion, globalVersion };

  const { data, error, isLoading, isError } = useQuery<
    GQLSkylarkGetObjectVersionMetadataResponse,
    GQLSkylarkErrorResponse<GQLSkylarkGetObjectVersionMetadataResponse>,
    ParsedSkylarkObjectMetadata
  >({
    // eslint-disable-next-line @tanstack/query/exhaustive-deps
    queryKey: createGetObjectMetadataVersionKeyPrefix({
      objectType,
      uid,
      language,
      languageVersion,
      globalVersion,
    }),
    queryFn: async () =>
      skylarkRequest("query", query as DocumentNode, variables, {
        noDraftHeader: true,
      }),
    enabled: Boolean(query !== null && languageVersion && globalVersion),
    select: useCallback((data: GQLSkylarkGetObjectVersionMetadataResponse) => {
      const obj = {
        ...data.getObjectVersion._meta.language_data,
        ...data.getObjectVersion._meta.global_data,
      };

      return obj;
    }, []),
    // Historical versions cannot change so why refetch
    refetchOnMount: false,
    refetchOnReconnect: false,
    refetchOnWindowFocus: false,
  });

  console.log({ historicalMetadata: data, query });

  return {
    error,
    historicalMetadata: data,
    objectMeta,
    isLoading: (isLoading || !query) && !isObjectMetaError,
    isError: isError || isObjectMetaError,
    query,
    variables,
  };
};
