import {
  QueryClient,
  QueryFunction,
  QueryKey,
  useInfiniteQuery,
} from "@tanstack/react-query";
import { DocumentNode } from "graphql";
import { RequestDocument } from "graphql-request";
import { useMemo } from "react";

import { QueryKeys } from "src/enums/graphql";
import { useSkylarkObjectOperations } from "src/hooks/useSkylarkObjectTypes";
import {
  SkylarkObjectType,
  GQLSkylarkErrorResponse,
  GQLSkylarkGetObjectAvailabilityResponse,
  ParsedSkylarkObjectAvailabilityObject,
  SkylarkObjectMeta,
} from "src/interfaces/skylark";
import { skylarkRequest } from "src/lib/graphql/skylark/client";
import { createGetObjectAvailabilityQuery } from "src/lib/graphql/skylark/dynamicQueries";

import { GetObjectOptions } from "./useGetObject";

export const createGetObjectAvailabilityKeyPrefix = ({
  objectType,
  uid,
}: {
  objectType: string;
  uid: string;
}) => [QueryKeys.GetObjectAvailability, uid, objectType];

const generateQueryFunctionAndKey = ({
  objectMeta,
  objectType,
  uid,
  variables,
}: {
  objectMeta: SkylarkObjectMeta | null;
  objectType: SkylarkObjectType;
  uid: string;
  variables: {
    language: string | null;
    nextToken: string;
    uid: string;
  };
}): {
  queryFn: QueryFunction<
    GQLSkylarkGetObjectAvailabilityResponse,
    QueryKey,
    unknown
  >;
  queryKey: QueryKey;
  query: DocumentNode | null;
} => {
  const query = createGetObjectAvailabilityQuery(
    objectMeta,
    !!variables.language,
  );

  const queryFn: QueryFunction<
    GQLSkylarkGetObjectAvailabilityResponse,
    QueryKey,
    unknown
  > = async ({ pageParam: nextToken }) =>
    skylarkRequest("query", query as RequestDocument, {
      ...variables,
      nextToken,
    });

  const queryKey: QueryKey = [
    ...createGetObjectAvailabilityKeyPrefix({
      objectType,
      uid,
    }),
    query,
    variables,
  ];

  return {
    queryFn,
    queryKey,
    query,
  };
};

export const prefetchGetObjectAvailability = async ({
  queryClient,
  objectMeta,
  objectType,
  uid,
  variables,
}: {
  queryClient: QueryClient;
  objectMeta: SkylarkObjectMeta | null;
  objectType: SkylarkObjectType;
  uid: string;
  variables: {
    language: string | null;
    nextToken: string;
    uid: string;
  };
}) => {
  if (objectMeta?.hasAvailability) {
    const { queryFn, queryKey } = generateQueryFunctionAndKey({
      objectMeta,
      objectType,
      uid,
      variables,
    });
    await queryClient.prefetchInfiniteQuery({
      queryKey,
      queryFn,
      initialPageParam: "",
    });
  }
};

export const useGetObjectAvailability = (
  objectType: SkylarkObjectType,
  uid: string,
  opts?: GetObjectOptions,
) => {
  const { language }: GetObjectOptions = opts || { language: null };

  const { objectOperations: objectMeta } =
    useSkylarkObjectOperations(objectType);

  const variables = { uid, nextToken: "", language };

  const { queryFn, queryKey, query } = generateQueryFunctionAndKey({
    objectMeta,
    objectType,
    uid,
    variables,
  });

  const { data, isLoading, hasNextPage, fetchNextPage } = useInfiniteQuery<
    GQLSkylarkGetObjectAvailabilityResponse,
    GQLSkylarkErrorResponse<GQLSkylarkGetObjectAvailabilityResponse>
  >({
    queryFn,
    queryKey,
    initialPageParam: "",
    getNextPageParam: (lastPage): string | undefined =>
      lastPage.getObjectAvailability?.availability?.next_token || undefined,
  });

  const availability: ParsedSkylarkObjectAvailabilityObject[] | undefined =
    useMemo(
      () =>
        data?.pages
          ?.flatMap(
            (page) => page.getObjectAvailability?.availability?.objects || [],
          )
          .map((object): ParsedSkylarkObjectAvailabilityObject => {
            return {
              ...object,
              title: object.title || "",
              slug: object.slug || "",
              start: object.start || "",
              end: object.end || "",
              timezone: object.timezone || "",
              active: object.active === false ? false : true,
              inherited: object.inherited || false,
              inheritanceSource: object.inheritance_source || false,
              dimensions: object.dimensions.objects,
            };
          }),
      [data?.pages],
    );

  return {
    data: availability,
    isLoading: isLoading || !query,
    hasNextPage,
    fetchNextPage,
    query,
    variables,
  };
};
