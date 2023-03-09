import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import dayjs from "dayjs";
import { DocumentNode } from "graphql";
import { RequestDocument } from "graphql-request";

import { QueryErrorMessages, QueryKeys } from "src/enums/graphql";
import {
  SkylarkObjectType,
  GQLSkylarkErrorResponse,
  GQLSkylarkGetObjectAvailabilityResponse,
  ParsedSkylarkObjectAvailabilityObject,
} from "src/interfaces/skylark";
import { skylarkRequest } from "src/lib/graphql/skylark/client";
import { createGetObjectAvailabilityQuery } from "src/lib/graphql/skylark/dynamicQueries";
import {
  getSingleAvailabilityStatus,
  is2038Problem,
} from "src/lib/skylark/availability";

import { useSkylarkObjectOperations } from "./useSkylarkObjectTypes";

export const createGetObjectAvailabilityKeyPrefix = ({
  objectType,
  uid,
}: {
  objectType: string;
  uid: string;
}) => [QueryKeys.GetObjectAvailability, objectType, uid];

export const useGetObjectAvailability = (
  objectType: SkylarkObjectType,
  uid: string,
) => {
  const { objectOperations } = useSkylarkObjectOperations(objectType);

  const query = createGetObjectAvailabilityQuery(objectOperations);
  const variables = { uid };

  // const { data, error, ...rest } = useQuery<
  //   GQLSkylarkGetObjectAvailabilityResponse,
  //   GQLSkylarkErrorResponse<GQLSkylarkGetObjectAvailabilityResponse>
  // >({
  //   queryKey: [
  //     ...createGetObjectAvailabilityKeyPrefix({ objectType, uid }),
  //     query,
  //     variables,
  //   ],
  //   queryFn: async () => skylarkRequest(query as DocumentNode, variables),
  //   enabled: query !== null,
  // });

  const { data, error, ...rest } = useInfiniteQuery<
    GQLSkylarkGetObjectAvailabilityResponse,
    GQLSkylarkErrorResponse<GQLSkylarkGetObjectAvailabilityResponse>
  >({
    queryKey: [QueryKeys.Search, query, variables],
    queryFn: async ({ pageParam: nextToken }) =>
      skylarkRequest(query as RequestDocument, {
        ...variables,
        nextToken,
      }),
    getNextPageParam: (lastPage): string | undefined => {
      const nextToken = lastPage.getObjectAvailability.availability.next_token;
      console.log({ nextToken });
      return nextToken || undefined;
    },
  });

  const now = dayjs();
  const availability: ParsedSkylarkObjectAvailabilityObject[] | undefined =
    data?.pages
      ?.flatMap((page) => page.getObjectAvailability.availability.objects)
      .map((object): ParsedSkylarkObjectAvailabilityObject => {
        const { start, end } = object;
        const neverExpires = is2038Problem(end || "");
        const status = getSingleAvailabilityStatus(now, start || "", end || "");

        return {
          ...object,
          title: object.title || "",
          slug: object.slug || "",
          start: object.slug || "",
          end: object.end || "",
          timezone: object.timezone || "",
          dimensions: object.dimensions.objects,
          status,
          neverExpires,
        };
      });

  console.log("Availability data", availability);
  return {
    ...rest,
    error,
    data: availability,
    isLoading: rest.isLoading || !query,
    isNotFound:
      error?.response.errors?.[0]?.errorType === QueryErrorMessages.NotFound,
    query,
    variables,
  };
};
