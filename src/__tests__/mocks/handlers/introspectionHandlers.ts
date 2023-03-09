import { graphql } from "msw";

import GQLSkylarkIntrospectionQueryFixture from "src/__tests__/fixtures/skylark/queries/introspection/introspectionQuery.json";
import GQLSkylarkSchemaQueryFixture from "src/__tests__/fixtures/skylark/queries/introspection/schema.json";
import { SKYLARK_SCHEMA_INTROSPECTION_QUERY_NAME } from "src/lib/graphql/skylark/queries";

export const introspectionHandlers = [
  graphql.query("GET_SKYLARK_SCHEMA", (req, res, ctx) => {
    return res(ctx.data(GQLSkylarkSchemaQueryFixture.data));
  }),

  graphql.query(SKYLARK_SCHEMA_INTROSPECTION_QUERY_NAME, (req, res, ctx) => {
    return res(ctx.data(GQLSkylarkIntrospectionQueryFixture.data));
  }),
];
