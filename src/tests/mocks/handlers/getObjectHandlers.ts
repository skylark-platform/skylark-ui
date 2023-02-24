import { graphql } from "msw";

import { createGetObjectQueryName } from "src/lib/graphql/skylark/dynamicQueries";
import GQLSkylarkGetMovieQueryFixture from "src/tests/fixtures/skylark/queries/getObject/allAvailTestMovie.json";
import GQLSkylarkGetObjectImageQueryFixture from "src/tests/fixtures/skylark/queries/getObject/gotImage.json";
import GQLSkylarkGetSetWithContentQueryFixture from "src/tests/fixtures/skylark/queries/getObject/setWithContent.json";

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
