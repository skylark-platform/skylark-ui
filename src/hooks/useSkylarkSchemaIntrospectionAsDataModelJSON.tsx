/**
 * Still need to:
 * - Add relationship default sort fields
 * - Handle multiple relationships to the same object
 */
import {
  NormalizedObjectField,
  ParsedSkylarkObjectConfig,
  ParsedSkylarkObjectTypeRelationshipConfigurations,
  SkylarkObjectMeta,
  SkylarkObjectType,
} from "src/interfaces/skylark";
import { formatUriAsCustomerIdentifer, hasProperty } from "src/lib/utils";

import { useSkylarkCreds } from "./localStorage/useCreds";
import { useAllObjectTypesRelationshipConfiguration } from "./useObjectTypeRelationshipConfiguration";
import {
  ObjectTypeWithConfig,
  useAllObjectsMeta,
  useSkylarkObjectTypesWithConfig,
} from "./useSkylarkObjectTypes";

type Relationship = {
  type: SkylarkObjectType;
  reverse_relationship_name: string;
  config: {
    default_sort_field: string;
  };
};

type DataModelFieldType =
  | "string"
  | "integer"
  | "float"
  | "boolean"
  | "enum"
  | "datetime"
  | "date"
  | "email"
  | "ip_address"
  | "json"
  | "phone"
  | "time"
  | "timestamp"
  | "url";

type ObjectTypeConfig = {
  display_name: string;
  primary_field: string | null;
  colour: string | null;
  field_config: {
    name: string;
    type: DataModelFieldType;
    ui_position: number;
    ui_field_type?: string;
  }[];
};

interface SystemObjectType {
  config: ObjectTypeConfig;
  relationships: Record<string, Relationship>;
}

interface CustomObjectType extends SystemObjectType {
  global_fields: Record<string, DataModelFieldType>;
  language_fields: Record<string, DataModelFieldType>;
}

interface DataModel {
  info: {
    name: string;
  };
  enums: Record<string, string[]>;
  system_types: Record<string, SystemObjectType>;
  types: Record<string, CustomObjectType>;
}

const camelToSnakeCase = (str: string) => {
  const snakeCase = str.replace(
    /[A-Z]/g,
    (letter: string) => `_${letter.toLowerCase()}`,
  );
  return snakeCase.startsWith("_") ? snakeCase.substring(1) : snakeCase;
};

/**
 * Convert the original GraphQL field into what the data model service expects
 * Should reverse this list
 * type_mapping = {
    'string': GraphQLString,
    'integer': GraphQLInt,
    'float': GraphQLFloat,
    'boolean': GraphQLBoolean,
    'enum': GraphQLString,
    'datetime': GraphQLScalarType('AWSDateTime'),
    'date': GraphQLScalarType('AWSDate'),
    'email': GraphQLScalarType('AWSEmail'),
    'ip_address': GraphQLScalarType('AWSIPAddress'),
    'json': GraphQLScalarType('AWSJSON'),
    'phone': GraphQLScalarType('AWSPhone'),
    'time': GraphQLScalarType('AWSTime'),
    'timestamp': GraphQLScalarType('AWSTimestamp'),
    'url': GraphQLScalarType('AWSURL'),
}
 */
const convertFieldTypeToDataModelFieldType = (
  field: NormalizedObjectField,
): DataModelFieldType => {
  switch (field.originalType) {
    case "String":
      return "string";
    case "Int":
      return "integer";
    case "Float":
      return "float";
    case "Boolean":
      return "boolean";
    case "AWSDateTime":
      return "datetime";
    case "AWSDate":
      return "date";
    case "AWSEmail":
      return "email";
    case "AWSIPAddress":
      return "ip_address";
    case "AWSJSON":
      return "json";
    case "AWSPhone":
      return "phone";
    case "AWSTime":
      return "time";
    case "AWSTimestamp":
      return "timestamp";
    case "AWSURL":
      return "url";
    default:
      return "string";
  }
};

