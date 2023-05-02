import { useInfiniteQuery } from "@tanstack/react-query";
import dayjs from "dayjs";
import { RequestDocument } from "graphql-request";

import { QueryKeys } from "src/enums/graphql";
import { useSkylarkObjectOperations } from "src/hooks/useSkylarkObjectTypes";
import {
  SkylarkObjectType,
  GQLSkylarkErrorResponse,
  GQLSkylarkGetObjectAvailabilityResponse,
  ParsedSkylarkObjectAvailabilityObject,
  BuiltInSkylarkObjectType,
  GQLSkylarkGetAvailabilityDimensions,
  SkylarkGraphQLAvailabilityDimensionWithValues,
} from "src/interfaces/skylark";
import { skylarkRequest } from "src/lib/graphql/skylark/client";
import { createGetObjectAvailabilityQuery } from "src/lib/graphql/skylark/dynamicQueries";
import { GET_AVAILABILITY_DIMENSIONS } from "src/lib/graphql/skylark/queries";
import {
  getSingleAvailabilityStatus,
  is2038Problem,
} from "src/lib/skylark/availability";

export const createGetAvailabilityObjectDimensionsKeyPrefix = ({
  uid,
}: {
  uid: string;
}) => [QueryKeys.GetObjectDimensions, { uid }];

export const useAvailabilityObjectDimensions = (uid: string) => {
  const query = GET_AVAILABILITY_DIMENSIONS;
  const variables = { uid, nextToken: "" };

  const { data, ...rest } = useInfiniteQuery<
    GQLSkylarkGetAvailabilityDimensions,
    GQLSkylarkErrorResponse<GQLSkylarkGetAvailabilityDimensions>
  >({
    queryKey: [
      ...createGetAvailabilityObjectDimensionsKeyPrefix({ uid }),
      query,
      variables,
    ],
    queryFn: async ({ pageParam: nextToken }) =>
      skylarkRequest(query as RequestDocument, {
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
    ...rest,
    data: availabilityDimensions,
    query,
    variables,
  };
};
