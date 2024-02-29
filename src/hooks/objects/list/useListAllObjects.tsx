import { QueryKey, useInfiniteQuery } from "@tanstack/react-query";
import { DocumentNode } from "graphql";

import { QueryKeys } from "src/enums/graphql";
import { useAllObjectsMeta } from "src/hooks/useSkylarkObjectTypes";
import {
  SkylarkObjectType,
  GQLSkylarkErrorResponse,
  ParsedSkylarkObject,
  NextToken,
  SkylarkGraphQLObject,
  SkylarkGraphQLObjectList,
} from "src/interfaces/skylark";
import { skylarkRequest } from "src/lib/graphql/skylark/client";
import { removeFieldPrefixFromReturnedObject } from "src/lib/graphql/skylark/dynamicQueries";
import { createListAllObjectsQuery } from "src/lib/graphql/skylark/dynamicQueries/listObjects";
import { parseSkylarkObject } from "src/lib/skylark/parsers";
import { hasProperty } from "src/lib/utils";

type PageParam = Record<string, string>;

type GQLSkylarkListAllObjectsResponse = Record<
  string,
  {
    next_token: NextToken;
    objects: SkylarkGraphQLObject[];
  }
>;

const getNextTokens = (data: GQLSkylarkListAllObjectsResponse) => {
  const nextTokens = Object.keys(data).reduce(
    (prev, objectType) => {
      const { next_token } = data[objectType] as SkylarkGraphQLObjectList;

      if (next_token) {
        return {
          ...prev,
          requestVariables: {
            ...prev.requestVariables,
            [`${objectType}NextToken`]: next_token,
          },
          objectTypesWithNextPage: [
            ...prev.objectTypesWithNextPage,
            objectType,
          ],
        };
      }

      return prev;
    },
    { requestVariables: {}, objectTypesWithNextPage: [] } as {
      requestVariables: Record<string, string>;
      objectTypesWithNextPage: string[];
    },
  );
  console.log({ nextTokens });
  return nextTokens;
};

export const useListAllObjects = () => {
  const { objects: allObjectsMeta } = useAllObjectsMeta(true);

  const query = createListAllObjectsQuery(allObjectsMeta, {
    typesToRequest: [],
  });

  const { data, error, isLoading, isError, hasNextPage, fetchNextPage } =
    useInfiniteQuery<
      GQLSkylarkListAllObjectsResponse,
      GQLSkylarkErrorResponse<GQLSkylarkListAllObjectsResponse>,
      Record<SkylarkObjectType, ParsedSkylarkObject[]>,
      QueryKey,
      PageParam
    >({
      // eslint-disable-next-line @tanstack/query/exhaustive-deps
      // queryKey: createGetObjectKeyPrefix({ objectType, uid, language }),
      queryKey: [QueryKeys.ListObjects, query],
      queryFn: async ({ pageParam: nextTokens }) =>
        skylarkRequest("query", query as DocumentNode, {
          language: "en-GB",
          ...nextTokens,
        }),
      enabled: query !== null,
      initialPageParam: {},
      getNextPageParam: (lastPage): PageParam | undefined => {
        const { requestVariables, objectTypesWithNextPage } =
          getNextTokens(lastPage);

        return objectTypesWithNextPage.length > 0
          ? requestVariables
          : undefined;
      },
      select: (data) => {
        console.log({ data });
        // return Object.entries(data).reduce(
        //   (prev, [objectType, { objects }]) => {
        //     return {
        //       ...prev,
        //       [objectType]: objects.map(
        //         removeFieldPrefixFromReturnedObject<SkylarkGraphQLObject>,
        //       ),
        //     };
        //   },
        //   {},
        // );

        return data.pages.reduce(
          (aggregate, page) => {
            const obj = Object.keys(page).reduce(
              (pageAggregate, objectType) => {
                const relationship = page[
                  objectType
                ] as SkylarkGraphQLObjectList;

                const parsedObjects = relationship.objects.map(
                  (relatedObject) =>
                    parseSkylarkObject(
                      removeFieldPrefixFromReturnedObject<SkylarkGraphQLObject>(
                        relatedObject,
                      ),
                    ),
                );

                return {
                  ...pageAggregate,
                  [objectType]: hasProperty(pageAggregate, objectType)
                    ? [...pageAggregate[objectType], ...parsedObjects]
                    : parsedObjects,
                };
              },
              aggregate,
            );

            return obj;
          },
          {} as Record<string, ParsedSkylarkObject[]>,
        );
      },
    });

  if (hasNextPage) {
    fetchNextPage();
  }

  console.log({ parsedData: data });

  return {
    error,
    data,
  };
};
