import { IntrospectionQuery } from "graphql";
import { GraphQLClient } from "graphql-request";

import { SkylarkObjectMeta } from "src/interfaces/skylark";
import { SKYLARK_SCHEMA_INTROSPECTION_QUERY } from "src/lib/graphql/skylark/queries";
import { getObjectOperations } from "src/lib/skylark/objects";

export const getSkylarkObjectOperations = async (
  client: GraphQLClient,
  objectType: string,
): Promise<SkylarkObjectMeta["operations"]> => {
  const data = await client.request<IntrospectionQuery>(
    SKYLARK_SCHEMA_INTROSPECTION_QUERY,
  );

  const objectMeta = getObjectOperations(objectType, data.__schema);

  return objectMeta.operations;
};
