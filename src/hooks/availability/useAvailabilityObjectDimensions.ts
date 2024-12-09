import { useInfiniteQuery } from "@tanstack/react-query";
import { RequestDocument } from "graphql-request";
import { useMemo } from "react";

import { QueryKeys } from "src/enums/graphql";
import { useSkylarkObjectOperations } from "src/hooks/useSkylarkObjectTypes";
import {
  GQLSkylarkErrorResponse,
  SkylarkGraphQLAvailabilityDimensionWithValues,
  GQLSkylarkGetObjectDimensions,
} from "src/interfaces/skylark";
import { skylarkRequest } from "src/lib/graphql/skylark/client";
import { createGetAssignedDimensionsQuery } from "src/lib/graphql/skylark/dynamicQueries";

export const createGetAvailabilityObjectDimensionsKeyPrefix = ({
  uid,
  objectType,
}: {
  uid: string;
  objectType: string;
}) => [QueryKeys.GetObjectDimensions, uid, objectType];

export const useAvailabilityObjectDimensions = (
  objectType: string,
  uid: string,
) => {
  const { objectOperations: objectMeta } =
    useSkylarkObjectOperations(objectType);

  const query = createGetAssignedDimensionsQuery(objectMeta);
  const variables = { uid, nextToken: "" };

  const { data, isLoading } = useInfiniteQuery<
    GQLSkylarkGetObjectDimensions,
    GQLSkylarkErrorResponse<GQLSkylarkGetObjectDimensions>
  >({
    queryKey: [
      ...createGetAvailabilityObjectDimensionsKeyPrefix({ uid, objectType }),
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
      lastPage.getObjectDimensions.dimensions?.next_token || undefined,
    enabled: !!query,
  });

  const availabilityDimensions:
    | SkylarkGraphQLAvailabilityDimensionWithValues[]
    | undefined = useMemo(
    () =>
      data?.pages?.flatMap(
        (page) => page.getObjectDimensions?.dimensions?.objects || [],
      ),
    [data?.pages],
  );

  return {
    data: availabilityDimensions,
    query,
    variables,
    isLoading,
  };
};
