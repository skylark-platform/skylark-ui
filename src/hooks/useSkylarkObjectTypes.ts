import { useQuery, UseQueryResult } from "@tanstack/react-query";

import { QueryKeys } from "src/enums/graphql";
import {
  GQLSkylarkObjectTypesResponse,
  GQLSkylarkSchemaQueriesMutations,
} from "src/interfaces/graphql/introspection";
import { SkylarkObjectType } from "src/interfaces/skylark";
import { skylarkRequest } from "src/lib/graphql/skylark/client";
import {
  GET_SKYLARK_SCHEMA,
  GET_SKYLARK_OBJECT_TYPES,
} from "src/lib/graphql/skylark/queries";
import {
  getObjectOperations,
  getAllObjectsMeta,
} from "src/lib/skylark/objects";

export const useSkylarkObjectTypes = (): Omit<UseQueryResult, "data"> & {
  objectTypes: string[] | undefined;
} => {
  const { data, ...rest } = useQuery<GQLSkylarkObjectTypesResponse>({
    queryKey: [QueryKeys.ObjectTypes, GET_SKYLARK_OBJECT_TYPES],
    queryFn: async () => skylarkRequest(GET_SKYLARK_OBJECT_TYPES),
  });

  const objectTypes = data
    ? data?.__type.possibleTypes.map(({ name }) => name) || []
    : undefined;

  return {
    objectTypes,
    ...rest,
  };
};

// Returns the operations for a given object (createEpisode etc for Episode)
export const useSkylarkObjectOperations = (objectType: SkylarkObjectType) => {
  const { data, ...rest } = useQuery<GQLSkylarkSchemaQueriesMutations>({
    queryKey: [QueryKeys.Schema, GET_SKYLARK_SCHEMA],
    queryFn: async () => skylarkRequest(GET_SKYLARK_SCHEMA),
  });

  if (!data || !objectType) {
    return { objectOperations: null, ...rest };
  }

  const objectOperations = getObjectOperations(objectType, data.__schema);

  return {
    objectOperations,
    ...rest,
  };
};

export const useAllObjectsMeta = () => {
  const { data: schemaResponse, ...rest } =
    useQuery<GQLSkylarkSchemaQueriesMutations>({
      queryKey: [QueryKeys.Schema, GET_SKYLARK_SCHEMA],
      queryFn: async () => skylarkRequest(GET_SKYLARK_SCHEMA),
    });

  const { objectTypes } = useSkylarkObjectTypes();

  if (!schemaResponse || !objectTypes || objectTypes.length === 0) {
    return { objects: [], allFieldNames: [], ...rest };
  }

  const objects = getAllObjectsMeta(schemaResponse.__schema, objectTypes);

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
