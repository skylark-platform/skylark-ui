import {
  InfiniteData,
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
  GQLSkylarkGetAvailabilityAssignedResponse,
  ParsedAvailabilityAssignedToObject,
  SkylarkGraphQLObject,
} from "src/interfaces/skylark";
import { skylarkRequest } from "src/lib/graphql/skylark/client";
import {
  createGetAvailabilityAssignedTo,
  createGetObjectContentQuery,
  removeFieldPrefixFromReturnedObject,
} from "src/lib/graphql/skylark/dynamicQueries";
import {
  parseObjectContent,
  parseSkylarkObject,
} from "src/lib/skylark/parsers";

const select = (
  data: InfiniteData<GQLSkylarkGetAvailabilityAssignedResponse>,
) =>
  data?.pages
    ?.flatMap((page) => page.getAvailability.assigned_to?.objects || [])
    .map(
      ({
        object,
        inherited,
        inheritance_source,
      }): ParsedAvailabilityAssignedToObject => {
        const normalisedObject =
          removeFieldPrefixFromReturnedObject<SkylarkGraphQLObject>(object);

        const parsedObject = parseSkylarkObject(normalisedObject);

        return {
          objectType: object.__typename,
          inherited: inherited || false,
          inheritedSource: inheritance_source || false,
          // meta: null,
          object: parsedObject,
        };
      },
    ) || [];

export const createGetAvailabilityAssignedToKeyPrefix = ({
  uid,
}: {
  uid: string;
}) => [QueryKeys.AvailabilityAssignedTo, { uid }];

const generateQueryFunctionAndKey = ({
  allObjectsMeta,
  variables,
}: {
  allObjectsMeta: SkylarkObjectMeta[] | null;
  variables: {
    uid: string;
  };
}): {
  queryFn: QueryFunction<
    GQLSkylarkGetAvailabilityAssignedResponse,
    QueryKey,
    unknown
  >;
  queryKey: QueryKey;
  query: DocumentNode | null;
} => {
  const query = createGetAvailabilityAssignedTo(allObjectsMeta);

  const queryFn: QueryFunction<
    GQLSkylarkGetAvailabilityAssignedResponse,
    QueryKey,
    unknown
  > = async ({ pageParam: nextToken }) => {
    return skylarkRequest("query", query as RequestDocument, {
      ...variables,
      nextToken,
    });
  };

  const queryKey: QueryKey = [
    ...createGetAvailabilityAssignedToKeyPrefix(variables),
    query,
    variables,
  ];

  return {
    queryFn,
    queryKey,
    query,
  };
};

export const useGetAvailabilityAssignedTo = (uid: string) => {
  const { objects: allObjectsMeta } = useAllObjectsMeta(false);

  const variables = { uid };

  const { queryFn, queryKey, query } = generateQueryFunctionAndKey({
    allObjectsMeta,
    variables,
  });

  const { data, hasNextPage, fetchNextPage, isLoading, isFetchingNextPage } =
    useInfiniteQuery<
      GQLSkylarkGetAvailabilityAssignedResponse,
      GQLSkylarkErrorResponse<GQLSkylarkGetAvailabilityAssignedResponse>,
      ParsedAvailabilityAssignedToObject[]
    >({
      queryFn,
      queryKey,
      initialPageParam: "",
      getNextPageParam: (lastPage): string | undefined =>
        lastPage.getAvailability.assigned_to?.next_token || undefined,
      enabled: !!query,
      select,
    });

  // if (hasNextPage) {
  //   fetchNextPage();
  // }

  console.log({ data });

  return {
    data,
    isLoading: isLoading || !query,
    query,
    variables,
    hasNextPage,
    isFetchingNextPage,
  };
};
