import { GQLSkylarkSchemaQueriesMutations } from "src/interfaces/graphql/introspection";
import {
  SkylarkObjectType,
  SkylarkObjectMeta,
  SkylarkObjectOperations,
} from "src/interfaces/skylark/objects";

import { parseObjectInputFields, parseObjectRelationships } from "./parsers";

export const getObjectOperations = (
  objectType: SkylarkObjectType,
  { queryType, mutationType }: GQLSkylarkSchemaQueriesMutations["__schema"],
): SkylarkObjectMeta => {
  const queries = queryType.fields;
  const getQuery = queries.find((query) => query.name === `get${objectType}`);
  const listQuery = queries.find((query) => query.name === `list${objectType}`);

  const mutations = mutationType.fields;
  const createMutation = mutations.find(
    (mutation) => mutation.name === `create${objectType}`,
  );
  const updateMutation = mutations.find(
    (mutation) => mutation.name === `update${objectType}`,
  );
  const deleteMutation = mutations.find(
    (mutation) => mutation.name === `delete${objectType}`,
  );

  if (
    !getQuery ||
    !listQuery ||
    !createMutation ||
    !updateMutation ||
    !deleteMutation
  ) {
    throw new Error("Skylark ObjectType is missing expected operation");
  }

  const objectFields = parseObjectInputFields(
    getQuery?.type.fields.filter((field) => field.type.kind !== "OBJECT"),
  );

  const createInputFields = createMutation.args.find(
    (arg) => arg.type.name === `${objectType}CreateInput`,
  )?.type.inputFields;

  const createInputs = parseObjectInputFields(createInputFields);
  const createRelationships = parseObjectRelationships(createInputFields);

  const operations: SkylarkObjectOperations = {
    get: {
      type: "Query",
      name: getQuery.name,
    },
    list: {
      type: "Query",
      name: listQuery.name,
    },
    create: {
      type: "Mutation",
      name: createMutation.name,
      inputs: createInputs,
      relationships: createRelationships,
    },
  };

  const object: SkylarkObjectMeta = {
    name: objectType,
    fields: objectFields || [],
    operations,
  };

  return object;
};