const unparseObjectConfig = (
  objectMeta: SkylarkObjectMeta,
  parsedConfig?: ParsedSkylarkObjectConfig,
): ObjectTypeConfig => {
  // TODO improve defaults depending on Object type?
  // e.g. for SystemObjects, if they have internal_title, make the primary field internal_title

  const field_config: ObjectTypeConfig["field_config"] =
    parsedConfig?.fieldConfig?.map(({ position, fieldType, name }) => {
      const field = objectMeta.fields.find((field) => field.name === name);

      const obj: ObjectTypeConfig["field_config"][0] = {
        name,
        ui_position: position,
        type: field ? convertFieldTypeToDataModelFieldType(field) : "string",
      };

      if (fieldType) {
        obj.ui_field_type = fieldType;
      }

      return obj;
    }) || [];

  return {
    display_name: parsedConfig?.objectTypeDisplayName || objectMeta.name,
    primary_field: parsedConfig?.primaryField || null,
    colour: parsedConfig?.colour || null,
    field_config,
  };
};

const getRelationshipsConfigDefaultSortField = (
  relationshipObjectMeta?: SkylarkObjectMeta,
) => {
  if (!relationshipObjectMeta) {
    return "";
  }

  // Fields we've used as sort fields previously, ordered by their preference to be used as a sort field
  const orderedKnownSortFields = [
    "episode_number",
    "season_number",
    "movie_number",
    "title_sort",
    "name_sort",
    "position",
    "value",
    "file_name",
    "internal_title",
  ];

  const defaultSortFields = relationshipObjectMeta.fieldConfig.global
    .filter((field) => orderedKnownSortFields.includes(field))
    .sort(
      (a, b) =>
        orderedKnownSortFields.indexOf(a) - orderedKnownSortFields.indexOf(b),
    );

  return defaultSortFields?.[0] || "";
};

const unparseRelationships = (
  objectMeta: SkylarkObjectMeta,
  allObjectMeta: SkylarkObjectMeta[],
  objectTypeRelationshipConfig?: ParsedSkylarkObjectTypeRelationshipConfigurations,
): SystemObjectType["relationships"] => {
  const relationships = objectMeta.relationships.reduce(
    (prev, relationship): SystemObjectType["relationships"] => {
      const reverseObject = allObjectMeta.find(
        ({ name }) => name === relationship.objectType,
      );
      const reverseObjectRelationship = reverseObject?.relationships.find(
        ({ objectType }) => objectType === objectMeta.name,
      );

      const config =
        objectTypeRelationshipConfig?.[relationship.relationshipName] || null;

      return {
        ...prev,
        [relationship.relationshipName]: {
          type: relationship.objectType,
          reverse_relationship_name:
            reverseObjectRelationship?.relationshipName || "",
          config: {
            default_sort_field:
              config?.defaultSortField ||
              getRelationshipsConfigDefaultSortField(reverseObject),
          },
        },
      };
    },
    {} as SystemObjectType["relationships"],
  );

  return relationships;
};

const unparseGlobalAndLanguageFields = (
  objectMeta: SkylarkObjectMeta,
): {
  global_fields: Record<string, string>;
  language_fields: Record<string, string>;
} => {
  const fields = objectMeta.operations.create.inputs.reduce(
    (prev, field) => {
      const isGlobalField = objectMeta.fieldConfig.global.includes(field.name);
      const isLanguageField = objectMeta.fieldConfig.translatable.includes(
        field.name,
      );

      let fieldType: string = convertFieldTypeToDataModelFieldType(field);
      if (field.enumValues) {
        // Enum is a special case where we don't return the DataModelFieldType
        fieldType = `Enum__${field.originalType}`;
      }
      if (field.isRequired) {
        fieldType = `${fieldType}!`;
      }

      if (isGlobalField) {
        return {
          ...prev,
          global_fields: {
            ...prev.global_fields,
            [field.name]: fieldType,
          },
        };
      }

      if (isLanguageField) {
        return {
          ...prev,
          language_fields: {
            ...prev.language_fields,
            [field.name]: fieldType,
          },
        };
      }

      return prev;
    },
    { global_fields: {}, language_fields: {} } as {
      global_fields: Record<string, string>;
      language_fields: Record<string, string>;
    },
  );

  return fields;
};

