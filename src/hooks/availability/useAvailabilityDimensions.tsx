import { useInfiniteQuery } from "@tanstack/react-query";

import { QueryKeys } from "src/enums/graphql";
import {
  GQLSkylarkListAvailabilityDimensionsResponse,
  SkylarkGraphQLAvailabilityDimension,
} from "src/interfaces/skylark";
import { skylarkRequest } from "src/lib/graphql/skylark/client";
import { LIST_AVAILABILITY_DIMENSIONS } from "src/lib/graphql/skylark/queries";

export const useAvailabilityDimensions = () => {
  const { data, fetchNextPage, hasNextPage, isLoading } =
    useInfiniteQuery<GQLSkylarkListAvailabilityDimensionsResponse>({
      queryKey: [
        QueryKeys.AvailabilityDimensions,
        LIST_AVAILABILITY_DIMENSIONS,
      ],
      queryFn: async ({ pageParam: nextToken }) =>
        skylarkRequest("query", LIST_AVAILABILITY_DIMENSIONS, {
          nextToken,
        }),
      getNextPageParam: (lastPage): string | undefined => {
        return lastPage.listDimensions.next_token || undefined;
      },
    });

  // This if statement ensures that all data is fetched
  // We could remove it and add a load more button
  if (hasNextPage) {
    void fetchNextPage();
  }

  const dimensions: SkylarkGraphQLAvailabilityDimension[] | undefined =
    !hasNextPage && data
      ? data.pages.flatMap((item) => item.listDimensions.objects)
      : undefined;

  return {
    dimensions,
    isLoading,
  };
};
