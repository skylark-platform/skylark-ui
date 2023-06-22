import { graphql } from "msw";

import GQLSkylarkGetAccountFixture from "src/__tests__/fixtures/skylark/queries/getAccount.json";

export const environmentHandlers = [
  graphql.query(`GET_ACCOUNT`, (req, res, ctx) => {
    return res(
      ctx.data(GQLSkylarkGetAccountFixture.data),
    );
  }),
];
