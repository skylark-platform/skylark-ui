import {
  InfiniteData,
  QueryClient,
  QueryFunction,
  QueryKey,
  useInfiniteQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { DocumentNode } from "graphql";
import { RequestDocument } from "graphql-request";

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
import { parseAvailabilityObjects } from "src/lib/skylark/parsers";
import { hasProperty } from "src/lib/utils";

import { GetObjectOptions } from "./useGetObject";

const select = (
  data:
    | InfiniteData<GQLSkylarkGetObjectAvailabilityResponse>
    | { initialData: ParsedSkylarkObjectAvailabilityObject[] },
): ParsedSkylarkObjectAvailabilityObject[] => {
  // data will be ParsedSkylarkObjectAvailabilityObject[] when pre-loaded into the cache
  if (
    data &&
    hasProperty<
      | InfiniteData<GQLSkylarkGetObjectAvailabilityResponse>
      | { initialData: ParsedSkylarkObjectAvailabilityObject[] },
      "initialData",
      ParsedSkylarkObjectAvailabilityObject[]
    >(data, "initialData")
  ) {
    return data.initialData;
  }

  const objects = data.pages.flatMap(
    (page) => page.getObjectAvailability?.availability?.objects || [],
  );
  return parseAvailabilityObjects(objects);
};

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

  const queryClient = useQueryClient();

  const { data, isLoading, isFetched, hasNextPage, fetchNextPage } =
    useInfiniteQuery<
      GQLSkylarkGetObjectAvailabilityResponse,
      GQLSkylarkErrorResponse<GQLSkylarkGetObjectAvailabilityResponse>,
      ParsedSkylarkObjectAvailabilityObject[]
    >({
      queryFn,
      queryKey,
      initialPageParam: "",
      getNextPageParam: (lastPage): string | undefined =>
        lastPage.getObjectAvailability?.availability?.next_token || undefined,
      select,
      initialData: () => {
        const initialData: ParsedSkylarkObjectAvailabilityObject[] | undefined =
          queryClient.getQueryData(
            createGetObjectAvailabilityKeyPrefix({ uid, objectType }),
          );

        return initialData && Array.isArray(initialData)
          ? { initialData, pageParams: [], pages: [] }
          : undefined;
      },
    });

  const hasQuery = Boolean(query);

  return {
    data,
    isLoading: isLoading || !hasQuery,
    isFetched: isFetched && hasQuery,
    hasNextPage,
    fetchNextPage,
    query,
    variables,
  };
};
