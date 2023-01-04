import { useQuery } from "@apollo/client";

import {
  GQLSkylarkObjectTypesResponse,
  GQLSkylarkSchemaQueriesMutations,
  GQLSkylarkSearchableObjectsUnionResponse,
} from "src/interfaces/graphql/introspection";
import { SkylarkObjectType } from "src/interfaces/skylark/objects";
import {
  GET_SKYLARK_SCHEMA,
  GET_SKYLARK_OBJECT_TYPES,
  GET_SEARCHABLE_OBJECTS,
} from "src/lib/graphql/skylark/queries";
import {
  getObjectOperations,
  getAllSearchableObjectFields,
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

export const useAllSearchableObjectFields = () => {
  const { data: schemaResponse, ...rest } =
    useQuery<GQLSkylarkSchemaQueriesMutations>(GET_SKYLARK_SCHEMA);
  const { data: searchableObjectsResponse } =
    useQuery<GQLSkylarkSearchableObjectsUnionResponse>(GET_SEARCHABLE_OBJECTS);

  if (!schemaResponse || !searchableObjectsResponse) {
    return { objects: [], allFieldNames: [], ...rest };
  }

  const searchableObjects =
    searchableObjectsResponse?.__type.possibleTypes.map(({ name }) => name) ||
    [];
  const objects = getAllSearchableObjectFields(
    schemaResponse.__schema.queryType,
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
