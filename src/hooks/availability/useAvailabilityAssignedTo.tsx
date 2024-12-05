import {
  InfiniteData,
  QueryFunction,
  QueryKey,
  useInfiniteQuery,
} from "@tanstack/react-query";
import { DocumentNode } from "graphql";
import { RequestDocument } from "graphql-request";

import { QueryKeys } from "src/enums/graphql";
import { useAllObjectsMeta } from "src/hooks/useSkylarkObjectTypes";
import {
  GQLSkylarkErrorResponse,
  SkylarkObjectMeta,
  GQLSkylarkGetAvailabilityAssignedResponse,
  AvailabilityAssignedToObject,
  SkylarkGraphQLObject,
} from "src/interfaces/skylark";
import { skylarkRequest } from "src/lib/graphql/skylark/client";
import {
  createGetAvailabilityAssignedTo,
  removeFieldPrefixFromReturnedObject,
} from "src/lib/graphql/skylark/dynamicQueries";
import { convertParsedObjectToIdentifier } from "src/lib/skylark/objects";
import { parseSkylarkObject } from "src/lib/skylark/parsers";

const select = (
  data: InfiniteData<GQLSkylarkGetAvailabilityAssignedResponse>,
) =>
  data?.pages
    ?.flatMap(
      (page) => page.getAvailabilityAssignedTo.assigned_to?.objects || [],
    )
    .map(
      ({
        object,
        inherited,
        inheritance_source,
        active,
      }): AvailabilityAssignedToObject => {
        const normalisedObject =
          removeFieldPrefixFromReturnedObject<SkylarkGraphQLObject>(object);

        const parsedObject = convertParsedObjectToIdentifier(
          parseSkylarkObject(normalisedObject),
        );

        return {
          objectType: object.__typename,
          inherited: inherited || false,
          inheritanceSource: inheritance_source || false,
          active: active ?? true,
          object: parsedObject,
        };
      },
    ) || [];

export const createGetAvailabilityAssignedToKeyPrefix = ({
  uid,
}: {
  uid: string;
}) => [QueryKeys.AvailabilityAssignedTo, uid];

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
      AvailabilityAssignedToObject[]
    >({
      queryFn,
      queryKey,
      initialPageParam: "",
      getNextPageParam: (lastPage): string | undefined =>
        lastPage.getAvailabilityAssignedTo.assigned_to?.next_token || undefined,
      enabled: !!query,
      select,
    });

  return {
    data,
    isLoading: isLoading || !query,
    query,
    variables,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
  };
};
