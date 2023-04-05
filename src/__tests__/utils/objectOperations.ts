import { IntrospectionSchema } from "graphql";

import GQLSkylarkSchemaQueryFixture from "src/__tests__/fixtures/skylark/queries/introspection/introspectionQuery.json";
import { getObjectOperations } from "src/lib/skylark/objects";

export const episodeObjectOperations = getObjectOperations(
  "Episode",
  GQLSkylarkSchemaQueryFixture.data.__schema as unknown as IntrospectionSchema,
);

export const seasonObjectOperations = getObjectOperations(
  "Season",
  GQLSkylarkSchemaQueryFixture.data.__schema as unknown as IntrospectionSchema,
);

export const movieObjectOperations = getObjectOperations(
  "Movie",
  GQLSkylarkSchemaQueryFixture.data.__schema as unknown as IntrospectionSchema,
);

export const setObjectOperations = getObjectOperations(
  "SkylarkSet",
  GQLSkylarkSchemaQueryFixture.data.__schema as unknown as IntrospectionSchema,
);

export const imageObjectOperations = getObjectOperations(
  "SkylarkImage",
  GQLSkylarkSchemaQueryFixture.data.__schema as unknown as IntrospectionSchema,
);
