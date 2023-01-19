import { QueryResult, useQuery } from "@apollo/client";
import dayjs from "dayjs";

import {
  ObjectAvailability,
  ObjectAvailabilityStatus,
  ObjectImage,
  SkylarkGraphQLObjectRelationship,
  SkylarkObjectType,
} from "src/interfaces/skylark/objects";
import {
  createGetObjectQuery,
  defaultValidBlankQuery,
} from "src/lib/graphql/skylark/dynamicQueries";
import { isObject } from "src/lib/utils";

import { useSkylarkObjectOperations } from "./useSkylarkObjectTypes";

export interface GQLGetObjectResponse {
  getObject: Record<
    string,
    null | string | number | SkylarkGraphQLObjectRelationship
  >;
}

export interface SkylarkObject {
  metadata: Record<string, string>;
  availability: ObjectAvailability;
  images: ObjectImage[];
}

export const getObjectAvailabilityStatus = (
  availabilityObjects: ObjectAvailability["objects"],
): ObjectAvailability["status"] => {
  if (availabilityObjects.length === 0) {
    return ObjectAvailabilityStatus.Unavailable;
  }

  const now = dayjs();

  const nonExpiredAvailability = availabilityObjects.filter(({ end }) =>
    now.isBefore(end),
  );

  if (nonExpiredAvailability.length === 0) {
    return ObjectAvailabilityStatus.Expired;
  }

  const isFuture = nonExpiredAvailability.every(({ start }) =>
    now.isBefore(start),
  );

  return isFuture
    ? ObjectAvailabilityStatus.Future
    : ObjectAvailabilityStatus.Active;
};

export const parseAvailability = (
  unparsedObject?: SkylarkGraphQLObjectRelationship,
): ObjectAvailability => {
  if (!unparsedObject) {
    return {
      status: null,
      objects: [],
    };
  }

  const objects = unparsedObject.objects as ObjectAvailability["objects"];

  return {
    status: getObjectAvailabilityStatus(objects),
    objects,
  };
};

const parseImages = (
  unparsedObject?: SkylarkGraphQLObjectRelationship,
): ObjectImage[] => {
  if (!unparsedObject) {
    return [];
  }
  return unparsedObject.objects as ObjectImage[];
};

export const useGetObject = (
  objectType: SkylarkObjectType,
  lookupValue: { externalId?: string; uid?: string },
) => {
  const { object: objectOperations } = useSkylarkObjectOperations(objectType);

  const query = createGetObjectQuery(objectOperations);

  const { data, ...rest } = useQuery<GQLGetObjectResponse>(
    query || defaultValidBlankQuery,
    {
      skip: !query,
      variables: {
        ...lookupValue,
      },
    },
  );

  // TODO split into Language and Global
  const metadata: Record<string, string> = data?.getObject
    ? Object.keys(data?.getObject).reduce((prev, key) => {
        return {
          ...prev,
          ...(!isObject(data.getObject[key])
            ? { [key]: data.getObject[key] }
            : {}),
        };
      }, {})
    : {};

  // TODO improve this to remove the "as"
  const availability = parseAvailability(
    data?.getObject.availability as SkylarkGraphQLObjectRelationship,
  );

  const images = parseImages(
    data?.getObject.images as SkylarkGraphQLObjectRelationship,
  );

  const parsedObject: SkylarkObject | undefined = data?.getObject && {
    metadata,
    availability,
    images,
  };

  return {
    ...rest,
    data: parsedObject,
  };
};
