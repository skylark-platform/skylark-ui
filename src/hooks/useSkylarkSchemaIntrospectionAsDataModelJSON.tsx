/**
 * Still need to:
 * - Add relationship default sort fields
 * - Handle multiple relationships to the same object
 * - Add support for Enums
 */
import {
  ParsedSkylarkObjectConfig,
  SkylarkObjectMeta,
  SkylarkObjectType,
} from "src/interfaces/skylark";
import { formatUriAsCustomerIdentifer } from "src/lib/utils";

import { useSkylarkCreds } from "./localStorage/useCreds";
import {
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

type ObjectTypeConfig = {
  display_name: string;
  primary_field: string | null;
  colour: string | null;
  field_config: {
    name: string;
    type: string;
    ui_position: number;
    ui_field_type?: string;
  }[];
};

interface SystemObjectType {
  config: ObjectTypeConfig;
  relationships: Record<string, Relationship>;
}

interface CustomObjectType extends SystemObjectType {
  global_fields: Record<string, string>;
  language_fields: Record<string, string>;
}

interface DataModel {
  info: {
    name: string;
  };
  enums: Record<string, string[]>;
  system_types: Record<string, SystemObjectType>;
  types: Record<string, CustomObjectType>;
}

const initialDataModel: DataModel = {
  info: {
    name: "",
  },
  enums: {},
  system_types: {},
  types: {},
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
        type: field?.originalType.toLowerCase() || "",
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

const unparseRelationships = (
  objectMeta: SkylarkObjectMeta,
  allObjectMeta: SkylarkObjectMeta[],
): SystemObjectType["relationships"] => {
  const relationships = objectMeta.relationships.reduce(
    (prev, relationship): SystemObjectType["relationships"] => {
      const reverseObject = allObjectMeta.find(
        ({ name }) => name === relationship.objectType,
      );
      const reverseObjectRelationship = reverseObject?.relationships.find(
        ({ objectType }) => objectType === objectMeta.name,
      );

      return {
        ...prev,
        [relationship.relationshipName]: {
          type: relationship.objectType,
          reverse_relationship_name:
            reverseObjectRelationship?.relationshipName || "",
          config: {
            default_sort_field: "", // TODO fetch sort fields and add
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
  console.log(objectMeta);

  const fields = objectMeta.operations.create.inputs.reduce(
    (prev, field) => {
      const isGlobalField = objectMeta.fieldConfig.global.includes(field.name);
      const isLanguageField = objectMeta.fieldConfig.translatable.includes(
        field.name,
      );

      let fieldType: string = field.originalType;
      if (field.enumValues) {
        fieldType = `Enum__${fieldType}`;
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

export const useGenerateDataModelFromSkylarkSchema = () => {
  const [creds] = useSkylarkCreds();

  const { objects: allObjectMeta } = useAllObjectsMeta(false);
  const { objectTypesWithConfig } = useSkylarkObjectTypesWithConfig(); // TODO don't just get searchable

  const parsedDataModel =
    allObjectMeta && objectTypesWithConfig
      ? allObjectMeta.reduce((prev, objectMeta): DataModel => {
          const isSystemObject = objectMeta.name
            .toUpperCase()
            .startsWith("SKYLARK");

          const objectTypeWithParsedConfig = objectTypesWithConfig.find(
            ({ objectType }) => objectType === objectMeta.name,
          );
          const parsedConfig = objectTypeWithParsedConfig?.config;

          if (isSystemObject) {
            return {
              ...prev,
              system_types: {
                ...prev.system_types,
                [objectMeta.name]: {
                  config: unparseObjectConfig(objectMeta, parsedConfig),
                  relationships: unparseRelationships(
                    objectMeta,
                    allObjectMeta,
                  ),
                },
              },
            };
          }

          const { language_fields, global_fields } =
            unparseGlobalAndLanguageFields(objectMeta);

          return {
            ...prev,
            types: {
              ...prev.types,
              [objectMeta.name]: {
                config: unparseObjectConfig(objectMeta, parsedConfig),
                relationships: unparseRelationships(objectMeta, allObjectMeta),
                language_fields,
                global_fields,
              },
            },
          };
        }, initialDataModel)
      : undefined;

  const name = (
    (creds?.uri &&
      formatUriAsCustomerIdentifer(creds.uri).replaceAll(" ", "-")) ||
    creds?.uri ||
    ""
  ).toLowerCase();

  const parsedDataModelWithName = parsedDataModel
    ? {
        ...parsedDataModel,
        info: {
          name,
        },
      }
    : undefined;

  console.log({ parsedDataModelWithName });

  return { dataModel: parsedDataModelWithName };
};
