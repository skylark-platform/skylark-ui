import { useQuery } from "@tanstack/react-query";
import { DocumentNode } from "graphql";
import { useMemo } from "react";

import { QueryKeys } from "src/enums/graphql";
import {
  useAllObjectsMeta,
  useSkylarkObjectOperations,
} from "src/hooks/useSkylarkObjectTypes";
import {
  GQLSkylarkErrorResponse,
  GQLSkylarkGetObjectRelationshipsResponse,
  GQLSkylarkGetObjectResponse,
  NormalizedObjectField,
  ParsedSkylarkObjectRelationships,
  SkylarkGraphQLObject,
  SkylarkGraphQLObjectRelationship,
  SkylarkObjectMeta,
  SkylarkObjectType,
} from "src/interfaces/skylark";
import { skylarkRequest } from "src/lib/graphql/skylark/client";
import { createGetObjectRelationshipsQuery } from "src/lib/graphql/skylark/dynamicQueries";
import { parseSkylarkObject } from "src/lib/skylark/parsers";
import { getObjectTypeFromListingTypeName } from "src/lib/utils";

import { GetObjectOptions } from "./useGetObject";

const getFieldsFromObjectType = (
  objects: SkylarkObjectMeta[] | null,
  objectType: string,
) => {
  const object = objects?.find(({ name }) => name === objectType);
  return object?.fields || [];
};

export const createGetObjectRelationshipsKeyPrefix = ({
  objectType,
  uid,
}: {
  objectType: string;
  uid: string;
}) => [QueryKeys.GetObjectRelationships, { objectType, uid }];

export const useGetObjectRelationships = (
  objectType: SkylarkObjectType,
  uid: string,
  opts: GetObjectOptions,
) => {
  const { language }: GetObjectOptions = opts || { language: null };

  const { objectOperations } = useSkylarkObjectOperations(objectType);
  const { objects } = useAllObjectsMeta(true);

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
  const variables = { uid, nextToken: "", language };

  const { data, isLoading } = useQuery<
    GQLSkylarkGetObjectRelationshipsResponse,
    GQLSkylarkErrorResponse<GQLSkylarkGetObjectResponse>
  >({
    // eslint-disable-next-line @tanstack/query/exhaustive-deps
    queryKey: createGetObjectRelationshipsKeyPrefix({ objectType, uid }),
    queryFn: async () =>
      skylarkRequest("query", query as DocumentNode, variables),
    enabled: query !== null,
  });

  const unparsedData = data?.getObjectRelationships;

  const relationships: ParsedSkylarkObjectRelationships[] | null = useMemo(
    () =>
      unparsedData
        ? Object.keys(unparsedData)?.map((relation) => {
            const relationship = unparsedData[
              relation
            ] as SkylarkGraphQLObjectRelationship;

            const parsedObjects = relationship.objects.map((relatedObject) =>
              parseSkylarkObject(relatedObject as SkylarkGraphQLObject),
            );

            const objectType = getObjectTypeFromListingTypeName(
              relationship.__typename,
            );

            return {
              relationshipName: relation,
              nextToken: relationship?.next_token,
              objects: parsedObjects,
              objectType,
            };
          })
        : null,
    [unparsedData],
  );

  return {
    relationships,
    objectRelationships: objectOperations?.relationships,
    isLoading: isLoading || !query,
    query,
    variables,
  };
};
