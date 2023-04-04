import { graphql } from "msw";

import GQLSkylarkGetSetWithContentQueryFixture from "src/__tests__/fixtures/skylark/queries/getObject/setWithContent.json";

export const updateObjectHandlers = [
  graphql.mutation(`UPDATE_OBJECT_CONTENT_SkylarkSet`, (req, res, ctx) => {
    return res(
      ctx.data({
        updateObjectContent:
          GQLSkylarkGetSetWithContentQueryFixture.data.getObject,
      }),
    );
  }),

  graphql.mutation("UPDATE_OBJECT_METADATA_SkylarkSet", (req, res, ctx) => {
    return res(
      ctx.data({
        updateObjectMetadata:
          GQLSkylarkGetSetWithContentQueryFixture.data.getObject,
      }),
    );
  }),
];
