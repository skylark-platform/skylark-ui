import {
  GraphQLContext,
  GraphQLRequest,
  GraphQLVariables,
  ResponseComposition,
  graphql,
} from "msw";

import GQLSkylarkGetAvailabilityAssignedToFixture from "src/__tests__/fixtures/skylark/queries/getAvailabilityAssignedTo/always.json";
import GQLSkylarkGetAvailabilityQueryFixture from "src/__tests__/fixtures/skylark/queries/getObject/allDevicesAllCustomersAvailability.json";
import GQLSkylarkGetMovieDraftQueryFixture from "src/__tests__/fixtures/skylark/queries/getObject/draftObject.json";
import GQLSkylarkGetMovieQueryFixture from "src/__tests__/fixtures/skylark/queries/getObject/fantasticMrFox_All_Availabilities.json";
import GQLSkylarkGetObjectImageQueryFixture from "src/__tests__/fixtures/skylark/queries/getObject/gotImage.json";
import GQLSkylarkGetObjectGOTS01E01QueryFixture from "src/__tests__/fixtures/skylark/queries/getObject/gots01e01.json";
import GQLSkylarkGetObjectGOTS01E01PTPTQueryFixture from "src/__tests__/fixtures/skylark/queries/getObject/gots01e01ptPT.json";
import GQLSkylarkGetSeasonWithRelationshipsQueryFixture from "src/__tests__/fixtures/skylark/queries/getObject/gots04.json";
import GQLSkylarkGetHomepageSetQueryFixture from "src/__tests__/fixtures/skylark/queries/getObject/homepage.json";
import GQLSkylarkGetAssetQueryFixture from "src/__tests__/fixtures/skylark/queries/getObject/skylarkAsset.json";
import GQLSkylarkGetMovieQueryAvailabilityFixture from "src/__tests__/fixtures/skylark/queries/getObjectAvailability/fantasticMrFox_All_Availabilities.json";
import GQLSkylarkGetAvailabilityInheritanceQueryFixture from "src/__tests__/fixtures/skylark/queries/getObjectAvailabilityInheritance/randomCredit.json";
import GQLSkylarkGetHomepageSetContentQueryFixture from "src/__tests__/fixtures/skylark/queries/getObjectContent/homepage.json";
import GQLSkylarkGetMovieContentOfFixture from "src/__tests__/fixtures/skylark/queries/getObjectContentOf/fantasticMrFox_All_Availabilities.json";
import GQLSkylarkGetAvailabilityDimensionsQueryFixture from "src/__tests__/fixtures/skylark/queries/getObjectDimensions/allDevicesAllCustomersAvailability.json";
import GQLSkylarkGetObjectGenericFixture from "src/__tests__/fixtures/skylark/queries/getObjectGeneric/homepage.json";
import GQLSkylarkGetMovieRelationshipsQueryFixture from "src/__tests__/fixtures/skylark/queries/getObjectRelationships/fantasticMrFox_All_Availabilities.json";
import GQLSkylarkGetSeasonRelationshipsQueryFixture from "src/__tests__/fixtures/skylark/queries/getObjectRelationships/gots04relationships.json";
import GQLSkylarkGetAvailabilitySegmentsQueryFixture from "src/__tests__/fixtures/skylark/queries/getObjectSegments/allDevicesAllCustomersAvailability.json";
import GQLSkylarkGetMovieVersionsFixture from "src/__tests__/fixtures/skylark/queries/getObjectVersions/fantasticMrFox_All_Availabilities.json";
import GQLSkylarkGetObjectsConfigFixture from "src/__tests__/fixtures/skylark/queries/getObjectsConfig/allObjectsConfig.json";
import { SkylarkAvailabilityField } from "src/interfaces/skylark";
import {
  createGetObjectAvailabilityInheritanceQueryName,
  createGetObjectAvailabilityQueryName,
  createGetObjectContentOfQueryName,
  createGetObjectContentQueryName,
  createGetObjectQueryName,
  createGetObjectRelationshipsQueryName,
  createGetObjectVersionsQueryName,
  wrapQueryName,
} from "src/lib/graphql/skylark/dynamicQueries";

