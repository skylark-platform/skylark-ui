import { graphql } from "msw";

import GQLSkylarkAccountStatusFixture from "src/__tests__/fixtures/skylark/queries/getAccountStatus/default.json";
import GQLSkylarkUserAccountFixture from "src/__tests__/fixtures/skylark/queries/getUserAndAccount.json";

export const environmentHandlers = [
  graphql.query(`GET_USER_AND_ACCOUNT`, (req, res, ctx) => {
    return res(ctx.data(GQLSkylarkUserAccountFixture.data));
  }),

  graphql.query(`GET_ACCOUNT_STATUS`, (req, res, ctx) => {
    return res(ctx.data(GQLSkylarkAccountStatusFixture.data));
  }),
];
