import {
  IntrospectionEnumType,
  IntrospectionField,
  IntrospectionInputObjectType,
  IntrospectionInputValue,
  IntrospectionListTypeRef,
  IntrospectionNamedTypeRef,
  IntrospectionNonNullTypeRef,
  IntrospectionObjectType,
  IntrospectionOutputType,
  IntrospectionQuery,
  IntrospectionScalarType,
} from "graphql";

import { OBJECT_LIST_TABLE, SYSTEM_FIELDS } from "src/constants/skylark";
import { ErrorCodes } from "src/interfaces/errors";
import {
  SkylarkObjectType,
  SkylarkObjectMeta,
  SkylarkObjectOperations,
  BuiltInSkylarkObjectType,
  SkylarkSystemField,
  SkylarkSystemGraphQLType,
  NormalizedObjectField,
  SkylarkObjectRelationship,
} from "src/interfaces/skylark";
import { ObjectError } from "src/lib/utils/errors";

import { parseObjectInputFields, parseObjectRelationships } from "./parsers";

const getObjectInterface = (
  schemaTypes: IntrospectionQuery["__schema"]["types"],
  interfaceName?: string,
) => {
  const objectInterface = interfaceName
    ? schemaTypes.find(({ name }) => name === interfaceName)
    : undefined;
  return objectInterface as IntrospectionObjectType | undefined;
};

const getObjectInterfaceFromIntrospectionField = (
  schemaTypes: IntrospectionQuery["__schema"]["types"],
  introspectionField?: IntrospectionField,
): IntrospectionObjectType | undefined => {
  const objectInterfaceName = (
    introspectionField?.type as
      | IntrospectionNamedTypeRef<IntrospectionOutputType>
      | undefined
  )?.name;

  return getObjectInterface(schemaTypes, objectInterfaceName);
};

const getInputObjectInterfaceFromIntrospectionField = (
  mutation: IntrospectionField,
  objectType: string,
): IntrospectionInputValue | undefined => {
  const validOperationInterfaces = [
    `${objectType}CreateInput`,
    `${objectType}Input`,
  ];

  const foundCreateInput = mutation.args.find((arg) => {
    const typeName =
      (
        arg.type as
          | IntrospectionNonNullTypeRef<IntrospectionScalarType>
          | IntrospectionListTypeRef<IntrospectionScalarType>
      ).ofType?.name || (arg.type as IntrospectionScalarType).name;

    return validOperationInterfaces.includes(typeName);
  });

  return foundCreateInput;
};

const getObjectFields = (
  enums: Record<string, IntrospectionEnumType>,
  objectInterface?: IntrospectionObjectType,
): NormalizedObjectField[] => {
  if (!objectInterface) {
    return [];
  }

  const objectFields = parseObjectInputFields(
    objectInterface.fields.filter((field) => field.type.kind !== "OBJECT"),
    enums,
  );

  return objectFields;
};

const getGlobalAndTranslatableFields = (
  schemaTypes: IntrospectionQuery["__schema"]["types"],
  objectType: string,
  objectFields: NormalizedObjectField[],
): { global: string[]; translatable: string[] } => {
  const globalInterfaceName = `_${objectType}Global`;
  const languageInterfaceName = `_${objectType}Language`;

  const globalInterface = getObjectInterface(schemaTypes, globalInterfaceName);
  const languageInterface = getObjectInterface(
    schemaTypes,
    languageInterfaceName,
  );

  const objectFieldNames = objectFields.map(({ name }) => name);

  if (!globalInterface || !languageInterface) {
    // If for some reason one interface isn't found, return all fields as global fields
    return {
      global: objectFieldNames,
      translatable: [],
    };
  }

  const globalFields = globalInterface.fields
    .filter(({ name }) => objectFieldNames.includes(name))
    .map(({ name }) => name);
  const translatableFields = languageInterface.fields
    .filter(({ name }) => objectFieldNames.includes(name))
    .map(({ name }) => name);

  return {
    global: globalFields,
    translatable: translatableFields,
  };
};

const objectHasRelationshipFromInterface = (
  relationshipField: "images" | SkylarkSystemField,
  objectInterface?: IntrospectionObjectType,
) => {
  if (!objectInterface) {
    return false;
  }

  return objectInterface.fields.some(
    (field) => field.name === relationshipField && field.type.kind === "OBJECT",
  );
};

