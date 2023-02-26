import { graphql } from "msw";

import GQLSkylarkObjectTypesQueryFixture from "src/tests/fixtures/skylark/queries/introspection/objectTypes.json";
import GQLSkylarkSchemaQueryFixture from "src/tests/fixtures/skylark/queries/introspection/schema.json";

export const skylarkObjectTypesHandler = (types?: string[]) =>
  graphql.query("GET_SKYLARK_OBJECT_TYPES", (req, res, ctx) => {
    return res(
      ctx.data({
        __type: {
          possibleTypes:
            types?.map((type) => ({ name: type, __typename: "__Type" })) || [],
          __typename: "__Type",
        },
      }),
    );
  });

export const introspectionHandlers = [
  graphql.query("GET_SKYLARK_SCHEMA", (req, res, ctx) => {
    return res(ctx.data(GQLSkylarkSchemaQueryFixture.data));
  }),

  graphql.query("GET_SKYLARK_OBJECT_TYPES", (req, res, ctx) => {
    return res(ctx.data(GQLSkylarkObjectTypesQueryFixture.data));
  }),
];
