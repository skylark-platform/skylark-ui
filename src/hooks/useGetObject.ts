import { useQuery } from "@tanstack/react-query";
import { DocumentNode } from "graphql";

import { QueryErrorMessages, QueryKeys } from "src/enums/graphql";
import {
  SkylarkGraphQLObjectImage,
  ParsedSkylarkObject,
  SkylarkObjectType,
  GQLSkylarkErrorResponse,
} from "src/interfaces/skylark";
import { GQLSkylarkGetObjectResponse } from "src/interfaces/skylark";
import { skylarkRequest } from "src/lib/graphql/skylark/client";
import { createGetObjectQuery } from "src/lib/graphql/skylark/dynamicQueries";
import {
  parseObjectAvailability,
  parseObjectContent,
  parseObjectRelationship,
} from "src/lib/skylark/parsers";
import { hasProperty, isObject } from "src/lib/utils";

import {
  useAllObjectsMeta,
  useSkylarkObjectOperations,
} from "./useSkylarkObjectTypes";

export const createGetObjectKeyPrefix = ({
  objectType,
  uid,
}: {
  objectType: string;
  uid: string;
}) => [QueryKeys.GetObject, objectType, uid];

export const useGetObject = (objectType: SkylarkObjectType, uid: string) => {
  const { objectOperations } = useSkylarkObjectOperations(objectType);
  const { objects: searchableObjects } = useAllObjectsMeta();

  const query = createGetObjectQuery(objectOperations, searchableObjects);
  const variables = { uid };

  const { data, error, ...rest } = useQuery<
    GQLSkylarkGetObjectResponse,
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

  // TODO split into Language and Global
  const metadata: ParsedSkylarkObject["metadata"] = data?.getObject
    ? {
        ...Object.keys(data?.getObject).reduce((prev, key) => {
          return {
            ...prev,
            ...(!isObject(data.getObject[key])
              ? { [key]: data.getObject[key] }
              : {}),
          };
        }, {}),
        uid: data.getObject.uid,
        external_id: data.getObject.external_id || "",
      }
    : { uid, external_id: "" };

  const availability = parseObjectAvailability(data?.getObject.availability);

  const images =
    data?.getObject && hasProperty(data?.getObject, "images")
      ? parseObjectRelationship<SkylarkGraphQLObjectImage>(
          data?.getObject.images,
        )
      : undefined;

  const content =
    data?.getObject && hasProperty(data.getObject, "content")
      ? parseObjectContent(data.getObject.content)
      : undefined;

  const parsedObject: ParsedSkylarkObject | undefined = data?.getObject && {
    objectType: data.getObject.__typename,
    uid: data.getObject.uid,
    config: {
      colour: data.getObject._config?.colour,
      primaryField: data.getObject._config?.primary_field,
    },
    meta: {
      availableLanguages: data.getObject._meta?.available_languages,
    },
    metadata,
    availability,
    images,
    relationships: [],
    content,
  };

  return {
    ...rest,
    error,
    data: parsedObject,
    isLoading: rest.isLoading || !query,
    isNotFound:
      error?.response.errors?.[0]?.errorType === QueryErrorMessages.NotFound,
    query,
    variables,
  };
};
