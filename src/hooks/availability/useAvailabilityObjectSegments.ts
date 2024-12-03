import { useInfiniteQuery } from "@tanstack/react-query";
import { RequestDocument } from "graphql-request";
import { useMemo } from "react";

import { QueryKeys } from "src/enums/graphql";
import { useSkylarkObjectOperations } from "src/hooks/useSkylarkObjectTypes";
import {
  GQLSkylarkErrorResponse,
  GQLSkylarkGetObjectSegments,
  SkylarkGraphQLAvailabilitySegment,
} from "src/interfaces/skylark";
import { skylarkRequest } from "src/lib/graphql/skylark/client";
import { createGetAssignedSegmentsQuery } from "src/lib/graphql/skylark/dynamicQueries";

export const createGetAvailabilityObjectSegmentsKeyPrefix = ({
  uid,
  objectType,
}: {
  uid: string;
  objectType: string;
}) => [QueryKeys.GetObjectDimensions, uid, objectType];

export const useAvailabilityObjectSegments = (
  objectType: string,
  uid: string,
) => {
  const { objectOperations: objectMeta } =
    useSkylarkObjectOperations(objectType);

  const query = createGetAssignedSegmentsQuery(objectMeta);
  const variables = { uid, nextToken: "" };

  const { data, isLoading } = useInfiniteQuery<
    GQLSkylarkGetObjectSegments,
    GQLSkylarkErrorResponse<GQLSkylarkGetObjectSegments>
  >({
    queryKey: [
      ...createGetAvailabilityObjectSegmentsKeyPrefix({ uid, objectType }),
      query,
      variables,
    ],
    initialPageParam: "",
    queryFn: async ({ pageParam: nextToken }) =>
      skylarkRequest("query", query as RequestDocument, {
        ...variables,
        nextToken,
      }),
    getNextPageParam: (lastPage): string | undefined =>
      lastPage.getObjectSegments.segments?.next_token || undefined,
    enabled: !!query,
  });

  const segments: SkylarkGraphQLAvailabilitySegment[] | undefined = useMemo(
    () =>
      data?.pages?.flatMap(
        (page) => page.getObjectSegments?.segments?.objects || [],
      ),
    [data?.pages],
  );

  return {
    segments,
    query,
    variables,
    isLoading,
  };
};
