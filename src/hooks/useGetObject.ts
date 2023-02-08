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
  parseObjectRelationship,
} from "src/lib/skylark/parsers";
import { hasProperty, isObject } from "src/lib/utils";

import { useSkylarkObjectOperations } from "./useSkylarkObjectTypes";

export const useGetObject = (
  objectType: SkylarkObjectType,
  lookupValue: { externalId?: string; uid?: string },
) => {
  const { objectOperations } = useSkylarkObjectOperations(objectType);

  const query = createGetObjectQuery(objectOperations);

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
        external_id: data.getObject.external_id,
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
  };

  return {
    ...rest,
    data: parsedObject,
    query,
  };
};
