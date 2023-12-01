import { graphql } from "msw";

import GQLPublishEpisodeMutationFixture from "src/__tests__/fixtures/skylark/mutations/publishObject/publishEpisode.json";
import GQLSkylarkGetHomepageSetQueryFixture from "src/__tests__/fixtures/skylark/queries/getObject/homepage.json";
import { wrapQueryName } from "src/lib/graphql/skylark/dynamicQueries";

export const updateObjectHandlers = [
  graphql.mutation(
    wrapQueryName(`UPDATE_OBJECT_CONTENT_SkylarkSet`),
    (req, res, ctx) => {
      return res(
        ctx.data({
          updateObjectContent:
            GQLSkylarkGetHomepageSetQueryFixture.data.getObject,
        }),
      );
    },
  ),

  graphql.mutation(
    wrapQueryName("UPDATE_OBJECT_METADATA_SkylarkSet"),
    (req, res, ctx) => {
      return res(
        ctx.data({
          updateObjectMetadata:
            GQLSkylarkGetHomepageSetQueryFixture.data.getObject,
        }),
      );
    },
  ),

  graphql.mutation(
    wrapQueryName("UPDATE_OBJECT_RELATIONSHIPS_Season"),
    (req, res, ctx) => {
      return res(
        ctx.data({
          updateRelationships: {
            uid: "01GXSR23WH5DHGTXVHXW1TMGBJ",
          },
        }),
      );
    },
  ),

  graphql.mutation(
    wrapQueryName("UPDATE_AVAILABILITY_DIMENSIONS"),
    (req, res, ctx) => {
      return res(
        ctx.data({
          updateAvailabilityDimensions: {
            uid: "01GXSR23WH5DHGTXVHXW1TMGBJ",
          },
        }),
      );
    },
  ),

  graphql.mutation(
    wrapQueryName("UPDATE_OBJECT_AVAILABILITY_Movie"),
    (req, res, ctx) => {
      return res(
        ctx.data({
          updateAvailabilityObjects: {
            uid: "01GXSR23WH5DHGTXVHXW1TMGBJ",
          },
        }),
      );
    },
  ),

  graphql.mutation(wrapQueryName(`PUBLISH_Episode`), (req, res, ctx) => {
    return res(ctx.data(GQLPublishEpisodeMutationFixture.data));
  }),
];
