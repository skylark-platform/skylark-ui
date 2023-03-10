import { GraphQLClient } from "graphql-request";

import { GQLSkylarkSchemaQueriesMutations } from "src/interfaces/graphql/introspection";
import { SkylarkObjectMeta } from "src/interfaces/skylark";
import { GET_SKYLARK_SCHEMA } from "src/lib/graphql/skylark/queries";
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
