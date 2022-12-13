import { useQuery } from "@apollo/client";

import {
  GQLSkylarkObjectTypesResponse,
  GQLSkylarkSchemaQueriesMutations,
} from "src/interfaces/graphql/introspection";
import { SkylarkObjectType } from "src/interfaces/skylark/objects";
import {
  GET_SKYLARK_SCHEMA,
  GET_SKYLARK_OBJECT_TYPES,
} from "src/lib/graphql/skylark/queries";
import { getObjectOperations } from "src/lib/skylark/objects";

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
