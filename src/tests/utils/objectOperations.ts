import { GQLSkylarkSchemaQueriesMutations } from "src/interfaces/graphql/introspection";
import { getObjectOperations } from "src/lib/skylark/objects";
import GQLSkylarkSchemaQueryFixture from "src/tests/fixtures/skylark/queries/introspection/schema.json";

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
  "Set",
  GQLSkylarkSchemaQueryFixture.data
    .__schema as unknown as GQLSkylarkSchemaQueriesMutations["__schema"],
);

export const imageObjectOperations = getObjectOperations(
  "Image",
  GQLSkylarkSchemaQueryFixture.data
    .__schema as unknown as GQLSkylarkSchemaQueriesMutations["__schema"],
);
