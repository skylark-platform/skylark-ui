import { graphql } from "msw";

import GQLSkylarkGetSetWithContentQueryFixture from "src/tests/fixtures/skylark/queries/getObject/setWithContent.json";

export const updateObjectHandlers = [
  graphql.mutation(`UPDATE_OBJECT_CONTENT_Set`, (req, res, ctx) => {
    return res(
      ctx.data({
        updateObjectContent:
          GQLSkylarkGetSetWithContentQueryFixture.data.getObject,
      }),
    );
  }),
];