const objectRelationshipFieldsFromGraphQLType = (
  type: SkylarkSystemGraphQLType,
  objectInterface?: IntrospectionObjectType,
): {
  objectType: SkylarkObjectType;
  relationshipNames: string[];
} | null => {
  if (!objectInterface) {
    return null;
  }

  const relationships = objectInterface.fields
    .filter(
      (field) =>
        (field.type as IntrospectionObjectType).name === type &&
        field.type.kind === "OBJECT",
    )
    .map((field) => {
      // Naive implementation, just removes Listing from ImageListing
      const typeName = (field.type as IntrospectionObjectType | undefined)
        ?.name;
      const objectType =
        typeName?.substring(0, typeName?.lastIndexOf("Listing")) || "";
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

const getObjectRelationshipsFromInputFields = (
  schemaTypes: IntrospectionQuery["__schema"]["types"],
  inputFields?: readonly IntrospectionInputValue[],
): SkylarkObjectRelationship[] => {
  const relationshipsInput = inputFields?.find(
    (input) => input.name === "relationships",
  );

  if (!relationshipsInput) {
    return [];
  }

  const relationshipsTypeName =
    (
      relationshipsInput?.type as
        | IntrospectionNonNullTypeRef<IntrospectionScalarType>
        | IntrospectionListTypeRef<IntrospectionScalarType>
    ).ofType?.name || (relationshipsInput.type as IntrospectionScalarType).name;

  const relationshipsInterface = schemaTypes.find(
    ({ name, kind }) =>
      name === relationshipsTypeName && kind === "INPUT_OBJECT",
  ) as IntrospectionInputObjectType | undefined;

  const relationships = parseObjectRelationships(
    relationshipsInterface?.inputFields,
  );

  return relationships;
};

const getMutationInfo = (
  schemaTypes: IntrospectionQuery["__schema"]["types"],
  enums: Record<string, IntrospectionEnumType>,
  inputObject?: IntrospectionInputValue,
) => {
  const argName = inputObject?.name || "";

  const inputInterfaceName =
    (
      inputObject?.type as
        | IntrospectionNonNullTypeRef<IntrospectionScalarType>
        | IntrospectionListTypeRef<IntrospectionScalarType>
    ).ofType?.name || (inputObject?.type as IntrospectionScalarType).name;

  const inputInterface = schemaTypes.find(
    ({ name, kind }) => name === inputInterfaceName && kind === "INPUT_OBJECT",
  ) as IntrospectionInputObjectType | undefined;

  const inputFields = inputInterface?.inputFields;

  const inputs = inputFields ? parseObjectInputFields(inputFields, enums) : [];
  const relationships = getObjectRelationshipsFromInputFields(
    schemaTypes,
    inputFields,
  );

  return {
    argName,
    inputs,
    relationships,
  };
};

export const getObjectOperations = (
  objectType: SkylarkObjectType,
  schema: IntrospectionQuery["__schema"],
): SkylarkObjectMeta => {
  const objectTypeExists = schema.types.find(
    ({ name, kind }) => name === objectType && kind === "OBJECT",
  );
  if (!objectTypeExists) {
    throw new ObjectError(
      ErrorCodes.NotFound,
      `Schema: Object "${objectType}" not found`,
    );
  }

  const queries = (
    schema.types.find(
      ({ name, kind }) => name === schema.queryType.name && kind === "OBJECT",
    ) as IntrospectionObjectType | undefined
  )?.fields;

  const mutations = (
    schema.types.find(
      ({ name, kind }) =>
        name === schema.mutationType?.name && kind === "OBJECT",
    ) as IntrospectionObjectType | undefined
  )?.fields;

  const enums: Record<string, IntrospectionEnumType> = schema.types.reduce(
    (prev, potentialEnumInterface) => {
      if (potentialEnumInterface.kind !== "ENUM") {
        return prev;
      }

      const enumInterface = potentialEnumInterface as IntrospectionEnumType;
      return {
        ...prev,
        [enumInterface.name]: enumInterface,
      };
    },
    {},
  );

  if (!queries || !mutations) {
    throw new ObjectError(
      ErrorCodes.NotFound,
      `Schema: Unable to locate "${
        queries ? "Queries" : "Mutations"
      }" in the Introspection response`,
    );
  }

  const getQuery = queries.find(
    (query) => query.name === `get${objectType}`,
  ) as IntrospectionField | undefined;
  const listQuery = queries.find(
    (query) => query.name === `list${objectType}`,
  ) as IntrospectionField | undefined;

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
    throw new ObjectError(
      ErrorCodes.NotFound,
      `Schema: Skylark ObjectType "${objectType}" is missing expected operations "${missingOperations}"`,
    );
  }

  const getObjectInterface = getObjectInterfaceFromIntrospectionField(
    schema.types,
    getQuery,
  );
  const createInputObjectInterface =
    getInputObjectInterfaceFromIntrospectionField(createMutation, objectType);
  const updateInputObjectInterface =
    getInputObjectInterfaceFromIntrospectionField(updateMutation, objectType);

  const objectFields = getObjectFields(enums, getObjectInterface);
  const fieldConfig = getGlobalAndTranslatableFields(
    schema.types,
    objectType,
    objectFields,
  );

  const hasAvailability = objectHasRelationshipFromInterface(
    SkylarkSystemField.Availability,
    getObjectInterface,
  );
  const availability = hasAvailability
    ? getObjectOperations(BuiltInSkylarkObjectType.Availability, schema)
    : null;

  const hasContent = objectHasRelationshipFromInterface(
    SkylarkSystemField.Content,
    getObjectInterface,
  );

  // TODO when Beta 1 environments are turned off, remove the BetaSkylarkImageListing check
  const imageRelationships =
    objectRelationshipFieldsFromGraphQLType(
      SkylarkSystemGraphQLType.SkylarkImageListing,
      getObjectInterface,
    ) ||
    objectRelationshipFieldsFromGraphQLType(
      SkylarkSystemGraphQLType.BetaSkylarkImageListing,
      getObjectInterface,
    );
  const imageOperations = imageRelationships
    ? getObjectOperations(imageRelationships.objectType, schema)
    : null;

  // Parse the relationships out of the create mutation as it has a relationships parameter
  const { relationships, ...createMeta } = getMutationInfo(
    schema.types,
    enums,
    createInputObjectInterface,
  );

  const updateMeta = getMutationInfo(
    schema.types,
    enums,
    updateInputObjectInterface,
  );

  const hasRelationships = relationships.length > 0;

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

  const objectMeta: SkylarkObjectMeta = {
    name: objectType,
    fields: objectFields,
    fieldConfig,
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
    hasRelationships,
    hasContent,
    hasAvailability,
    isTranslatable: objectType !== BuiltInSkylarkObjectType.Availability,
  };

  return objectMeta;
};

export const getAllObjectsMeta = (
  schema: IntrospectionQuery["__schema"],
  objects: string[],
) => {
  const objectOperations = objects.map((objectType) => {
    return getObjectOperations(objectType, schema);
  });

  return objectOperations;
};

export const splitMetadataIntoSystemTranslatableGlobal = (
  allMetadataFields: string[],
  inputFields: NormalizedObjectField[],
  fieldConfig: SkylarkObjectMeta["fieldConfig"],
  options?: {
    objectTypes: string[];
    hiddenFields: string[];
  },
): {
  systemMetadataFields: {
    field: string;
    config?: NormalizedObjectField;
  }[];
  globalMetadataFields: {
    field: string;
    config?: NormalizedObjectField;
  }[];
  translatableMetadataFields: {
    field: string;
    config?: NormalizedObjectField;
  }[];
} => {
  const metadataArr = allMetadataFields.map((field) => {
    // Use update operation fields as get doesn't always have the full types
    const fieldConfig = inputFields.find(({ name }) => name === field);
    return {
      field,
      config: fieldConfig,
    };
  });

  const defaultFieldsToHide = [
    OBJECT_LIST_TABLE.columnIds.objectType,
    SkylarkSystemField.DataSourceID,
    SkylarkSystemField.DataSourceFields,
  ];
  const fieldsToHide = options
    ? [...options.hiddenFields, ...defaultFieldsToHide]
    : defaultFieldsToHide;

  const metadataArrWithHiddenFieldsRemoved = metadataArr.filter(
    ({ field }) => !fieldsToHide.includes(field.toLowerCase()),
  );

  const systemMetadataFields = metadataArrWithHiddenFieldsRemoved
    .filter(({ field }) => SYSTEM_FIELDS.includes(field))
    .sort(
      ({ field: a }, { field: b }) =>
        SYSTEM_FIELDS.indexOf(b) - SYSTEM_FIELDS.indexOf(a),
    );

  const otherFields = metadataArrWithHiddenFieldsRemoved.filter(
    ({ field }) => !SYSTEM_FIELDS.includes(field),
  );

  const globalMetadataFields = otherFields.filter(({ field }) =>
    fieldConfig.global.includes(field),
  );
  const translatableMetadataFields = otherFields.filter(({ field }) =>
    fieldConfig.translatable.includes(field),
  );

  return {
    systemMetadataFields,
    globalMetadataFields,
    translatableMetadataFields,
  };
};
