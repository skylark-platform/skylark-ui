import { useInfiniteQuery } from "@tanstack/react-query";
import { RequestDocument } from "graphql-request";
import { useMemo } from "react";

import { QueryKeys } from "src/enums/graphql";
import {
  useAllSetObjectsMeta,
  useSkylarkObjectOperations,
} from "src/hooks/useSkylarkObjectTypes";
import {
  SkylarkObjectType,
  GQLSkylarkErrorResponse,
  GQLSkylarkGetObjectContentOfResponse,
  SkylarkGraphQLObject,
} from "src/interfaces/skylark";
import { skylarkRequest } from "src/lib/graphql/skylark/client";
import {
  createGetObjectContentOfQuery,
  removeFieldPrefixFromReturnedObject,
} from "src/lib/graphql/skylark/dynamicQueries";
import { convertParsedObjectToIdentifier } from "src/lib/skylark/objects";
import { parseSkylarkObject } from "src/lib/skylark/parsers";

import { GetObjectOptions } from "./useGetObject";

export const createGetObjectContentOfKeyPrefix = ({
  objectType,
  uid,
}: {
  objectType: string;
  uid: string;
}) => [QueryKeys.GetObjectContentOf, uid, objectType];

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

  const {
    data: contentOfResponse,
    isLoading,
    hasNextPage,
    fetchNextPage,
  } = useInfiniteQuery<
    GQLSkylarkGetObjectContentOfResponse,
    GQLSkylarkErrorResponse<GQLSkylarkGetObjectContentOfResponse>
  >({
    queryKey: [
      createGetObjectContentOfKeyPrefix({ uid, objectType }),
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

    const parsed = normalisedObjects.map((obj) => {
      const objectMeta = setObjects.find(({ name }) => name === obj.__typename);
      return convertParsedObjectToIdentifier(
        parseSkylarkObject(obj, objectMeta),
      );
    });

    return parsed;
  }, [contentOfResponse?.pages, setObjects]);

  if (hasNextPage) {
    // Always fetch every page
    fetchNextPage();
  }

  return {
    data,
    isLoading: isLoading || !query,
    query,
    variables,
  };
};
