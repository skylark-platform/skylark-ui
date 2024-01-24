import {
  InfiniteData,
  QueryFunction,
  QueryKey,
  useInfiniteQuery,
} from "@tanstack/react-query";
import { DocumentNode } from "graphql";
import { RequestDocument } from "graphql-request";
import { useCallback } from "react";

import { QueryKeys } from "src/enums/graphql";
import {
  useAllObjectsMeta,
  useSkylarkObjectOperations,
} from "src/hooks/useSkylarkObjectTypes";
import {
  SkylarkObjectType,
  GQLSkylarkErrorResponse,
  SkylarkObjectMeta,
  GQLSkylarkGetObjectAvailabilityInheritanceResponse,
  ParsedSkylarkObject,
  ParsedSkylarkObjectAvailabilityInheritance,
  SkylarkGraphQLObject,
} from "src/interfaces/skylark";
import { skylarkRequest } from "src/lib/graphql/skylark/client";
import {
  createGetObjectAvailabilityInheritanceQuery,
  removeFieldPrefixFromReturnedObject,
} from "src/lib/graphql/skylark/dynamicQueries";
import { parseSkylarkObject } from "src/lib/skylark/parsers";

type PageParam = {
  inheritedByNextToken: string;
  inheritedFromNextToken: string;
};

export const createGetObjectAvailabilityInheritanceKeyPrefix = ({
  objectType,
  objectUid,
  availabilityUid,
}: {
  objectType: string;
  objectUid: string;
  availabilityUid: string;
}) => [
  QueryKeys.GetObjectAvailability,
  { objectType, objectUid, availabilityUid },
  "Inheritance",
];

const generateQueryFunctionAndKey = ({
  objectMeta,
  allObjectsMeta,
  objectType,
  objectUid,
  availabilityUid,
  variables,
}: {
  objectMeta: SkylarkObjectMeta | null;
  allObjectsMeta: SkylarkObjectMeta[] | null;
  objectType: SkylarkObjectType;
  objectUid: string;
  availabilityUid: string;
  variables: {
    objectUid: string;
    availabilityUid: string;
  };
}): {
  queryFn: QueryFunction<
    GQLSkylarkGetObjectAvailabilityInheritanceResponse,
    QueryKey,
    PageParam
  >;
  queryKey: QueryKey;
  query: DocumentNode | null;
} => {
  const query = createGetObjectAvailabilityInheritanceQuery(
    objectMeta,
    allObjectsMeta,
  );

  const queryFn: QueryFunction<
    GQLSkylarkGetObjectAvailabilityInheritanceResponse,
    QueryKey,
    PageParam
  > = async ({ pageParam: nextTokens }) =>
    skylarkRequest("query", query as RequestDocument, {
      ...variables,
      ...nextTokens,
    });

  const queryKey: QueryKey = [
    ...createGetObjectAvailabilityInheritanceKeyPrefix({
      objectType,
      objectUid,
      availabilityUid,
    }),
    query,
    variables,
  ];

  return {
    queryFn,
    queryKey,
    query,
  };
};

export const useGetObjectAvailabilityInheritance = ({
  objectType,
  objectUid,
  availabilityUid,
}: {
  objectType: SkylarkObjectType;
  objectUid: string;
  availabilityUid: string;
}) => {
  const { objectOperations: objectMeta } =
    useSkylarkObjectOperations(objectType);

  const { objects: allObjectsMeta } = useAllObjectsMeta();

  const variables = {
    objectUid,
    availabilityUid,
  };

  const { queryFn, queryKey, query } = generateQueryFunctionAndKey({
    objectMeta,
    allObjectsMeta,
    objectType,
    objectUid,
    availabilityUid,
    variables,
  });

  const select = useCallback(
    (
      data: InfiniteData<
        GQLSkylarkGetObjectAvailabilityInheritanceResponse,
        PageParam
      >,
    ) => {
      const parseObject = (object: SkylarkGraphQLObject) =>
        parseSkylarkObject(
          removeFieldPrefixFromReturnedObject<SkylarkGraphQLObject>(object),
          allObjectsMeta?.find(({ name }) => name === object.__typename),
        );

      return data.pages.reduce(
        (prev, page, index) => {
          const inheritedFromDataUsedNextToken = Boolean(
            index === 0 || data.pageParams[index - 1].inheritedFromNextToken,
          );
          const inheritedByDataUsedNextToken = Boolean(
            index === 0 || data.pageParams[index - 1].inheritedByNextToken,
          );

          const inheritedFrom =
            (inheritedFromDataUsedNextToken &&
              page.getObjectAvailabilityInheritance?.availability.objects[0]?.inherited_from?.objects.map(
                parseObject,
              )) ||
            [];

          const inheritedBy =
            (inheritedByDataUsedNextToken &&
              page.getObjectAvailabilityInheritance?.availability.objects[0]?.inherited_by?.objects.map(
                parseObject,
              )) ||
            [];

          return {
            inheritedFrom: [...prev.inheritedFrom, ...inheritedFrom],
            inheritedBy: [...prev.inheritedBy, ...inheritedBy],
          };
        },
        {
          inheritedFrom: [] as ParsedSkylarkObject[],
          inheritedBy: [] as ParsedSkylarkObject[],
        },
      );
    },
    [allObjectsMeta],
  );

  const { data, isLoading, hasNextPage, fetchNextPage } = useInfiniteQuery<
    GQLSkylarkGetObjectAvailabilityInheritanceResponse,
    GQLSkylarkErrorResponse<GQLSkylarkGetObjectAvailabilityInheritanceResponse>,
    ParsedSkylarkObjectAvailabilityInheritance,
    QueryKey,
    PageParam
  >({
    queryFn,
    queryKey,
    initialPageParam: { inheritedByNextToken: "", inheritedFromNextToken: "" },
    getNextPageParam: (lastPage): PageParam | undefined => {
      const availability =
        lastPage.getObjectAvailabilityInheritance?.availability.objects[0];
      const inheritedByNextToken = availability?.inherited_by?.next_token || "";
      const inheritedFromNextToken =
        availability?.inherited_from?.next_token || "";
      return inheritedByNextToken || inheritedFromNextToken
        ? { inheritedByNextToken, inheritedFromNextToken }
        : undefined;
    },
    select,
    enabled: !!query,
  });

  return {
    data,
    isLoading: isLoading || !query,
    hasNextPage,
    fetchNextPage,
    query,
    variables,
  };
};
