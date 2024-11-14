import {
  InfiniteData,
  QueryKey,
  useInfiniteQuery,
} from "@tanstack/react-query";
import { DocumentNode } from "graphql";
import { useMemo } from "react";

import { QueryKeys } from "src/enums/graphql";
import {
  useAllObjectsMeta,
  useSkylarkObjectOperations,
  useSkylarkObjectTypesWithConfig,
} from "src/hooks/useSkylarkObjectTypes";
import {
  GQLSkylarkErrorResponse,
  GQLSkylarkGetObjectRelationshipsResponse,
  GQLSkylarkGetObjectResponse,
  NormalizedObjectField,
  SkylarkObjectRelationships,
  SkylarkGraphQLObjectList,
  SkylarkObjectMeta,
  SkylarkObjectType,
  SkylarkGraphQLRelationshipList,
  SkylarkObjectRelationship,
} from "src/interfaces/skylark";
import { skylarkRequest } from "src/lib/graphql/skylark/client";
import { createGetObjectRelationshipsQuery } from "src/lib/graphql/skylark/dynamicQueries";
import { convertParsedObjectToIdentifier } from "src/lib/skylark/objects";
import { parseSkylarkObject } from "src/lib/skylark/parsers";
import { getObjectTypeFromListingTypeName, hasProperty } from "src/lib/utils";

import { GetObjectOptions } from "./useGetObject";

type PageParam = Record<string, string>;

const getFieldsFromObjectType = (
  objects: SkylarkObjectMeta[] | null,
  objectType: string,
) => {
  const object = objects?.find(({ name }) => name === objectType);
  return object?.fields || [];
};

const getRelationshipNextTokens = (
  response: GQLSkylarkGetObjectRelationshipsResponse,
) => {
  const data = response.getObjectRelationships;
  return Object.keys(data).reduce(
    (prev, relationshipName) => {
      const relationship = data[relationshipName] as SkylarkGraphQLObjectList;

      if (relationship?.next_token) {
        return {
          ...prev,
          requestVariables: {
            ...prev.requestVariables,
            [`${relationshipName}NextToken`]: relationship.next_token,
          },
          relationshipsWithNextPage: [
            ...prev.relationshipsWithNextPage,
            relationshipName,
          ],
        };
      }

      return prev;
    },
    { requestVariables: {}, relationshipsWithNextPage: [] } as {
      requestVariables: Record<string, string>;
      relationshipsWithNextPage: string[];
    },
  );
};

export const createGetObjectRelationshipsKeyPrefix = ({
  objectType,
  uid,
}: {
  objectType: string;
  uid: string;
}) => [QueryKeys.GetObjectRelationships, uid, objectType];

export const useGetObjectRelationships = (
  objectType: SkylarkObjectType,
  uid: string,
  opts: GetObjectOptions,
) => {
  const { language }: GetObjectOptions = opts || { language: null };

  const { objectOperations } = useSkylarkObjectOperations(objectType);
  const { objects } = useAllObjectsMeta(true);

  const { objectTypesConfig } = useSkylarkObjectTypesWithConfig();

  const relationshipsFields: { [key: string]: NormalizedObjectField[] } =
    objectOperations?.relationships.reduce((acc, { objectType }) => {
      const fields = getFieldsFromObjectType(objects, objectType);
      return { ...acc, [objectType]: fields };
    }, {}) || {};

  const query = createGetObjectRelationshipsQuery(
    objectOperations,
    relationshipsFields,
    !!language,
  );
  const variables = { uid, language };

  const { data, isLoading, fetchNextPage, isFetchingNextPage } =
    useInfiniteQuery<
      GQLSkylarkGetObjectRelationshipsResponse,
      GQLSkylarkErrorResponse<GQLSkylarkGetObjectResponse>,
      InfiniteData<GQLSkylarkGetObjectRelationshipsResponse>,
      QueryKey,
      PageParam
    >({
      // eslint-disable-next-line @tanstack/query/exhaustive-deps
      queryKey: createGetObjectRelationshipsKeyPrefix({ objectType, uid }),
      queryFn: async ({ pageParam: nextTokens }) =>
        skylarkRequest("query", query as DocumentNode, {
          ...variables,
          ...nextTokens,
        }),
      initialPageParam: {},
      getNextPageParam: (lastPage): PageParam | undefined => {
        const { requestVariables, relationshipsWithNextPage } =
          getRelationshipNextTokens(lastPage);

        return relationshipsWithNextPage.length > 0
          ? requestVariables
          : undefined;
      },
      enabled: query !== null,
    });

  const relationships: SkylarkObjectRelationships | null = useMemo(() => {
    if (!data?.pages || data.pages.length === 0) {
      return null;
    }

    return data.pages.reduce((aggregate, page) => {
      const obj = Object.keys(page.getObjectRelationships).reduce(
        (pageAggregate, name) => {
          const relationship = page.getObjectRelationships[
            name
          ] as SkylarkGraphQLRelationshipList | null;

          if (!relationship) {
            return pageAggregate;
          }

          const parsedObjects = relationship.objects.map((relatedObject) =>
            convertParsedObjectToIdentifier(
              parseSkylarkObject(relatedObject),
              objectTypesConfig,
              { additionalFields: true },
            ),
          );

          const objectType = getObjectTypeFromListingTypeName(
            relationship.__typename,
          );

          const parsedRelationship: SkylarkObjectRelationship = hasProperty(
            pageAggregate,
            name,
          )
            ? {
                ...pageAggregate[name],
                objects: [...pageAggregate[name].objects, ...parsedObjects],
              }
            : {
                objectType,
                objects: parsedObjects,
                name,
                config: {
                  defaultSortField:
                    relationship.relationship_config?.default_sort_field ||
                    null,
                  inheritAvailability:
                    relationship.relationship_config?.inherit_availability ||
                    null,
                },
              };

          return {
            ...pageAggregate,
            [name]: parsedRelationship,
          };
        },
        aggregate,
      );

      return obj;
    }, {} as SkylarkObjectRelationships);
  }, [data?.pages, objectTypesConfig]);

  const { relationshipsWithNextPage } = data
    ? getRelationshipNextTokens(data.pages[data.pages.length - 1])
    : { relationshipsWithNextPage: [] as string[] };

  return {
    relationships,
    relationshipsWithNextPage,
    objectRelationships: objectOperations?.relationships,
    isLoading: isLoading || !query,
    isFetchingNextPage,
    query,
    variables,
    fetchNextPage,
  };
};
