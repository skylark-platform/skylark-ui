import { useQuery } from "@apollo/client";

import {
  SkylarkGraphQLObjectImage,
  ParsedSkylarkObject,
  SkylarkGraphQLObjectRelationship,
  SkylarkObjectType,
} from "src/interfaces/skylark";
import { GQLSkylarkGetObjectResponse } from "src/interfaces/skylark";
import {
  createGetObjectQuery,
  defaultValidBlankQuery,
} from "src/lib/graphql/skylark/dynamicQueries";
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

export const useGetObject = (
  objectType: SkylarkObjectType,
  lookupValue: { externalId?: string; uid?: string },
) => {
  const { objectOperations } = useSkylarkObjectOperations(objectType);
  const { objects: searchableObjects } = useAllObjectsMeta();

  const query = createGetObjectQuery(objectOperations, searchableObjects);

  const { data, ...rest } = useQuery<GQLSkylarkGetObjectResponse>(
    query || defaultValidBlankQuery,
    {
      skip: !query,
      variables: {
        ...lookupValue,
      },
    },
  );

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
        external_id: data.getObject.uid,
      }
    : { uid: lookupValue.uid || "", external_id: lookupValue.externalId || "" };

  // TODO improve this to remove the "as"
  const availability = parseObjectAvailability(
    data?.getObject.availability as SkylarkGraphQLObjectRelationship,
  );

  const images =
    data?.getObject && hasProperty(data?.getObject, "images")
      ? parseObjectRelationship<SkylarkGraphQLObjectImage>(
          data?.getObject.images as SkylarkGraphQLObjectRelationship,
        )
      : undefined;

  const content =
    data?.getObject && hasProperty(data.getObject, "content")
      ? parseObjectContent(data.getObject.content)
      : undefined;

  const parsedObject: ParsedSkylarkObject | undefined = data?.getObject && {
    objectType: data.getObject.__typename,
    config: {
      colour: data.getObject._config?.colour,
      primaryField: data.getObject._config?.primary_field,
    },
    metadata,
    availability,
    images,
    relationships: [],
    content,
  };

  return {
    ...rest,
    data: parsedObject,
    query,
  };
};
