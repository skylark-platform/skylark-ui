import { graphql } from "msw";

import GQLSkylarkIntrospectionQueryFixture from "src/__tests__/fixtures/skylark/queries/introspection/introspectionQuery.json";
import GQLSkylarkObjectTypes from "src/__tests__/fixtures/skylark/queries/introspection/objectTypes.json";
import { SKYLARK_SCHEMA_INTROSPECTION_QUERY_NAME } from "src/lib/graphql/skylark/queries";

export const introspectionHandlers = [
  graphql.query(SKYLARK_SCHEMA_INTROSPECTION_QUERY_NAME, (req, res, ctx) => {
    return res(ctx.data(GQLSkylarkIntrospectionQueryFixture.data));
  }),

  graphql.query("GET_SKYLARK_OBJECT_TYPES", (req, res, ctx) => {
    return res(ctx.data(GQLSkylarkObjectTypes.data));
  }),
];
