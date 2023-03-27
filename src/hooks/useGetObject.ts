import { useQuery } from "@tanstack/react-query";
import { DocumentNode } from "graphql";

import { QueryErrorMessages, QueryKeys } from "src/enums/graphql";
import {
  SkylarkObjectType,
  GQLSkylarkErrorResponse,
  SkylarkGraphQLObjectRelationship,
  ParsedSkylarkObjectImageRelationship,
} from "src/interfaces/skylark";
import { GQLSkylarkGetObjectResponse } from "src/interfaces/skylark";
import { skylarkRequest } from "src/lib/graphql/skylark/client";
import { createGetObjectQuery } from "src/lib/graphql/skylark/dynamicQueries";
import { parseSkylarkObject } from "src/lib/skylark/parsers";

import {
  useAllObjectsMeta,
  useSkylarkObjectOperations,
} from "./useSkylarkObjectTypes";

interface GetObjectOptions {
  language?: string | null;
}

export const createGetObjectKeyPrefix = ({
  objectType,
  uid,
}: {
  objectType: string;
  uid: string;
}) => [QueryKeys.GetObject, objectType, uid];

export const useGetObject = (
  objectType: SkylarkObjectType,
  uid: string,
  opts?: GetObjectOptions,
) => {
  const { language }: GetObjectOptions = opts || { language: null };

  const { objectOperations } = useSkylarkObjectOperations(objectType);
  const { objects: searchableObjects } = useAllObjectsMeta();

  const query = createGetObjectQuery(
    objectOperations,
    searchableObjects,
    !!language,
  );
  const variables = { uid, language };

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
  // const metadata: ParsedSkylarkObject["metadata"] = data?.getObject
  //   ? {
  //       ...Object.keys(data?.getObject).reduce((prev, key) => {
  //         return {
  //           ...prev,
  //           ...(!isObject(data.getObject[key])
  //             ? { [key]: data.getObject[key] }
  //             : {}),
  //         };
  //       }, {}),
  //       uid: data.getObject.uid,
  //       external_id: data.getObject.external_id || "",
  //     }
  //   : { uid, external_id: "" };

  // const availability = parseObjectAvailability(data?.getObject.availability);

  // const images =
  //   objectOperations?.images?.relationshipNames.map(
  //     (imageField): ParsedSkylarkObjectImageRelationship => {
  //       const parsedImages =
  //         data?.getObject &&
  //         hasProperty(data?.getObject, imageField) &&
  //         parseObjectRelationship<SkylarkGraphQLObjectImage>(
  //           data?.getObject[imageField] as SkylarkGraphQLObjectRelationship,
  //         );
  //       return {
  //         relationshipName: imageField,
  //         objects: parsedImages || [],
  //       };
  //     },
  //   ) || [];

  // const content =
  //   data?.getObject && hasProperty(data.getObject, "content")
  //     ? parseObjectContent(data.getObject.content)
  //     : undefined;

  // const parsedObject: ParsedSkylarkObject | undefined = data?.getObject && {
  //   objectType: data.getObject.__typename,
  //   uid: data.getObject.uid,
  //   config: {
  //     colour: data.getObject._config?.colour,
  //     primaryField: data.getObject._config?.primary_field,
  //   },
  //   meta: {
  //     language: data.getObject._meta?.language_data.language || "",
  //     availableLanguages: data.getObject._meta?.available_languages || [],
  //     versions: {
  //       language: data.getObject._meta?.language_data.version,
  //       global: data.getObject._meta?.global_data.version,
  //     },
  //   },
  //   metadata,
  //   availability,
  //   images,
  //   relationships: [],
  //   content,
  // };
  const parsedObject =
    data?.getObject && parseSkylarkObject(data?.getObject, objectOperations);

  return {
    ...rest,
    error,
    data: parsedObject,
    objectMeta: objectOperations,
    isLoading: rest.isLoading || !query,
    isNotFound:
      error?.response.errors?.[0]?.errorType === QueryErrorMessages.NotFound,
    query,
    variables,
  };
};
