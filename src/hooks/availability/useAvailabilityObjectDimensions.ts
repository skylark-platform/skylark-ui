import { useInfiniteQuery } from "@tanstack/react-query";
import { RequestDocument } from "graphql-request";

import { QueryKeys } from "src/enums/graphql";
import {
  GQLSkylarkErrorResponse,
  ParsedSkylarkObjectAvailabilityObject,
  GQLSkylarkGetAvailabilityDimensions,
} from "src/interfaces/skylark";
import { skylarkRequest } from "src/lib/graphql/skylark/client";
import { GET_AVAILABILITY_DIMENSIONS } from "src/lib/graphql/skylark/queries";

export const createGetAvailabilityObjectDimensionsKeyPrefix = ({
  uid,
}: {
  uid: string;
}) => [QueryKeys.GetObjectDimensions, { uid }];

export const useAvailabilityObjectDimensions = (uid: string) => {
  const query = GET_AVAILABILITY_DIMENSIONS;
  const variables = { uid, nextToken: "" };

  const { data, isLoading } = useInfiniteQuery<
    GQLSkylarkGetAvailabilityDimensions,
    GQLSkylarkErrorResponse<GQLSkylarkGetAvailabilityDimensions>
  >({
    queryKey: [
      ...createGetAvailabilityObjectDimensionsKeyPrefix({ uid }),
      query,
      variables,
    ],
    queryFn: async ({ pageParam: nextToken }) =>
      skylarkRequest("query", query as RequestDocument, {
        ...variables,
        nextToken,
      }),
    getNextPageParam: (lastPage): string | undefined =>
      lastPage.getAvailability.dimensions?.next_token || undefined,
  });

  const availabilityDimensions:
    | ParsedSkylarkObjectAvailabilityObject["dimensions"]
    | undefined = data?.pages?.flatMap(
    (page) => page.getAvailability.dimensions.objects,
  );

  return {
    data: availabilityDimensions,
    query,
    variables,
    isLoading,
  };
};