export const getObjectsConfigHandlers = [
  graphql.query(wrapQueryName("GET_OBJECTS_CONFIG"), (req, res, ctx) => {
    return res(ctx.data(GQLSkylarkGetObjectsConfigFixture.data));
  }),
];

export const getObjectHandlers = [
  graphql.query(
    wrapQueryName(createGetObjectQueryName("Movie")),
    ({ variables }, res, ctx) => {
      if (
        variables.uid === GQLSkylarkGetMovieDraftQueryFixture.data.getObject.uid
      ) {
        return res(ctx.data(GQLSkylarkGetMovieDraftQueryFixture.data));
      }

      if (variables.uid === GQLSkylarkGetMovieQueryFixture.data.getObject.uid) {
        return res(ctx.data(GQLSkylarkGetMovieQueryFixture.data));
      }
    },
  ),

  graphql.query(
    wrapQueryName(createGetObjectQueryName("SkylarkImage")),
    ({ variables }, res, ctx) => {
      if (
        variables.uid ===
        GQLSkylarkGetObjectImageQueryFixture.data.getObject.uid
      ) {
        return res(ctx.data(GQLSkylarkGetObjectImageQueryFixture.data));
      }
    },
  ),

  graphql.query(
    wrapQueryName(createGetObjectQueryName("SkylarkSet")),
    ({ variables }, res, ctx) => {
      if (
        variables.uid ===
        GQLSkylarkGetHomepageSetQueryFixture.data.getObject.uid
      ) {
        return res(ctx.data(GQLSkylarkGetHomepageSetQueryFixture.data));
      }
    },
  ),

  graphql.query(
    wrapQueryName(createGetObjectQueryName("Season")),
    ({ variables }, res, ctx) => {
      if (
        variables.uid ===
        GQLSkylarkGetSeasonWithRelationshipsQueryFixture.data.getObject.uid
      ) {
        return res(
          ctx.data(GQLSkylarkGetSeasonWithRelationshipsQueryFixture.data),
        );
      }
    },
  ),

  graphql.query(
    wrapQueryName(createGetObjectQueryName("Episode")),
    ({ variables }, res, ctx) => {
      if (
        variables.uid ===
        GQLSkylarkGetObjectGOTS01E01QueryFixture.data.getObject.uid
      ) {
        if (variables.language === "pt-PT") {
          return res(
            ctx.data(GQLSkylarkGetObjectGOTS01E01PTPTQueryFixture.data),
          );
        }
        return res(ctx.data(GQLSkylarkGetObjectGOTS01E01QueryFixture.data));
      }
    },
  ),

  graphql.query(
    wrapQueryName(createGetObjectQueryName("Availability")),
    ({ variables }, res, ctx) => {
      if (
        variables.uid ===
        GQLSkylarkGetAvailabilityQueryFixture.data.getObject.uid
      ) {
        return res(ctx.data(GQLSkylarkGetAvailabilityQueryFixture.data));
      }
    },
  ),

  graphql.query(
    wrapQueryName(createGetObjectQueryName("SkylarkAsset")),
    ({ variables }, res, ctx) => {
      if (variables.uid === GQLSkylarkGetAssetQueryFixture.data.getObject.uid) {
        return res(ctx.data(GQLSkylarkGetAssetQueryFixture.data));
      }
    },
  ),
];

