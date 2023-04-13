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
  GQLSkylarkGetObjectContentOfResponse,
  SkylarkGraphQLObject,
} from "src/interfaces/skylark";
import { skylarkRequest } from "src/lib/graphql/skylark/client";
import {
  createGetObjectAvailabilityQuery,
  createGetObjectContentOfQuery,
  removeFieldPrefixFromReturnedObject,
} from "src/lib/graphql/skylark/dynamicQueries";
import {
  getSingleAvailabilityStatus,
  is2038Problem,
} from "src/lib/skylark/availability";
import { parseSkylarkObject } from "src/lib/skylark/parsers";

import { GetObjectOptions } from "./useGetObject";
import {
  useAllSetObjectsMeta,
  useSkylarkObjectOperations,
  useSkylarkSetObjectTypes,
} from "./useSkylarkObjectTypes";

export const createGetObjectContentOfKeyPrefix = ({
  objectType,
  uid,
}: {
  objectType: string;
  uid: string;
}) => [QueryKeys.GetObjectContentOf, objectType, uid];

export const useGetObjectContentOf = (
  objectType: SkylarkObjectType,
  uid: string,
  opts: GetObjectOptions,
) => {
  const { language }: GetObjectOptions = opts || { language: null };

  const { objectOperations } = useSkylarkObjectOperations(objectType);

  const { setObjects } = useAllSetObjectsMeta();

  const query = createGetObjectContentOfQuery(objectOperations, setObjects);
  const variables = { uid, nextToken: "", language };

  const { data: contentOfResponse, ...rest } = useInfiniteQuery<
    GQLSkylarkGetObjectContentOfResponse,
    GQLSkylarkErrorResponse<GQLSkylarkGetObjectContentOfResponse>
  >({
    queryKey: [
      createGetObjectContentOfKeyPrefix({ uid, objectType }),
      query,
      variables,
    ],
    queryFn: async ({ pageParam: nextToken }) =>
      skylarkRequest(query as RequestDocument, {
        ...variables,
        nextToken,
      }),
    getNextPageParam: (lastPage): string | undefined =>
      lastPage.getObjectContentOf.content_of.next_token || undefined,
  });

  const data = useMemo(() => {
    const graphQLObjects = contentOfResponse?.pages?.flatMap(
      (page) => page.getObjectContentOf.content_of.objects,
    ) as SkylarkGraphQLObject[];

    const normalisedObjects =
      graphQLObjects?.map(
        removeFieldPrefixFromReturnedObject<SkylarkGraphQLObject>,
      ) || [];

    const parsedObjects = normalisedObjects.map((obj) => {
      const objectMeta = setObjects.find(({ name }) => name === obj.__typename);
      return parseSkylarkObject(obj, objectMeta);
    });

    return parsedObjects;
  }, [contentOfResponse?.pages, setObjects]);

  return {
    ...rest,
    data,
    isLoading: rest.isLoading || !query,
    query,
    variables,
  };
};
