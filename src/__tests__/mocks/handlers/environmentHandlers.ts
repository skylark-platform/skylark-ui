import { graphql } from "msw";

import GQLSkylarkUserAccountFixture from "src/__tests__/fixtures/skylark/queries/getUserAndAccount.json";

export const environmentHandlers = [
  graphql.query(`GET_USER_AND_ACCOUNT`, (req, res, ctx) => {
    return res(ctx.data(GQLSkylarkUserAccountFixture.data));
  }),
];
