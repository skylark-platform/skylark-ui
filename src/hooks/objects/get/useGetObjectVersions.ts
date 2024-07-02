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
  GQLSkylarkGetObjectVersionsResponse,
} from "src/interfaces/skylark";
import { GQLSkylarkGetObjectResponse } from "src/interfaces/skylark";
import { skylarkRequest } from "src/lib/graphql/skylark/client";
import { createGetObjectQuery } from "src/lib/graphql/skylark/dynamicQueries";
import { createGetObjectVersionsQuery } from "src/lib/graphql/skylark/dynamicQueries";
import { parseSkylarkObject } from "src/lib/skylark/parsers";
import { hasProperty } from "src/lib/utils";

import { GetObjectOptions } from "./useGetObject";

export const createGetObjectMetadataVersionKeyPrefix = ({
  objectType,
  uid,
  language,
}: {
  objectType: string;
  uid: string;
} & GetObjectOptions) => [
  QueryKeys.GetObjectMetadataVersion,
  uid,
  objectType,
  language,
];

export const useGetObjectVersions = (
  objectType: SkylarkObjectType,
  uid: string,
  { language }: GetObjectOptions,
) => {
  const {
    objectOperations: objectMeta,
    error: objectMetaError,
    isError: isObjectMetaError,
  } = useSkylarkObjectOperations(objectType);

  const query = createGetObjectVersionsQuery(objectMeta, !!language);
  const variables = { uid, language };

  const { data, error, isLoading, isError } = useQuery<
    GQLSkylarkGetObjectVersionsResponse,
    GQLSkylarkErrorResponse<GQLSkylarkGetObjectVersionsResponse>,
    { language: number[]; global: number[] }
  >({
    // eslint-disable-next-line @tanstack/query/exhaustive-deps
    queryKey: createGetObjectMetadataVersionKeyPrefix({
      objectType,
      uid,
      language,
    }),
    queryFn: async () =>
      skylarkRequest("query", query as DocumentNode, variables, {
        noDraftHeader: true,
      }),
    enabled: query !== null,
    select: useCallback((data: GQLSkylarkGetObjectVersionsResponse) => {
      const language = data.getObjectVersions._meta.language_data.history.map(
        ({ version }) => version,
      );

      const global = data.getObjectVersions._meta.global_data.history.map(
        ({ version }) => version,
      );

      return {
        language,
        global,
      };
    }, []),
  });

  console.log({ historicalMetadata: data, query });

  return {
    error,
    versions: data,
    objectMeta,
    isLoading: (isLoading || !query) && !isObjectMetaError,
    isError: isError || isObjectMetaError,
    query,
    variables,
  };
};
