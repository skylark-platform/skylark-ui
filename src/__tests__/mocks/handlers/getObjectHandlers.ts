import { graphql } from "msw";

import GQLSkylarkGetAvailabilityQueryFixture from "src/__tests__/fixtures/skylark/queries/getObject/allDevicesAllCustomersAvailability.json";
import GQLSkylarkGetMovieQueryFixture from "src/__tests__/fixtures/skylark/queries/getObject/fantasticMrFox_All_Availabilities.json";
import GQLSkylarkGetObjectImageQueryFixture from "src/__tests__/fixtures/skylark/queries/getObject/gotImage.json";
import GQLSkylarkGetObjectGOTS01E01QueryFixture from "src/__tests__/fixtures/skylark/queries/getObject/gots01e01.json";
import GQLSkylarkGetObjectGOTS01E01PTPTQueryFixture from "src/__tests__/fixtures/skylark/queries/getObject/gots01e01ptPT.json";
import GQLSkylarkGetSeasonWithRelationshipsQueryFixture from "src/__tests__/fixtures/skylark/queries/getObject/gots04.json";
import GQLSkylarkGetHomepageSetQueryFixture from "src/__tests__/fixtures/skylark/queries/getObject/homepage.json";
import GQLSkylarkGetMovieQueryAvailabilityFixture from "src/__tests__/fixtures/skylark/queries/getObjectAvailability/fantasticMrFox_All_Availabilities.json";
import GQLSkylarkGetAvailabilityDimensionsQueryFixture from "src/__tests__/fixtures/skylark/queries/getObjectDimensions/allDevicesAllCustomersAvailability.json";
import GQLSkylarkGetSeasonRelationshipsQueryFixture from "src/__tests__/fixtures/skylark/queries/getObjectRelationships/gots04relationships.json";
import GQLSkylarkGetObjectsConfigFixture from "src/__tests__/fixtures/skylark/queries/getObjectsConfig/allObjectsConfig.json";
import {
  createGetObjectAvailabilityQueryName,
  createGetObjectQueryName,
  createGetObjectRelationshipsQueryName,
} from "src/lib/graphql/skylark/dynamicQueries";

export const getObjectsConfigHandlers = [
  graphql.query("GET_OBJECTS_CONFIG", (req, res, ctx) => {
    return res(ctx.data(GQLSkylarkGetObjectsConfigFixture.data));
  }),
];

export const getObjectHandlers = [
  graphql.query(
    createGetObjectQueryName("Movie"),
    ({ variables }, res, ctx) => {
      if (variables.uid === GQLSkylarkGetMovieQueryFixture.data.getObject.uid) {
        return res(ctx.data(GQLSkylarkGetMovieQueryFixture.data));
      }
    },
  ),

  graphql.query(
    createGetObjectQueryName("SkylarkImage"),
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
    createGetObjectQueryName("SkylarkSet"),
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
    createGetObjectQueryName("Season"),
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
    createGetObjectQueryName("Episode"),
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
    createGetObjectQueryName("Availability"),
    ({ variables }, res, ctx) => {
      if (
        variables.uid ===
        GQLSkylarkGetAvailabilityQueryFixture.data.getObject.uid
      ) {
        return res(ctx.data(GQLSkylarkGetAvailabilityQueryFixture.data));
      }
    },
  ),
];

export const getObjectAvailabilityHandlers = [
  graphql.query(
    createGetObjectAvailabilityQueryName("Movie"),
    (_, res, ctx) => {
      return res(ctx.data(GQLSkylarkGetMovieQueryAvailabilityFixture.data));
    },
  ),
];

export const getObjectAvailabilityDimensionHandlers = [
  graphql.query("GET_AVAILABILITY_DIMENSIONS", (_, res, ctx) => {
    return res(ctx.data(GQLSkylarkGetAvailabilityDimensionsQueryFixture.data));
  }),
];

export const getObjectRelationshipsHandlers = [
  graphql.query(
    createGetObjectRelationshipsQueryName("Season"),
    (_, res, ctx) => {
      return res(ctx.data(GQLSkylarkGetSeasonRelationshipsQueryFixture.data));
    },
  ),
];
