import {
  IntrospectionEnumType,
  IntrospectionField,
  IntrospectionInputObjectType,
  IntrospectionInputValue,
  IntrospectionInterfaceType,
  IntrospectionListTypeRef,
  IntrospectionNamedTypeRef,
  IntrospectionNonNullTypeRef,
  IntrospectionObjectType,
  IntrospectionOutputType,
  IntrospectionQuery,
  IntrospectionScalarType,
  IntrospectionSchema,
} from "graphql";

import { OBJECT_LIST_TABLE, SYSTEM_FIELDS } from "src/constants/skylark";
import { ErrorCodes } from "src/interfaces/errors";
import {
  SkylarkObjectType,
  SkylarkObjectMeta,
  SkylarkObjectOperations,
  BuiltInSkylarkObjectType,
  SkylarkSystemField,
  NormalizedObjectField,
  SkylarkObjectMetaRelationship,
  ParsedSkylarkObject,
  SkylarkObject,
  ParsedSkylarkObjectConfig,
  ParsedSkylarkObjectMetadata,
  SkylarkAvailabilityField,
  ParsedSkylarkObjectAvailability,
} from "src/interfaces/skylark";
import {
  getObjectDisplayName,
  getObjectTypeDisplayNameFromParsedObject,
  getPlaybackPolicyFromMetadata,
  getObjectTypeFromListingTypeName,
  isAvailabilityOrAudienceSegment,
  isAudienceSegment,
} from "src/lib/utils";
import { ObjectError } from "src/lib/utils/errors";

import { parseObjectInputFields, parseObjectRelationships } from "./parsers";

