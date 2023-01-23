import { useQuery } from "@apollo/client";

import {
  GQLSkylarkObjectTypesResponse,
  GQLSkylarkSchemaQueriesMutations,
  GQLSkylarkSearchableObjectsUnionResponse,
} from "src/interfaces/graphql/introspection";
import { SkylarkObjectType } from "src/interfaces/skylark";
import {
  GET_SKYLARK_SCHEMA,
  GET_SKYLARK_OBJECT_TYPES,
  GET_SEARCHABLE_OBJECTS,
} from "src/lib/graphql/skylark/queries";
import {
  getObjectOperations,
  getAllSearchableObjectsMeta,
} from "src/lib/skylark/objects";

export const useSkylarkObjectTypes = () => {
  const { data, ...rest } = useQuery<GQLSkylarkObjectTypesResponse>(
    GET_SKYLARK_OBJECT_TYPES,
  );

  const objectTypes = data?.__type.enumValues.map(({ name }) => name);

  return {
    objectTypes,
    ...rest,
  };
};

export const useSkylarkSearchableObjectTypes = () => {
  const { data, ...rest } = useQuery<GQLSkylarkSearchableObjectsUnionResponse>(
    GET_SEARCHABLE_OBJECTS,
  );

  const searchableObjectTypes =
    data?.__type.possibleTypes.map(({ name }) => name) || [];

  return {
    objectTypes: searchableObjectTypes,
    ...rest,
  };
};

// Returns the operations for a given object (createEpisode etc for Episode)
// Should be fast as it'll keep hitting the Apollo cache both requests noice
export const useSkylarkObjectOperations = (objectType: SkylarkObjectType) => {
  const { data, ...rest } =
    useQuery<GQLSkylarkSchemaQueriesMutations>(GET_SKYLARK_SCHEMA);

  if (!data || !objectType) {
    return { object: null, ...rest };
  }

  const object = getObjectOperations(objectType, data.__schema);

  return {
    object,
    ...rest,
  };
};

export const useAllSearchableObjectMeta = () => {
  const { data: schemaResponse, ...rest } =
    useQuery<GQLSkylarkSchemaQueriesMutations>(GET_SKYLARK_SCHEMA);

  const { objectTypes: searchableObjects } = useSkylarkSearchableObjectTypes();

  if (!schemaResponse || !searchableObjects || searchableObjects.length === 0) {
    return { objects: [], allFieldNames: [], ...rest };
  }

  const objects = getAllSearchableObjectsMeta(
    schemaResponse.__schema,
    searchableObjects,
  );

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
