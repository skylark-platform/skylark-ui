import { graphql } from "msw";

import GQLSkylarkGetHomepageSetQueryFixture from "src/__tests__/fixtures/skylark/queries/getObject/homepage.json";

export const updateObjectHandlers = [
  graphql.mutation(`UPDATE_OBJECT_CONTENT_SkylarkSet`, (req, res, ctx) => {
    return res(
      ctx.data({
        updateObjectContent:
          GQLSkylarkGetHomepageSetQueryFixture.data.getObject,
      }),
    );
  }),

  graphql.mutation("UPDATE_OBJECT_METADATA_SkylarkSet", (req, res, ctx) => {
    return res(
      ctx.data({
        updateObjectMetadata:
          GQLSkylarkGetHomepageSetQueryFixture.data.getObject,
      }),
    );
  }),

  graphql.mutation("UPDATE_OBJECT_RELATIONSHIPS_Season", (req, res, ctx) => {
    return res(
      ctx.data({
        updateRelationships: {
          uid: "01GXSR23WH5DHGTXVHXW1TMGBJ",
        },
      }),
    );
  }),

  graphql.mutation("UPDATE_AVAILABILITY_DIMENSIONS", (req, res, ctx) => {
    return res(
      ctx.data({
        updateAvailabilityDimensions: {
          uid: "01GXSR23WH5DHGTXVHXW1TMGBJ",
        },
      }),
    );
  }),
];
