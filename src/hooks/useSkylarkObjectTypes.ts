import { QueryResult, useQuery } from "@apollo/client";

import {
  GQLSkylarkObjectTypesResponse,
  GQLSkylarkSchemaQueriesMutations,
} from "src/interfaces/graphql/introspection";
import { SkylarkObjectType } from "src/interfaces/skylark";
import {
  GET_SKYLARK_SCHEMA,
  GET_SKYLARK_OBJECT_TYPES,
} from "src/lib/graphql/skylark/queries";
import {
  getObjectOperations,
  getAllObjectsMeta,
} from "src/lib/skylark/objects";

export const useSkylarkObjectTypes = (): Omit<QueryResult, "data"> & {
  objectTypes: string[] | undefined;
} => {
  const { data, ...rest } = useQuery<GQLSkylarkObjectTypesResponse>(
    GET_SKYLARK_OBJECT_TYPES,
  );

  const objectTypes = data
    ? data?.__type.possibleTypes.map(({ name }) => name) || []
    : undefined;

  return {
    objectTypes,
    ...rest,
  };
};

// Returns the operations for a given object (createEpisode etc for Episode)
// Should be fast as it'll keep hitting the Apollo cache both requests noice
export const useSkylarkObjectOperations = (objectType: SkylarkObjectType) => {
  const { data, ...rest } =
    useQuery<GQLSkylarkSchemaQueriesMutations>(GET_SKYLARK_SCHEMA);

  if (!data || !objectType) {
    return { objectOperations: null, ...rest };
  }

  const objectOperations = getObjectOperations(objectType, data.__schema);

  return {
    objectOperations,
    ...rest,
  };
};

export const useAllSearchableObjectMeta = () => {
  const { data: schemaResponse, ...rest } =
    useQuery<GQLSkylarkSchemaQueriesMutations>(GET_SKYLARK_SCHEMA);

  const { objectTypes: searchableObjects } = useSkylarkObjectTypes();

  if (!schemaResponse || !searchableObjects || searchableObjects.length === 0) {
    return { objects: [], allFieldNames: [], ...rest };
  }

  const objects = getAllObjectsMeta(schemaResponse.__schema, searchableObjects);

  const allFieldNames = objects
    .flatMap(({ fields }) => fields)
    .map(({ name }) => name)
    .filter((name, index, self) => self.indexOf(name) === index);

  return {
    objects,
    allFieldNames,
    ...rest,
  };
};
