import { useQuery } from "@tanstack/react-query";
import { DocumentNode } from "graphql";

import {
  GQLSkylarkErrorResponse,
  GQLSkylarkGetObjectRelationshipsResponse,
  GQLSkylarkGetObjectResponse,
  NormalizedObjectField,
  ParsedSkylarkObject,
  SkylarkGraphQLObject,
  SkylarkGraphQLObjectImage,
  SkylarkGraphQLObjectRelationship,
  SkylarkObjectMeta,
  SkylarkObjectType,
} from "src/interfaces/skylark";
import { skylarkRequest } from "src/lib/graphql/skylark/client";
import { createGetObjectRelationshipsQuery } from "src/lib/graphql/skylark/dynamicQueries";
import {
  parseObjectAvailability,
  parseObjectContent,
  parseObjectRelationship,
} from "src/lib/skylark/parsers";
import { hasProperty, isObject } from "src/lib/utils";

import { createGetObjectKeyPrefix } from "./useGetObject";
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

export const parseNEW = (object: SkylarkGraphQLObject): ParsedSkylarkObject => {
  // TODO split into Language and Global
  const metadata: ParsedSkylarkObject["metadata"] = {
    ...Object.keys(object).reduce((prev, key) => {
      return {
        ...prev,
        ...(!isObject(object[key]) ? { [key]: object[key] } : {}),
      };
    }, {}),
    uid: object.uid,
    external_id: object.external_id || "",
  };
  const availability = parseObjectAvailability(object?.availability);

  const images = hasProperty(object, "images")
    ? parseObjectRelationship<SkylarkGraphQLObjectImage>(object.images)
    : undefined;

  const content = hasProperty(object, "content")
    ? parseObjectContent(object.content)
    : undefined;

  const relationships = Object.keys(object)
    ?.filter((relation) => isObject(object[relation]))
    .map((relation) => {
      const relationship = object[relation] as SkylarkGraphQLObjectRelationship;
      console.log(relationship);
      return relation;
    });
  console.log(relationships);

  return (
    object && {
      objectType: object.__typename,
      uid: object.uid,
      config: {
        colour: object._config?.colour,
        primaryField: object._config?.primary_field,
      },
      meta: {
        availableLanguages: object._meta?.available_languages,
      },
      metadata,
      availability,
      images,
      relationships,
      content,
    }
  );
};

export const useObjectRelationships = (
  objectType: SkylarkObjectType,
  uid: string,
): { data: SkylarkGraphQLObject | undefined } => {
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
      ...createGetObjectKeyPrefix({ objectType, uid }),
      query,
      variables,
    ],
    queryFn: async () => skylarkRequest(query as DocumentNode, variables),
    enabled: query !== null,
  });

  console.log(
    "party",
    data?.getObjectRelationships && parseNEW(data?.getObjectRelationships),
  );

  // TODO return parderSKObjc array

  return { data: data?.getObjectRelationships, ...rest };
};
