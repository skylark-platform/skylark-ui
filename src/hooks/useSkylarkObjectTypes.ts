import { gql, useQuery } from "@apollo/client";

import {
  GQLInputField,
  GQLInputValue,
  GQLMutationsList,
  GQLScalars,
  GQLSkylarkObjectTypesResponse,
  GQLSkylarkSchemaQueriesMutations,
} from "src/interfaces/graphql/introspection";
import {
  NormalizedObjectField,
  NormalizedObjectFieldType,
  SkylarkObjectMeta,
  SkylarkObjectOperations,
  SkylarkObjectType,
} from "src/interfaces/skylark/objects";
import { createGetObjectQuery } from "src/lib/graphql/skylark/dynamicQueries";
import {
  GET_SKYLARK_SCHEMA,
  GET_SKYLARK_OBJECT_TYPES,
} from "src/lib/graphql/skylark/queries";

export const useSkylarkObjectTypes = () => {
  const { data, ...rest } = useQuery<GQLSkylarkObjectTypesResponse>(
    GET_SKYLARK_OBJECT_TYPES,
  );

  const objectTypes = data?.__type.enumValues.map(({ name }) => name);

  return {
    objectTypes,
    ...rest,
  };
};

// TODO convert from "credits" to the Object type like "Credit" or "episodes" -> "Episode"
const parseObjectRelationships = (inputFields?: GQLInputField[]): string[] => {
  return (
    inputFields
      ?.find((input) => input.name === "relationships")
      ?.type.inputFields.map((relationship) => relationship.name) || []
  );
};

const parseObjectInputType = (
  name?: GQLScalars | string,
): NormalizedObjectFieldType => {
  if (!name) return "string";
  switch (name) {
    case "AWSTimestamp":
    case "AWSTime":
      return "time";
    case "AWSDate":
      return "date";
    case "AWSDateTime":
      return "datetime";
    case "AWSEmail":
      return "email";
    case "AWSPhone":
      return "phone";
    case "Int":
      return "int";
    case "Float":
      return "float";
    case "Boolean":
      return "boolean";
    case "String":
    default:
      return "string";
  }
};

const parseObjectInputFields = (
  inputFields?: GQLInputField[],
): NormalizedObjectField[] => {
  if (!inputFields) {
    return [];
  }

  // We handle relationships and availability separately
  // TODO uses more than name strings to ignore these (incase the user has a name clash)
  const inputsToIgnore = ["relationships", "availability"];

  const parsedInputs = inputFields
    .filter(({ name }) => !inputsToIgnore.includes(name))
    .map((input): NormalizedObjectField => {
      let type: NormalizedObjectFieldType = parseObjectInputType(
        input.type.ofType?.name || input.type.name,
      );
      let enumValues;

      if (input.type.kind === "ENUM") {
        type = "enum";
        enumValues = input.type.enumValues?.map((val) => val.name);
      }

      return {
        name: input.name,
        type: type,
        enumValues,
        isList: input.type.kind === "LIST",
        isRequired: input.type.kind === "NON_NULL",
      };
    });

  return parsedInputs;
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

  console.log({ createMutation });

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

// Returns the operations for a given object (createEpisode etc for Episode)
// Should be fast as it'll keep hitting the Apollo cache both requests noice
export const useSkylarkObjectOperations = (objectType: SkylarkObjectType) => {
  const { data, ...rest } =
    useQuery<GQLSkylarkSchemaQueriesMutations>(GET_SKYLARK_SCHEMA);

  if (!data || !objectType) {
    return { object: null, ...rest };
  }

  const object = getObjectOperations(objectType, data.__schema);

  return {
    object,
    ...rest,
  };
};
