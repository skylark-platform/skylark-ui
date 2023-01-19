import { GQLSkylarkSchemaQueriesMutations } from "src/interfaces/graphql/introspection";
import {
  SkylarkObjectType,
  SkylarkObjectMeta,
  SkylarkObjectOperations,
  BuiltInSkylarkObjectType,
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

const objectHasRelationship = (

  relationship: "availability" | "images",

  getQuery: GQLSkylarkSchemaQueriesMutations["__schema"]["queryType"]["fields"][0],
) => {
  if (!getQuery || !getQuery.type || !getQuery.type.fields) {
    return false;
  }

  return getQuery.type.fields.some(
    (field) => field.name === relationship && field.type.kind === "OBJECT",
  );

};

const getMutationInfo = (
  mutation: GQLSkylarkSchemaQueriesMutations["__schema"]["mutationType"]["fields"][0],
  objectType: string,
  operation: "create" | "update",
) => {
  // On create it will be like EpisodeCreateInput but on update EpisodeInput
  const foundCreateInput = mutation.args.find(
    (arg) =>
      arg.type.name ===
      `${objectType}${operation === "create" ? "Create" : ""}Input`,
  );
  const argName = foundCreateInput?.name || "";
  const inputFields = foundCreateInput?.type.inputFields;
  const inputs = parseObjectInputFields(inputFields);
  const relationships = parseObjectRelationships(inputFields);
  return {
    argName,
    inputs,
    relationships,
  };
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
  const hasImages = objectHasRelationship("images", getQuery);

  const hasAvailability = objectHasRelationship("availability", getQuery);
  const availability = hasAvailability
    ? getObjectOperations(BuiltInSkylarkObjectType.Availability, {
        queryType,
        mutationType,
      })
    : null;

  const createMeta = getMutationInfo(createMutation, objectType, "create");
  const updateMeta = getMutationInfo(updateMutation, objectType, "update");

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
      argName: createMeta.argName,
      inputs: createMeta.inputs,
      relationships: createMeta.relationships,
    },
    update: {
      type: "Mutation",
      name: updateMutation.name,
      argName: updateMeta.argName,
      inputs: updateMeta.inputs,
      relationships: updateMeta.relationships,
    },
    delete: {
      type: "Mutation",
      name: deleteMutation.name,
      argName: "",
      inputs: [],
      relationships: [],
    },
  };

  const object: SkylarkObjectMeta = {
    name: objectType,
    fields: objectFields,
    hasImages: hasImages,
    operations,
    availability,
  };

  return object;
};

export const getAllSearchableObjectsMeta = (
  schema: GQLSkylarkSchemaQueriesMutations["__schema"],
  searchableObjects: string[],
) => {
  const objects = searchableObjects.map((objectType) => {
    return getObjectOperations(objectType, schema);
  });

  return objects;
};