const objectsWithoutListQuery: string[] = [
  BuiltInSkylarkObjectType.SkylarkFavoriteList,
];

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
  objectType: string,
  enums: Record<string, IntrospectionEnumType>,
  createFields: NormalizedObjectField[],
  objectInterface?: IntrospectionObjectType,
): NormalizedObjectField[] => {
  if (!objectInterface) {
    return [];
  }

  // Skylark's Object Type Get methods don't mark which fields are required
  // Instead of using the Create method's fields (some fields are not included),
  // we mark which fields are required instead here (these are calculated from the Create method)
  const objectFields = parseObjectInputFields(
    objectType,
    objectInterface.fields.filter((field) => field.type.kind !== "OBJECT"),
    enums,
  ).map(({ name, isRequired, type, originalType, ...field }) => {
    const createField = createFields.find(
      (createField) => createField.name === name,
    );

    return {
      ...field,
      name,
      type: createField?.type || type,
      originalType: createField?.originalType || originalType,
      isRequired: createField?.isRequired || isRequired,
    };
  });

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
  objectType: string,
  objectInterface?: IntrospectionObjectType,
): {
  objectType: SkylarkObjectType;
  relationshipNames: string[];
} | null => {
  if (!objectInterface) {
    return null;
  }

  const listingType = `${objectType}Listing`;
  const relationshipListingType = `${objectType}RelationshipListing`;

  const relationships = objectInterface.fields
    .filter(
      ({ type }) =>
        ((type as IntrospectionObjectType).name === listingType ||
          (type as IntrospectionObjectType).name === relationshipListingType) &&
        type.kind === "OBJECT",
    )
    .map((field) => {
      const typeName = (field.type as IntrospectionObjectType | undefined)
        ?.name;
      const objectType = typeName
        ? getObjectTypeFromListingTypeName(typeName)
        : "";
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
): SkylarkObjectMetaRelationship[] => {
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
  objectType: string,
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

  const inputs = inputFields
    ? parseObjectInputFields(objectType, inputFields, enums)
    : [];
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

const getBuiltInObjectTypeRelationships = (
  schema: IntrospectionSchema,
  relationships: SkylarkObjectMetaRelationship[],
  getObjectInterface?: IntrospectionObjectType,
  ignoreRelationships?: boolean,
): SkylarkObjectMeta["builtinObjectRelationships"] => {
  if (ignoreRelationships) {
    return;
  }

  const imageRelationships = objectRelationshipFieldsFromGraphQLType(
    BuiltInSkylarkObjectType.SkylarkImage,
    getObjectInterface,
  );
  const imageOperations = imageRelationships
    ? getObjectOperations(imageRelationships.objectType, schema, true)
    : null;

  const hasAssets = relationships.some(
    ({ objectType }) => objectType === BuiltInSkylarkObjectType.SkylarkAsset,
  );
  const hasLiveAssets = relationships.some(
    ({ objectType }) =>
      objectType === BuiltInSkylarkObjectType.SkylarkLiveAsset,
  );

  return {
    images:
      imageRelationships && imageOperations
        ? {
            objectMeta: imageOperations,
            relationshipNames: imageRelationships.relationshipNames,
          }
        : null,
    hasAssets,
    hasLiveAssets,
  };
};

const getSetObjectTypesFromIntrospection = (
  schema: IntrospectionQuery["__schema"],
) =>
  (
    schema.types.find(
      (type) => type.kind === "INTERFACE" && type.name === "Set",
    ) as IntrospectionInterfaceType | undefined
  )?.possibleTypes.map(({ name }) => name) || [];

export const getObjectOperations = (
  objectType: SkylarkObjectType,
  schema: IntrospectionQuery["__schema"],
  ignoreRelationships?: boolean,
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
    (!listQuery && !objectsWithoutListQuery.includes(objectType)) ||
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

  const hasContentOf = objectHasRelationshipFromInterface(
    SkylarkSystemField.ContentOf,
    getObjectInterface,
  );

  // Parse the relationships out of the create mutation as it has a relationships parameter
  const { relationships, ...createMeta } = getMutationInfo(
    objectType,
    schema.types,
    enums,
    createInputObjectInterface,
  );

  const hasRelationships = relationships.length > 0;

  const builtinObjectRelationships = getBuiltInObjectTypeRelationships(
    schema,
    relationships,
    getObjectInterface,
    ignoreRelationships,
  );

  const updateMeta = getMutationInfo(
    objectType,
    schema.types,
    enums,
    updateInputObjectInterface,
  );

  const operations: SkylarkObjectOperations = {
    get: {
      type: "Query",
      name: getQuery.name,
    },
    list: listQuery
      ? {
          type: "Query",
          name: listQuery.name,
        }
      : null,
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

  const setTypes = getSetObjectTypesFromIntrospection(schema);
  const isSet = setTypes.includes(objectType);

  const objectFields = getObjectFields(
    objectType,
    enums,
    createMeta.inputs,
    getObjectInterface,
  );
  const fieldConfig = getGlobalAndTranslatableFields(
    schema.types,
    objectType,
    objectFields,
  );

  const objectMeta: SkylarkObjectMeta = {
    name: objectType,
    fields: objectFields,
    fieldConfig,
    builtinObjectRelationships,
    operations,
    availability,
    relationships,
    hasRelationships,
    hasContent,
    hasContentOf,
    hasAvailability,
    isTranslatable: !isAvailabilityOrAudienceSegment(objectType),
    isImage: objectType === BuiltInSkylarkObjectType.SkylarkImage,
    isSet,
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

export const sortFieldsByConfigPosition = (
  fieldA: string,
  fieldB: string,
  objectFieldConfig?: ParsedSkylarkObjectConfig["fieldConfig"],
) => {
  const aFieldConfig = objectFieldConfig?.find(({ name }) => fieldA === name);
  const bFieldConfig = objectFieldConfig?.find(({ name }) => fieldB === name);
  const aPosition =
    aFieldConfig?.position !== undefined ? aFieldConfig.position : 999;
  const bPosition =
    bFieldConfig?.position !== undefined ? bFieldConfig.position : 999;
  return aPosition - bPosition;
};

export const splitMetadataIntoSystemTranslatableGlobal = (
  allMetadataFields: string[],
  inputFields: NormalizedObjectField[],
  fieldConfig: SkylarkObjectMeta["fieldConfig"],
  objectFieldConfig: ParsedSkylarkObjectConfig["fieldConfig"],
  options?: {
    objectTypes: string[];
    hiddenFields: string[];
    uiHiddenFields: string[];
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
    ? [
        ...options.hiddenFields,
        ...options.uiHiddenFields,
        ...defaultFieldsToHide,
      ]
    : defaultFieldsToHide;

  const metadataArrWithHiddenFieldsRemoved = metadataArr.filter(
    ({ field }) => !fieldsToHide.includes(field.toLowerCase()),
  );

  const systemMetadataFields = metadataArrWithHiddenFieldsRemoved
    .filter(({ field }) => SYSTEM_FIELDS.includes(field))
    .sort(
      ({ field: a }, { field: b }) =>
        SYSTEM_FIELDS.indexOf(a) - SYSTEM_FIELDS.indexOf(b),
    );

  const otherFields = metadataArrWithHiddenFieldsRemoved.filter(
    ({ field }) => !SYSTEM_FIELDS.includes(field),
  );

  const globalMetadataFields = otherFields
    .filter(({ field }) => fieldConfig.global.includes(field))
    .sort((a, b) =>
      sortFieldsByConfigPosition(a.field, b.field, objectFieldConfig),
    );
  const translatableMetadataFields = otherFields
    .filter(({ field }) => fieldConfig.translatable.includes(field))
    .sort((a, b) =>
      sortFieldsByConfigPosition(a.field, b.field, objectFieldConfig),
    );

  return {
    systemMetadataFields,
    globalMetadataFields,
    translatableMetadataFields,
  };
};

export const createDefaultSkylarkObject = (
  args: {
    uid: SkylarkObject["uid"];
    objectType: SkylarkObject["objectType"];
  } & Omit<Partial<SkylarkObject>, "display"> & {
      display?: Partial<SkylarkObject["display"]>;
    },
) => {
  const skylarkObject: SkylarkObject = {
    language: "",
    externalId: null,
    availabilityStatus: null,
    availableLanguages: [],
    contextualFields: null,
    type: null,
    created: undefined,
    modified: undefined,
    published: undefined,
    hasDynamicContent: false,
    ...args,
    display: {
      colour: undefined,
      name: args.uid,
      objectType: args.objectType,
      ...args.display,
    },
    uid: args.uid,
    objectType: args.objectType,
  } as Omit<SkylarkObject, "contextualFields"> & {
    contextualFields: null;
  };

  return skylarkObject;
};

const parseDimensionBreakdownFromField = (
  metadata: ParsedSkylarkObjectMetadata,
): Record<string, string[]> | null => {
  try {
    if (
      !metadata ||
      !metadata?.[SkylarkAvailabilityField.DimensionBreakdown] ||
      typeof metadata?.[SkylarkAvailabilityField.DimensionBreakdown] !==
        "string"
    ) {
      return null;
    }

    return JSON.parse(metadata[SkylarkAvailabilityField.DimensionBreakdown]);
  } catch {
    return null;
  }
};

const parseDimensionBreakdownFromDimensions = (
  availability: ParsedSkylarkObjectAvailability,
): Record<string, string[]> | null => {
  return (
    availability?.dimensions?.reduce(
      (acc, dimension) => ({
        ...acc,
        [dimension.slug || ""]: dimension.values
          .map((value) => value.slug)
          .filter((value) => !!value),
      }),
      {},
    ) || null
  );
};

const parseDimensionBreakdown = ({
  metadata,
  availability,
}: ParsedSkylarkObject) =>
  parseDimensionBreakdownFromField(metadata) ||
  parseDimensionBreakdownFromDimensions(availability);

export const convertParsedObjectToIdentifier = (
  parsedObject: ParsedSkylarkObject,
  fallbackConfig?: Record<string, ParsedSkylarkObjectConfig>,
  opts?: { additionalFields?: boolean | string[] },
): SkylarkObject => {
  const { uid, objectType, metadata, meta } = parsedObject;

  const availabilityStatus =
    parsedObject.meta.availabilityStatus ||
    (parsedObject.availability && parsedObject.availability.status) ||
    null;

  const object: SkylarkObject = {
    uid,
    externalId: metadata.external_id,
    type: metadata?.type || null,
    objectType,
    language: meta.language,
    availableLanguages: meta.availableLanguages,
    availabilityStatus: isAudienceSegment(objectType)
      ? null
      : availabilityStatus,
    display: {
      name: getObjectDisplayName(parsedObject, fallbackConfig),
      objectType: getObjectTypeDisplayNameFromParsedObject(
        parsedObject,
        fallbackConfig,
      ),
      colour:
        parsedObject.config?.colour || fallbackConfig?.[objectType]?.colour,
    },
    contextualFields: null,
    created: meta.created,
    modified: meta.modified,
    published: meta.published,
    hasDynamicContent: meta.hasDynamicContent,
  };

  if (opts) {
    if (opts.additionalFields && Array.isArray(opts.additionalFields)) {
      object.additionalFields = opts.additionalFields.reduce(
        (prev, field) => ({ ...prev, [field]: metadata?.[field] }),
        {},
      );
    } else if (opts.additionalFields === true) {
      object.additionalFields = metadata;
    }
  }

  if (object.objectType === BuiltInSkylarkObjectType.Availability) {
    const availabilityObject: SkylarkObject<BuiltInSkylarkObjectType.Availability> =
      {
        ...object,
        objectType: BuiltInSkylarkObjectType.Availability,
        contextualFields: {
          start: metadata?.start === "string" ? metadata.start : "",
          end: metadata?.end === "string" ? metadata.end : "",
          dimensions: parseDimensionBreakdown(parsedObject),
        },
      };

    return availabilityObject;
  }

  if (isAudienceSegment(object.objectType)) {
    const availabilityObject: SkylarkObject<BuiltInSkylarkObjectType.AudienceSegment> =
      {
        ...object,
        objectType: BuiltInSkylarkObjectType.AudienceSegment,
        contextualFields: {
          dimensions: parseDimensionBreakdown(parsedObject),
        },
      };

    return availabilityObject;
  }

  if (object.objectType === BuiltInSkylarkObjectType.SkylarkImage) {
    const imageObject: SkylarkObject<BuiltInSkylarkObjectType.SkylarkImage> = {
      ...object,
      objectType: BuiltInSkylarkObjectType.SkylarkImage,
      contextualFields: {
        url: typeof metadata?.url === "string" ? metadata.url : null,
        external_url:
          typeof metadata?.external_url === "string"
            ? metadata.external_url
            : null,
      },
    };

    return imageObject;
  }

  if (
    objectType === BuiltInSkylarkObjectType.SkylarkAsset ||
    objectType === BuiltInSkylarkObjectType.SkylarkLiveAsset
  ) {
    const assetObject: SkylarkObject<
      | BuiltInSkylarkObjectType.SkylarkAsset
      | BuiltInSkylarkObjectType.SkylarkLiveAsset
    > = {
      ...object,
      objectType:
        objectType === BuiltInSkylarkObjectType.SkylarkAsset
          ? BuiltInSkylarkObjectType.SkylarkAsset
          : BuiltInSkylarkObjectType.SkylarkLiveAsset,
      contextualFields: {
        ...metadata,
        playbackPolicy: getPlaybackPolicyFromMetadata(metadata),
      },
    };

    return assetObject;
  }

  return object;
};
