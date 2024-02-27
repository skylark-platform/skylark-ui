import { graphql } from "msw";

import GQLSkylarkRelationshipConfigMovie from "src/__tests__/fixtures/skylark/queries/getObjectTypeRelationshipConfiguration/movie.json";
import GQLSkylarkRelationshipConfigSeason from "src/__tests__/fixtures/skylark/queries/getObjectTypeRelationshipConfiguration/season.json";
import GQLSkylarkRelationshipConfigSkylarkSet from "src/__tests__/fixtures/skylark/queries/getObjectTypeRelationshipConfiguration/skylarkSet.json";
import GQLSkylarkIntrospectionQueryFixture from "src/__tests__/fixtures/skylark/queries/introspection/introspectionQuery.json";
import GQLSkylarkIntrospectionQueryWithoutEpisodeObjectQueryFixtureJSON from "src/__tests__/fixtures/skylark/queries/introspection/introspectionQueryWithoutEpisode.json";
import GQLSkylarkListSchemaVersionsQueryFixture from "src/__tests__/fixtures/skylark/queries/introspection/listSchemaVersions.json";
import GQLSkylarkObjectTypes from "src/__tests__/fixtures/skylark/queries/introspection/objectTypes.json";
import { wrapQueryName } from "src/lib/graphql/skylark/dynamicQueries";
import { SKYLARK_SCHEMA_INTROSPECTION_QUERY_NAME } from "src/lib/graphql/skylark/queries";

export const introspectionHandlers = [
  graphql.query(SKYLARK_SCHEMA_INTROSPECTION_QUERY_NAME, (req, res, ctx) => {
    return res(ctx.data(GQLSkylarkIntrospectionQueryFixture.data));
  }),

  graphql.query(wrapQueryName("GET_SKYLARK_OBJECT_TYPES"), (req, res, ctx) => {
    return res(ctx.data(GQLSkylarkObjectTypes.data));
  }),

  graphql.query(wrapQueryName("LIST_SCHEMA_VERSIONS"), (req, res, ctx) => {
    return res(ctx.data(GQLSkylarkListSchemaVersionsQueryFixture.data));
  }),

  graphql.query(
    wrapQueryName("LIST_OBJECT_TYPE_RELATIONSHIP_CONFIGURATION"),
    ({ variables }, res, ctx) => {
      if (variables.objectType === "Movie") {
        return res(ctx.data(GQLSkylarkRelationshipConfigMovie.data));
      }
      if (variables.objectType === "Season") {
        return res(ctx.data(GQLSkylarkRelationshipConfigSeason.data));
      }
      return res(ctx.data(GQLSkylarkRelationshipConfigSkylarkSet.data));
    },
  ),

  graphql.query(
    wrapQueryName("GET_CONFIGURATION_SCHEMA"),
    ({ variables }, res, ctx) => {
      if (variables.version > 1) {
        return res(
          ctx.data({
            getConfigurationSchema: JSON.stringify(
              GQLSkylarkIntrospectionQueryWithoutEpisodeObjectQueryFixtureJSON.data,
            ),
          }),
        );
      }

      return res(
        ctx.data({
          getConfigurationSchema: JSON.stringify(
            GQLSkylarkIntrospectionQueryFixture.data,
          ),
        }),
      );
    },
  ),
];
