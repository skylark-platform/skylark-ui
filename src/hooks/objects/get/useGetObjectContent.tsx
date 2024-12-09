import {
  InfiniteData,
  QueryClient,
  QueryFunction,
  QueryKey,
  useInfiniteQuery,
} from "@tanstack/react-query";
import { DocumentNode } from "graphql";
import { RequestDocument } from "graphql-request";

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
  SkylarkObjectContentObject,
  ModifiedContents,
} from "src/interfaces/skylark";
import { skylarkRequest } from "src/lib/graphql/skylark/client";
import { createGetObjectContentQuery } from "src/lib/graphql/skylark/dynamicQueries";
import { parseObjectContent } from "src/lib/skylark/parsers";

import { GetObjectOptions } from "./useGetObject";

const select = (
  data: InfiniteData<GQLSkylarkGetObjectContentResponse>,
): {
  objects: SkylarkObjectContentObject[];
  config: ModifiedContents["config"];
  objectTypesInContent: SkylarkObjectType[];
} => {
  const contentObjects =
    data?.pages?.flatMap(
      (page) => page.getObjectContent.content?.objects || [],
    ) || [];

  const parsedContent = parseObjectContent({ objects: contentObjects });

  const objectTypesInContent = parsedContent.objects.reduce(
    (arr, { objectType }) =>
      arr.includes(objectType) ? arr : [...arr, objectType],
    [] as string[],
  );

  const contentSortDirection =
    data?.pages?.[0].getObjectContent?.content_sort_direction || null;
  const contentSortField =
    data?.pages?.[0].getObjectContent?.content_sort_field || null;

  const contentLimit =
    typeof data?.pages?.[0].getObjectContent?.content_sort_field === "number"
      ? data?.pages?.[0].getObjectContent?.content_sort_field
      : null;

  return {
    objects: parsedContent.objects,
    config: {
      contentSortDirection,
      contentSortField,
      contentLimit,
    },
    objectTypesInContent,
  };
};

export const createGetObjectContentKeyPrefix = ({
  objectType,
  uid,
}: {
  objectType: string;
  uid: string;
}) => [QueryKeys.GetObjectContent, uid, objectType];

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
  queryFn: QueryFunction<GQLSkylarkGetObjectContentResponse, QueryKey, unknown>;
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
    QueryKey,
    unknown
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
  await queryClient.prefetchInfiniteQuery({
    queryKey,
    queryFn,
    initialPageParam: "",
  });
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

  const {
    data,
    hasNextPage,
    fetchNextPage,
    isLoading,
    isFetchingNextPage,
    isFetching,
  } = useInfiniteQuery<
    GQLSkylarkGetObjectContentResponse,
    GQLSkylarkErrorResponse<GQLSkylarkGetObjectContentResponse>,
    {
      objects: SkylarkObjectContentObject[];
      objectTypesInContent: SkylarkObjectType[];
      config: ModifiedContents["config"];
    }
  >({
    queryFn,
    queryKey,
    initialData: {
      pages: [
        {
          getObjectContent: {
            content: { objects: [] },
            content_sort_field: null,
            content_sort_direction: null,
            content_limit: null,
          },
        },
      ],
      pageParams: [],
    },
    initialPageParam: "",
    getNextPageParam: (lastPage): string | undefined =>
      lastPage.getObjectContent.content?.next_token || undefined,
    enabled: !!query,
    select,
  });

  if (hasNextPage) {
    fetchNextPage();
  }

  return {
    data,
    isLoading: isLoading || isFetching || !query,
    isFetching,
    query,
    variables,
    hasNextPage,
    isFetchingNextPage,
  };
};
