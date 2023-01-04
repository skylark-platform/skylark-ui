import { GQLSkylarkSchemaQueriesMutations } from "src/interfaces/graphql/introspection";
import {
  SkylarkObjectType,
  SkylarkObjectMeta,
  SkylarkObjectOperations,
} from "src/interfaces/skylark/objects";

import { parseObjectInputFields, parseObjectRelationships } from "./parsers";

const getObjectFieldsFromGetQuery = (
  getQuery: GQLSkylarkSchemaQueriesMutations["__schema"]["queryType"]["fields"][0],
) => {
  if (!getQuery || !getQuery.type || !getQuery.type.fields) {
    return [];
  }

  const objectFields = parseObjectInputFields(
    getQuery.type.fields.filter((field) => field.type.kind !== "OBJECT"),
  );
  return objectFields;
};

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

  const objectFields = getObjectFieldsFromGetQuery(getQuery);

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
    fields: objectFields,
    operations,
  };

  return object;
};

const getAllObjectFields = (
  queryType: GQLSkylarkSchemaQueriesMutations["__schema"]["queryType"],
) => {
  const queries = queryType.fields;
  const getQueries = queries.filter((query) => query.name.startsWith("get"));
  const allObjectsWithFields = getQueries
    .map((getQuery) => {
      const objectFields = getObjectFieldsFromGetQuery(getQuery);
      return {
        name: getQuery.type.name,
        fields: objectFields,
      };
    })
    .filter(({ name, fields }) => name && fields.length > 0);

  return allObjectsWithFields;
};

export const getAllSearchableObjectFields = (
  queryType: GQLSkylarkSchemaQueriesMutations["__schema"]["queryType"],
  searchableObjects: string[],
) => {
  const validObjects = getAllObjectFields(queryType).filter((object) =>
    searchableObjects.includes(object.name),
  );
  return validObjects;
};
