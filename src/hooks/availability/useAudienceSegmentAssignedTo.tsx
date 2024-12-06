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
  GQLSkylarkGetAudienceSegmentAssignedResponse,
  BuiltInSkylarkObjectType,
} from "src/interfaces/skylark";
import { skylarkRequest } from "src/lib/graphql/skylark/client";
import { createGetAudienceSegmentAssignedTo } from "src/lib/graphql/skylark/dynamicQueries";
import { convertParsedObjectToIdentifier } from "src/lib/skylark/objects";
import { parseSkylarkObject } from "src/lib/skylark/parsers";

const select = (
  data: InfiniteData<GQLSkylarkGetAudienceSegmentAssignedResponse>,
) =>
  data?.pages
    ?.flatMap(
      (page) => page.getAudienceSegmentAssignedTo.assigned_to?.objects || [],
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
    GQLSkylarkGetAudienceSegmentAssignedResponse,
    QueryKey,
    unknown
  >;
  queryKey: QueryKey;
  query: DocumentNode | null;
} => {
  const query = createGetAudienceSegmentAssignedTo(availabilityObjectMeta);

  const queryFn: QueryFunction<
    GQLSkylarkGetAudienceSegmentAssignedResponse,
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

export const useGetAudienceSegmentAssignedTo = (
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
      GQLSkylarkGetAudienceSegmentAssignedResponse,
      GQLSkylarkErrorResponse<GQLSkylarkGetAudienceSegmentAssignedResponse>,
      AvailabilityAssignedToObject[]
    >({
      queryFn,
      queryKey,
      initialPageParam: "",
      getNextPageParam: (lastPage): string | undefined =>
        lastPage.getAudienceSegmentAssignedTo.assigned_to?.next_token ||
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
