import GQLSkylarkSchemaQueryFixture from "src/__tests__/fixtures/skylark/queries/introspection/schema.json";
import { GQLSkylarkSchemaQueriesMutations } from "src/interfaces/graphql/introspection";
import { getObjectOperations } from "src/lib/skylark/objects";

export const episodeObjectOperations = getObjectOperations(
  "Episode",
  GQLSkylarkSchemaQueryFixture.data
    .__schema as unknown as GQLSkylarkSchemaQueriesMutations["__schema"],
);

export const seasonObjectOperations = getObjectOperations(
  "Season",
  GQLSkylarkSchemaQueryFixture.data
    .__schema as unknown as GQLSkylarkSchemaQueriesMutations["__schema"],
);

export const movieObjectOperations = getObjectOperations(
  "Movie",
  GQLSkylarkSchemaQueryFixture.data
    .__schema as unknown as GQLSkylarkSchemaQueriesMutations["__schema"],
);

export const setObjectOperations = getObjectOperations(
  "SkylarkSet",
  GQLSkylarkSchemaQueryFixture.data
    .__schema as unknown as GQLSkylarkSchemaQueriesMutations["__schema"],
);

export const imageObjectOperations = getObjectOperations(
  "SkylarkImage",
  GQLSkylarkSchemaQueryFixture.data
    .__schema as unknown as GQLSkylarkSchemaQueriesMutations["__schema"],
);
