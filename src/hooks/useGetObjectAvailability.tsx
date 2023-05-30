import { useInfiniteQuery } from "@tanstack/react-query";
import dayjs from "dayjs";
import { RequestDocument } from "graphql-request";
import { useMemo } from "react";

import { QueryKeys } from "src/enums/graphql";
import {
  SkylarkObjectType,
  GQLSkylarkErrorResponse,
  GQLSkylarkGetObjectAvailabilityResponse,
  ParsedSkylarkObjectAvailabilityObject,
} from "src/interfaces/skylark";
import { skylarkRequest } from "src/lib/graphql/skylark/client";
import { createGetObjectAvailabilityQuery } from "src/lib/graphql/skylark/dynamicQueries";

import { GetObjectOptions } from "./useGetObject";
import { useSkylarkObjectOperations } from "./useSkylarkObjectTypes";

export const createGetObjectAvailabilityKeyPrefix = ({
  objectType,
  uid,
}: {
  objectType: string;
  uid: string;
}) => [QueryKeys.GetObjectAvailability, { objectType, uid }];

export const useGetObjectAvailability = (
  objectType: SkylarkObjectType,
  uid: string,
  opts?: GetObjectOptions,
) => {
  const { language }: GetObjectOptions = opts || { language: null };

  const { objectOperations } = useSkylarkObjectOperations(objectType);

  const query = createGetObjectAvailabilityQuery(objectOperations, !!language);
  const variables = { uid, nextToken: "", language };

  const { data, ...rest } = useInfiniteQuery<
    GQLSkylarkGetObjectAvailabilityResponse,
    GQLSkylarkErrorResponse<GQLSkylarkGetObjectAvailabilityResponse>
  >({
    queryKey: [
      ...createGetObjectAvailabilityKeyPrefix({ objectType, uid }),
      query,
      variables,
    ],
    queryFn: async ({ pageParam: nextToken }) =>
      skylarkRequest(query as RequestDocument, {
        ...variables,
        nextToken,
      }),
    getNextPageParam: (lastPage): string | undefined =>
      lastPage.getObjectAvailability.availability?.next_token || undefined,
  });

  const availability: ParsedSkylarkObjectAvailabilityObject[] | undefined =
    useMemo(
      () =>
        data?.pages
          ?.flatMap((page) => page.getObjectAvailability.availability.objects)
          .map((object): ParsedSkylarkObjectAvailabilityObject => {
            return {
              ...object,
              title: object.title || "",
              slug: object.slug || "",
              start: object.start || "",
              end: object.end || "",
              timezone: object.timezone || "",
              dimensions: object.dimensions.objects,
            };
          }),
      [data?.pages],
    );

  return {
    ...rest,
    data: availability,
    isLoading: rest.isLoading || !query,
    query,
    variables,
  };
};
