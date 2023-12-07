import { graphql } from "msw";

import GQLSkylarkAccountStatusFixture from "src/__tests__/fixtures/skylark/queries/getAccountStatus/default.json";
import GQLSkylarkUserAccountFixture from "src/__tests__/fixtures/skylark/queries/getUserAndAccount.json";
import { wrapQueryName } from "src/lib/graphql/skylark/dynamicQueries";

export const environmentHandlers = [
  graphql.query(wrapQueryName(`GET_USER_AND_ACCOUNT`), (req, res, ctx) => {
    return res(ctx.data(GQLSkylarkUserAccountFixture.data));
  }),

  graphql.query(wrapQueryName(`GET_ACCOUNT_STATUS`), (req, res, ctx) => {
    return res(ctx.data(GQLSkylarkAccountStatusFixture.data));
  }),
];
