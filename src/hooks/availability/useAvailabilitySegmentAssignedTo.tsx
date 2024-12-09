import {
  InfiniteData,
  QueryFunction,
  QueryKey,
  useInfiniteQuery,
} from "@tanstack/react-query";
import { DocumentNode } from "graphql";
import { RequestDocument } from "graphql-request";

import { QueryKeys } from "src/enums/graphql";
import { useSkylarkObjectOperations } from "src/hooks/useSkylarkObjectTypes";
import {
  GQLSkylarkErrorResponse,
  SkylarkObjectMeta,
  AvailabilityAssignedToObject,
  GQLSkylarkGetAvailabilitySegmentAssignedResponse,
  BuiltInSkylarkObjectType,
} from "src/interfaces/skylark";
import { skylarkRequest } from "src/lib/graphql/skylark/client";
import { createGetAvailabilitySegmentAssignedTo } from "src/lib/graphql/skylark/dynamicQueries";
import { convertParsedObjectToIdentifier } from "src/lib/skylark/objects";
import { parseSkylarkObject } from "src/lib/skylark/parsers";

const select = (
  data: InfiniteData<GQLSkylarkGetAvailabilitySegmentAssignedResponse>,
) =>
  data?.pages
    ?.flatMap(
      (page) =>
        page.getAvailabilitySegmentAssignedTo.assigned_to?.objects || [],
    )
    .map((object): AvailabilityAssignedToObject => {
      const parsedObject = convertParsedObjectToIdentifier(
        parseSkylarkObject(object),
      );

      return {
        objectType: object.__typename,
        inherited: object.inherited || false,
        inheritanceSource: object.inheritance_source || false,
        active: object.active ?? true,
        object: parsedObject,
      };
    }) || [];

export const createGetAvailabilityAssignedToKeyPrefix = ({
  uid,
}: {
  uid: string;
}) => [QueryKeys.AvailabilityAssignedTo, uid];

const generateQueryFunctionAndKey = ({
  availabilityObjectMeta,
  variables,
}: {
  availabilityObjectMeta: SkylarkObjectMeta | null;
  variables: {
    uid: string;
  };
}): {
  queryFn: QueryFunction<
    GQLSkylarkGetAvailabilitySegmentAssignedResponse,
    QueryKey,
    unknown
  >;
  queryKey: QueryKey;
  query: DocumentNode | null;
} => {
  const query = createGetAvailabilitySegmentAssignedTo(availabilityObjectMeta);

  const queryFn: QueryFunction<
    GQLSkylarkGetAvailabilitySegmentAssignedResponse,
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

export const useGetAvailabilitySegmentAssignedTo = (
  uid: string,
  { disabled }: { disabled?: boolean },
) => {
  const { objectOperations: availabilityObjectMeta } =
    useSkylarkObjectOperations(BuiltInSkylarkObjectType.Availability);

  const variables = { uid };

  const { queryFn, queryKey, query } = generateQueryFunctionAndKey({
    availabilityObjectMeta,
    variables,
  });

  const { data, hasNextPage, fetchNextPage, isLoading, isFetchingNextPage } =
    useInfiniteQuery<
      GQLSkylarkGetAvailabilitySegmentAssignedResponse,
      GQLSkylarkErrorResponse<GQLSkylarkGetAvailabilitySegmentAssignedResponse>,
      AvailabilityAssignedToObject[]
    >({
      queryFn,
      queryKey,
      initialPageParam: "",
      getNextPageParam: (lastPage): string | undefined =>
        lastPage.getAvailabilitySegmentAssignedTo.assigned_to?.next_token ||
        undefined,
      enabled: !!query && !disabled,
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
