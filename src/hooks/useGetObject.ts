import { QueryResult, useQuery } from "@apollo/client";

import {
  ObjectAvailability,
  SkylarkObjectType,
} from "src/interfaces/skylark/objects";
import {
  createGetObjectQuery,
  defaultValidBlankQuery,
} from "src/lib/graphql/skylark/dynamicQueries";
import { isObject } from "src/lib/utils";

import { useSkylarkObjectOperations } from "./useSkylarkObjectTypes";

export interface GQLGetObjectRelationship {
  nextToken?: string;
  objects: object[];
}

export interface GQLGetObjectResponse {
  getObject: Record<string, null | string | number | GQLGetObjectRelationship>;
}

interface SkylarkObject {
  metadata: Record<string, string>;
  availability: ObjectAvailability[];
}

const parseAvailability = (
  unparsedObject?: GQLGetObjectRelationship,
): ObjectAvailability[] => {
  if (!unparsedObject) {
    return [];
  }
  return unparsedObject.objects as ObjectAvailability[];
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
    data?.getObject.availability as GQLGetObjectRelationship,
  );

  const parsedObject: SkylarkObject | undefined = data?.getObject && {
    metadata,
    availability,
  };

  return {
    ...rest,
    data: parsedObject,
  };
};