const getObjectAvailabilityHandler = (
  _: GraphQLRequest<GraphQLVariables>,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  res: ResponseComposition<any>,
  ctx: GraphQLContext<Record<string, unknown>>,
) => {
  const data = {
    getObjectAvailability: {
      availability: {
        ...GQLSkylarkGetMovieQueryAvailabilityFixture.data.getObjectAvailability
          .availability,
        objects:
          GQLSkylarkGetMovieQueryAvailabilityFixture.data.getObjectAvailability.availability.objects.map(
            (obj) => ({
              ...obj,
              [SkylarkAvailabilityField.DimensionBreakdown]: JSON.stringify(
                obj.dimensions.objects.reduce(
                  (acc, dimension) => ({
                    ...acc,
                    [dimension.slug]: dimension.values.objects.map(
                      ({ slug }) => slug,
                    ),
                  }),
                  {},
                ),
              ),
            }),
          ),
      },
    },
  };

  return res(ctx.data(data));
};

export const getObjectAvailabilityHandlers = [
  "Movie",
  "Episode",
  "Season",
  "SkylarkSet",
  "SkylarkImage",
  "SkylarkAsset",
].map((objectType) =>
  graphql.query(
    wrapQueryName(createGetObjectAvailabilityQueryName(objectType)),
    getObjectAvailabilityHandler,
  ),
);

export const getObjectAvailabilityInheritanceHandlers = [
  graphql.query(
    wrapQueryName(createGetObjectAvailabilityInheritanceQueryName("Movie")),
    (_, res, ctx) => {
      return res(
        ctx.data(GQLSkylarkGetAvailabilityInheritanceQueryFixture.data),
      );
    },
  ),
];

export const getObjectAvailabilityAssignedToHandlers = [
  graphql.query(
    wrapQueryName("GET_AVAILABILITY_ASSIGNED_TO"),
    (_, res, ctx) => {
      return res(ctx.data(GQLSkylarkGetAvailabilityAssignedToFixture.data));
    },
  ),
];

export const getObjectAvailabilityDimensionHandlers = [
  graphql.query(wrapQueryName("GET_AVAILABILITY_DIMENSIONS"), (_, res, ctx) => {
    return res(ctx.data(GQLSkylarkGetAvailabilityDimensionsQueryFixture.data));
  }),
];

export const getObjectAvailabilitySegmentsHandlers = [
  graphql.query(wrapQueryName("GET_AVAILABILITY_SEGMENTS"), (_, res, ctx) => {
    return res(ctx.data(GQLSkylarkGetAvailabilitySegmentsQueryFixture.data));
  }),
];

export const getObjectRelationshipsHandlers = [
  graphql.query(
    wrapQueryName(createGetObjectRelationshipsQueryName("Season")),
    (_, res, ctx) => {
      return res(ctx.data(GQLSkylarkGetSeasonRelationshipsQueryFixture.data));
    },
  ),
  graphql.query(
    wrapQueryName(createGetObjectRelationshipsQueryName("Movie")),
    (_, res, ctx) => {
      return res(ctx.data(GQLSkylarkGetMovieRelationshipsQueryFixture.data));
    },
  ),
];

export const getObjectContentHandlers = [
  graphql.query(
    wrapQueryName(createGetObjectContentQueryName("SkylarkSet")),
    (_, res, ctx) => {
      return res(ctx.data(GQLSkylarkGetHomepageSetContentQueryFixture.data));
    },
  ),
];

export const getObjectContentOfHandlers = [
  graphql.query(
    wrapQueryName(createGetObjectContentOfQueryName("Movie")),
    (_, res, ctx) => {
      return res(ctx.data(GQLSkylarkGetMovieContentOfFixture.data));
    },
  ),
];

export const getObjectGenericHandlers = [
  graphql.query(wrapQueryName("GET_OBJECT_GENERIC"), (_, res, ctx) => {
    return res(ctx.data(GQLSkylarkGetObjectGenericFixture.data));
  }),
];

export const getObjectVersions = [
  graphql.query(
    wrapQueryName(createGetObjectVersionsQueryName("Movie")),
    (_, res, ctx) => {
      return res(ctx.data(GQLSkylarkGetMovieVersionsFixture.data));
    },
  ),
];
