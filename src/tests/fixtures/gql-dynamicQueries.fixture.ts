import { DocumentNode } from "graphql";

import { SkylarkObjectFields } from "src/interfaces/skylark/objects";
import { createSearchObjectsQuery } from "src/lib/graphql/skylark/dynamicQueries";

import {
  SKYLARK_OBJECT_TYPES_FIXTURE,
  SKYLARK_OBJECT_FIELDS_FIXTURE,
} from "./gql-introspection.fixture";

const searchableObjects = SKYLARK_OBJECT_TYPES_FIXTURE.map((name) => ({
  name,
  fields: SKYLARK_OBJECT_FIELDS_FIXTURE.map((name) => ({
    name,
    type: "string",
    isList: false,
    isRequired: false,
  })),
})) as SkylarkObjectFields[];

export const GQLSkylarkDynamicSearchQuery = createSearchObjectsQuery(
  searchableObjects,
  SKYLARK_OBJECT_TYPES_FIXTURE,
) as DocumentNode;
