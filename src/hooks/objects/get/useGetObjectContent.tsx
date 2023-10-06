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
import {
  useAllObjectsMeta,
  useSkylarkObjectOperations,
} from "src/hooks/useSkylarkObjectTypes";
import {
  SkylarkObjectType,
  GQLSkylarkErrorResponse,
  SkylarkObjectMeta,
  GQLSkylarkGetObjectContentResponse,
} from "src/interfaces/skylark";
import { skylarkRequest } from "src/lib/graphql/skylark/client";
import { createGetObjectContentQuery } from "src/lib/graphql/skylark/dynamicQueries";
import { parseObjectContent } from "src/lib/skylark/parsers";

import { GetObjectOptions } from "./useGetObject";

export const createGetObjectContentKeyPrefix = ({
  objectType,
  uid,
}: {
  objectType: string;
  uid: string;
}) => [QueryKeys.GetObjectContent, { objectType, uid }];

const generateQueryFunctionAndKey = ({
  objectMeta,
  contentObjectsMeta,
  objectType,
  uid,
  variables,
  fetchAvailability,
}: {
  objectMeta: SkylarkObjectMeta | null;
  contentObjectsMeta: SkylarkObjectMeta[] | null;
  objectType: SkylarkObjectType;
  uid: string;
  variables: {
    language: string | null;
    nextToken: string;
    uid: string;
  };
  fetchAvailability?: boolean;
}): {
  queryFn: QueryFunction<GQLSkylarkGetObjectContentResponse, QueryKey>;
  queryKey: QueryKey;
  query: DocumentNode | null;
} => {
  const query = createGetObjectContentQuery(
    objectMeta,
    contentObjectsMeta,
    !!variables.language,
    { fetchAvailability },
  );

  const queryFn: QueryFunction<
    GQLSkylarkGetObjectContentResponse,
    QueryKey
  > = async ({ pageParam: nextToken }) => {
    return skylarkRequest("query", query as RequestDocument, {
      ...variables,
      nextToken,
    });
  };

  const queryKey: QueryKey = [
    ...createGetObjectContentKeyPrefix({
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

export const prefetchGetObjectContent = async ({
  queryClient,
  objectMeta,
  contentObjectsMeta,
  objectType,
  uid,
  variables,
}: {
  queryClient: QueryClient;
  objectMeta: SkylarkObjectMeta | null;
  contentObjectsMeta: SkylarkObjectMeta[];
  objectType: SkylarkObjectType;
  uid: string;
  variables: {
    language: string | null;
    nextToken: string;
    uid: string;
  };
}) => {
  const { queryFn, queryKey } = generateQueryFunctionAndKey({
    objectMeta,
    contentObjectsMeta,
    objectType,
    uid,
    variables,
  });
  await queryClient.prefetchInfiniteQuery({ queryKey, queryFn });
};

export const useGetObjectContent = (
  objectType: SkylarkObjectType,
  uid: string,
  opts?: GetObjectOptions & { fetchAvailability?: boolean },
) => {
  const {
    language,
    fetchAvailability,
  }: GetObjectOptions & { fetchAvailability?: boolean } = opts || {
    language: null,
    fetchAvailability: false,
  };

  const { objectOperations: objectMeta } =
    useSkylarkObjectOperations(objectType);

  const { objects: contentObjectsMeta } = useAllObjectsMeta(false);

  const variables = { uid, nextToken: "", language };

  const { queryFn, queryKey, query } = generateQueryFunctionAndKey({
    objectMeta,
    contentObjectsMeta,
    objectType,
    uid,
    variables,
    fetchAvailability,
  });

  const { data, hasNextPage, fetchNextPage, isLoading } = useInfiniteQuery<
    GQLSkylarkGetObjectContentResponse,
    GQLSkylarkErrorResponse<GQLSkylarkGetObjectContentResponse>
  >({
    queryFn,
    queryKey,
    getNextPageParam: (lastPage): string | undefined =>
      lastPage.getObjectContent.content?.next_token || undefined,
    enabled: !!query,
  });

  if (hasNextPage) {
    fetchNextPage();
  }

  const content = useMemo(() => {
    const contentObjects =
      data?.pages?.flatMap(
        (page) => page.getObjectContent.content?.objects || [],
      ) || [];

    const parsedContent = parseObjectContent({ objects: contentObjects });
    return parsedContent;
  }, [data?.pages]);

  return {
    data: content.objects,
    isLoading: isLoading || !query,
    query,
    variables,
    hasNextPage,
  };
};
