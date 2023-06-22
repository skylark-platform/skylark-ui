import { useQuery } from "@tanstack/react-query";
import { DocumentNode } from "graphql";
import { useMemo } from "react";

import { QueryKeys } from "src/enums/graphql";
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

import { GetObjectOptions } from "./useGetObject";
import {
  useAllObjectsMeta,
  useSkylarkObjectOperations,
} from "./useSkylarkObjectTypes";

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

  const { data, ...rest } = useQuery<
    GQLSkylarkGetObjectRelationshipsResponse,
    GQLSkylarkErrorResponse<GQLSkylarkGetObjectResponse>
  >({
    // eslint-disable-next-line @tanstack/query/exhaustive-deps
    queryKey: createGetObjectRelationshipsKeyPrefix({ objectType, uid }),
    queryFn: async () => skylarkRequest(query as DocumentNode, variables),
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

            return {
              relationshipName: relation,
              nextToken: relationship?.next_token,
              objects: parsedObjects,
            };
          })
        : null,
    [unparsedData],
  );

  return {
    ...rest,
    relationships,
    objectRelationships: objectOperations?.relationships,
    isLoading: rest.isLoading || !query,
    query,
    variables,
  };
};
