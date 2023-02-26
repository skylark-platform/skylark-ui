import { graphql } from "msw";

import GQLSkylarkGetMovieQueryFixture from "src/__tests__/fixtures/skylark/queries/getObject/allAvailTestMovie.json";
import GQLSkylarkGetObjectImageQueryFixture from "src/__tests__/fixtures/skylark/queries/getObject/gotImage.json";
import GQLSkylarkGetSetWithContentQueryFixture from "src/__tests__/fixtures/skylark/queries/getObject/setWithContent.json";
import { createGetObjectQueryName } from "src/lib/graphql/skylark/dynamicQueries";

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
];
