import { GraphQLClient } from "graphql-request";

import {
  GQLSkylarkObjectTypesResponse,
  GQLSkylarkSchemaQueriesMutations,
} from "src/interfaces/graphql/introspection";
import { SkylarkObjectMeta, SkylarkObjectTypes } from "src/interfaces/skylark";
import {
  GET_SKYLARK_SCHEMA,
  GET_SKYLARK_OBJECT_TYPES,
} from "src/lib/graphql/skylark/queries";
import { getObjectOperations } from "src/lib/skylark/objects";

export const getSkylarkObjectOperations = async (
  client: GraphQLClient,
  objectType: string,
): Promise<SkylarkObjectMeta["operations"]> => {
  const data = await client.request<GQLSkylarkSchemaQueriesMutations>(
    GET_SKYLARK_SCHEMA,
  );

  const objectMeta = getObjectOperations(objectType, data.__schema);

  return objectMeta.operations;
};

export const getSkylarkObjectTypes = async (
  client: GraphQLClient,
): Promise<SkylarkObjectTypes> => {
  const data = await client.request<GQLSkylarkObjectTypesResponse>(
    GET_SKYLARK_OBJECT_TYPES,
  );

  const objectTypes = data.__type.possibleTypes.map(({ name }) => name);

  return objectTypes;
};
