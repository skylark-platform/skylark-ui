import { GQLSkylarkSchemaQueriesMutations } from "src/interfaces/graphql/introspection";
import {
  SkylarkObjectType,
  SkylarkObjectMeta,
  SkylarkObjectOperations,
  BuiltInSkylarkObjectType,
  SkylarkSystemField,
  SkylarkSystemGraphQLType,
} from "src/interfaces/skylark";

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

const objectHasRelationshipFromField = (
  relationshipField: "images" | SkylarkSystemField,
  getQuery: GQLSkylarkSchemaQueriesMutations["__schema"]["queryType"]["fields"][0],
) => {
  if (!getQuery || !getQuery.type || !getQuery.type.fields) {
    return false;
  }

  return getQuery.type.fields.some(
    (field) => field.name === relationshipField && field.type.kind === "OBJECT",
  );
};

const objectRelationshipFieldsFromGraphQLType = (
  type: SkylarkSystemGraphQLType,
  getQuery: GQLSkylarkSchemaQueriesMutations["__schema"]["queryType"]["fields"][0],
): {
  objectType: SkylarkObjectType;
  relationshipNames: string[];
} | null => {
  if (!getQuery || !getQuery.type || !getQuery.type.fields) {
    return null;
  }

  const relationships = getQuery.type.fields
    .filter((field) => field.type.name === type && field.type.kind === "OBJECT")
    .map((field) => {
      // Naive implementation, just removes Listing from ImageListing
      const objectType =
        field.type.name?.substring(
          0,
          field.type.name?.lastIndexOf("Listing"),
        ) || "";
      return {
        objectType,
        relationshipName: field.name,
      };
    });

  if (relationships.length === 0) {
    return null;
  }

  return {
    // For now, image's can't be inherited like sets
    objectType: relationships[0].objectType,
    relationshipNames: relationships.map(
      ({ relationshipName }) => relationshipName,
    ),
  };
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
    const missingOperations = [
      !getQuery && "getQuery",
      !listQuery && "listQuery",
      !createMutation && "createMutation",
      !updateMutation && "updateMutation",
      !deleteMutation && "deleteMutation",
    ]
      .filter((str) => str)
      .join(", ");
    throw new Error(
      `Skylark ObjectType "${objectType}" is missing expected operations "${missingOperations}"`,
    );
  }

  const objectFields = getObjectFieldsFromGetQuery(getQuery);

  const hasAvailability = objectHasRelationshipFromField(
    SkylarkSystemField.Availability,
    getQuery,
  );
  const availability = hasAvailability
    ? getObjectOperations(BuiltInSkylarkObjectType.Availability, {
        queryType,
        mutationType,
      })
    : null;

  const hasContent = objectHasRelationshipFromField(
    SkylarkSystemField.Content,
    getQuery,
  );

  // TODO when Beta 1 environments are turned off, remove the BetaSkylarkImageListing check
  const imageRelationships =
    objectRelationshipFieldsFromGraphQLType(
      SkylarkSystemGraphQLType.SkylarkImageListing,
      getQuery,
    ) ||
    objectRelationshipFieldsFromGraphQLType(
      SkylarkSystemGraphQLType.BetaSkylarkImageListing,
      getQuery,
    );
  const imageOperations = imageRelationships
    ? getObjectOperations(imageRelationships.objectType, {
        queryType,
        mutationType,
      })
    : null;

  // Parse the relationships out of the create mutation as it has a relationships parameter
  const { relationships, ...createMeta } = getMutationInfo(
    createMutation,
    objectType,
    "create",
  );
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
    },
    update: {
      type: "Mutation",
      name: updateMutation.name,
      argName: updateMeta.argName,
      inputs: updateMeta.inputs,
    },
    delete: {
      type: "Mutation",
      name: deleteMutation.name,
      argName: "",
      inputs: [],
    },
  };

  const object: SkylarkObjectMeta = {
    name: objectType,
    fields: objectFields,
    images:
      imageRelationships && imageOperations
        ? {
            objectMeta: imageOperations,
            relationshipNames: imageRelationships.relationshipNames,
          }
        : null,
    operations,
    availability,
    relationships,
    hasContent,
  };

  return object;
};

export const getAllObjectsMeta = (
  schema: GQLSkylarkSchemaQueriesMutations["__schema"],
  objects: string[],
) => {
  const objectOperations = objects.map((objectType) => {
    return getObjectOperations(objectType, schema);
  });

  return objectOperations;
};
