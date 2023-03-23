import { useQuery } from "@tanstack/react-query";
import { DocumentNode } from "graphql";

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

import {
  useAllObjectsMeta,
  useSkylarkObjectOperations,
} from "./useSkylarkObjectTypes";

const getFieldsFromObjectType = (
  objects: SkylarkObjectMeta[],
  objectType: string,
) => {
  const object = objects.find(({ name }) => name === objectType);
  return object?.fields || [];
};

export const createGetObjectRelationshipsKeyPrefix = ({
  objectType,
  uid,
}: {
  objectType: string;
  uid: string;
}) => [QueryKeys.GetObjectRelationships, objectType, uid];

export const useGetObjectRelationships = (
  objectType: SkylarkObjectType,
  uid: string,
): { data: ParsedSkylarkObjectRelationships[] | undefined } => {
  const { objectOperations } = useSkylarkObjectOperations(objectType);
  const { objects } = useAllObjectsMeta();

  const relationshipsFields: { [key: string]: NormalizedObjectField[] } =
    objectOperations?.relationships.reduce((acc, { objectType }) => {
      const fields = getFieldsFromObjectType(objects, objectType);
      return { ...acc, [objectType]: fields };
    }, {}) || {};

  const query = createGetObjectRelationshipsQuery(
    objectOperations,
    relationshipsFields,
  );
  const variables = { uid, nextToken: "" };

  const { data, ...rest } = useQuery<
    GQLSkylarkGetObjectRelationshipsResponse,
    GQLSkylarkErrorResponse<GQLSkylarkGetObjectResponse>
  >({
    queryKey: [
      ...createGetObjectRelationshipsKeyPrefix({ objectType, uid }),
      query,
      variables,
    ],
    queryFn: async () => skylarkRequest(query as DocumentNode, variables),
    enabled: query !== null,
  });

  const unparsedData = data?.getObjectRelationships;

  const parsedData: ParsedSkylarkObjectRelationships[] = unparsedData
    ? Object.keys(unparsedData)?.map((relation) => {
        const relationship = unparsedData[
          relation
        ] as SkylarkGraphQLObjectRelationship;

        const parsedObjects = relationship.objects.map((relatedObject) =>
          parseSkylarkObject(relatedObject as SkylarkGraphQLObject),
        );

        return {
          relationshipName: relation,
          nextToken: relationship?.nextToken,
          objects: parsedObjects,
        };
      })
    : [];

  return { data: parsedData, ...rest };
};
