import { graphql } from "msw";

import GQLSkylarkDimensionValues from "src/__tests__/fixtures/skylark/queries/listDimensionValues.json";
import GQLSkylarkDimensions from "src/__tests__/fixtures/skylark/queries/listDimensions.json";

export const availabilityDimensionHandlers = [
  graphql.query("LIST_AVAILABILITY_DIMENSIONS", (req, res, ctx) => {
    return res(ctx.data(GQLSkylarkDimensions.data));
  }),

  graphql.query("LIST_AVAILABILITY_DIMENSION_VALUES", (req, res, ctx) => {
    return res(ctx.data(GQLSkylarkDimensionValues.data));
  }),
];
