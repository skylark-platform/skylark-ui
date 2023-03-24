import { graphql } from "msw";

import GQLSkylarkGetMovieQueryFixture from "src/__tests__/fixtures/skylark/queries/getObject/allAvailTestMovie.json";
import GQLSkylarkGetObjectImageQueryFixture from "src/__tests__/fixtures/skylark/queries/getObject/gotImage.json";
import GQLSkylarkGetObjectGOTS01E01PTPTQueryFixture from "src/__tests__/fixtures/skylark/queries/getObject/gotS01e01ptPT.json";
import GQLSkylarkGetObjectGOTS01E01QueryFixture from "src/__tests__/fixtures/skylark/queries/getObject/gots01e01.json";
import GQLSkylarkGetSetWithContentQueryFixture from "src/__tests__/fixtures/skylark/queries/getObject/setWithContent.json";
import GQLSkylarkGetMovieQueryAvailabilityFixture from "src/__tests__/fixtures/skylark/queries/getObjectAvailability/allAvailTestMovieAvailability.json";
import {
  createGetObjectAvailabilityQueryName,
  createGetObjectQueryName,
} from "src/lib/graphql/skylark/dynamicQueries";

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
    createGetObjectQueryName("Image"),
    ({ variables }, res, ctx) => {
      if (
        variables.uid ===
        GQLSkylarkGetObjectImageQueryFixture.data.getObject.uid
      ) {
        return res(ctx.data(GQLSkylarkGetObjectImageQueryFixture.data));
      }
    },
  ),

  graphql.query(createGetObjectQueryName("Set"), ({ variables }, res, ctx) => {
    if (
      variables.uid ===
      GQLSkylarkGetSetWithContentQueryFixture.data.getObject.uid
    ) {
      return res(ctx.data(GQLSkylarkGetSetWithContentQueryFixture.data));
    }
  }),

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
];

export const getObjectAvailabilityHandlers = [
  graphql.query(
    createGetObjectAvailabilityQueryName("Movie"),
    ({ variables }, res, ctx) => {
      if (variables.uid === GQLSkylarkGetMovieQueryFixture.data.getObject.uid) {
        return res(ctx.data(GQLSkylarkGetMovieQueryAvailabilityFixture.data));
      }
    },
  ),
];