const getEnumsForCustomObjects = (
  allObjectMeta: SkylarkObjectMeta[],
): DataModel["enums"] => {
  const enumInputFields = allObjectMeta.reduce((prev, objectMeta) => {
    if (objectMeta.isBuiltIn) {
      return prev;
    }

    const enumInputs = objectMeta.operations.create.inputs.filter(
      (field) => !!field.enumValues,
    );

    return [...prev, ...enumInputs];
  }, [] as NormalizedObjectField[]);

  const dataModelEnums = enumInputFields.reduce(
    (prev, field) => {
      return {
        ...prev,
        [camelToSnakeCase(field.originalType)]: field.enumValues || [],
      };
    },
    {} as DataModel["enums"],
  );

  return dataModelEnums;
};

const parseDataModel = (
  allObjectMeta: SkylarkObjectMeta[],
  objectTypesWithConfig: ObjectTypeWithConfig[],
  accountUri?: string,
  relationshipConfiguration?: Record<
    string,
    ParsedSkylarkObjectTypeRelationshipConfigurations
  >,
) => {
  const { systemTypes, customTypes } = allObjectMeta.reduce(
    (
      prev,
      objectMeta,
    ): {
      systemTypes: DataModel["system_types"];
      customTypes: DataModel["types"];
    } => {
      const objectTypeWithParsedConfig = objectTypesWithConfig.find(
        ({ objectType }) => objectType === objectMeta.name,
      );
      const parsedConfig = objectTypeWithParsedConfig?.config;

      const objectTypeRelationshipConfig =
        (relationshipConfiguration &&
          hasProperty(relationshipConfiguration, objectMeta.name) &&
          relationshipConfiguration[objectMeta.name]) ||
        undefined;

      if (objectMeta.isBuiltIn) {
        return {
          ...prev,
          systemTypes: {
            ...prev.systemTypes,
            [objectMeta.name]: {
              config: unparseObjectConfig(objectMeta, parsedConfig),
              relationships: unparseRelationships(
                objectMeta,
                allObjectMeta,
                objectTypeRelationshipConfig,
              ),
            },
          },
        };
      }

      const { language_fields, global_fields } =
        unparseGlobalAndLanguageFields(objectMeta);

      return {
        ...prev,
        customTypes: {
          ...prev.customTypes,
          [objectMeta.name]: {
            config: unparseObjectConfig(objectMeta, parsedConfig),
            global_fields,
            language_fields,
            relationships: unparseRelationships(
              objectMeta,
              allObjectMeta,
              objectTypeRelationshipConfig,
            ),
          },
        },
      };
    },
    {
      systemTypes: {},
      customTypes: {},
    },
  );

  const name = (
    (accountUri &&
      formatUriAsCustomerIdentifer(accountUri).replaceAll(" ", "-")) ||
    accountUri ||
    ""
  ).toLowerCase();

  const enums = getEnumsForCustomObjects(allObjectMeta);

  const parsedDataModel: DataModel = {
    info: {
      name,
    },
    enums,
    system_types: systemTypes,
    types: customTypes,
  };

  return parsedDataModel;
};

export const useGenerateDataModelFromSkylarkSchema = () => {
  const [creds] = useSkylarkCreds();

  const { objects: allObjectMeta } = useAllObjectsMeta(false);
  const { objectTypesWithConfig } = useSkylarkObjectTypesWithConfig(); // TODO don't just get searchable
  const {
    allObjectTypesRelationshipConfig,
    isLoading: isLoadingRelationshipConfig,
  } = useAllObjectTypesRelationshipConfiguration();

  const parsedDataModel =
    allObjectMeta && objectTypesWithConfig && !isLoadingRelationshipConfig
      ? parseDataModel(
          allObjectMeta,
          objectTypesWithConfig,
          creds?.uri,
          allObjectTypesRelationshipConfig,
        )
      : undefined;

  return { dataModel: parsedDataModel };
};
