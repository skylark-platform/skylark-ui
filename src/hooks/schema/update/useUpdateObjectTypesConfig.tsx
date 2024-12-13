import { useMutation, useQueryClient } from "@tanstack/react-query";
import gql from "graphql-tag";
import { EnumType } from "json-to-graphql-query";
import { FormState } from "react-hook-form";

import {
  ContentModelEditorForm,
  ContentModelEditorFormObjectTypeField,
  ContentModelEditorFormObjectTypeUiConfig,
} from "src/components/contentModel/editor/sections/common.component";
import { QueryKeys } from "src/enums/graphql";
import {
  GQLSkylarkErrorResponse,
  NormalizedObjectFieldType,
  SkylarkObjectFieldType,
  SkylarkGraphQLObjectConfigFieldConfig,
} from "src/interfaces/skylark";
import { SchemaVersion } from "src/interfaces/skylark/environment";
import { skylarkRequest } from "src/lib/graphql/skylark/client";
import { wrappedJsonMutation } from "src/lib/graphql/skylark/dynamicQueries";

interface MutationArgs {
  formValues: ContentModelEditorForm;
  modifiedFormFields: FormState<ContentModelEditorForm>["dirtyFields"];
}

interface EditFieldConfigurationField {
  name: string;
  operation: EnumType;
  is_translatable: boolean;
  required: boolean;
  type: EnumType;
  enum_name?: string;
}

const convertFieldType = (
  type: NormalizedObjectFieldType,
): SkylarkObjectFieldType => {
  switch (type) {
    case "int":
      return "INTEGER";
    case "ipaddress":
      return "IP_ADDRESS";
    default:
      return type.toUpperCase() as SkylarkObjectFieldType;
  }
};

// const parseFieldConfigurationField = (
//   field: ContentModelEditorFormObjectTypeField,
// ): EditFieldConfigurationField | null => {
//   console.log({ field });
//   if (field.isNew && field.isDeleted) {
//     return null;
//   }

//   const type = convertFieldType(field.type);

//   const common: Omit<EditFieldConfigurationField, "operation"> = {
//     name: field.name,
//     is_translatable: Boolean(field.isTranslatable),
//     required: Boolean(field.isRequired),
//     type: new EnumType(type),
//   };

//   if (type === "ENUM") {
//     common["enum_name"] = field.originalType;
//   }

//   if (field.isNew) {
//     return {
//       ...common,
//       operation: new EnumType("CREATE"),
//     };
//   }

//   if (field.isDeleted) {
//     return {
//       ...common,
//       operation: new EnumType("DELETE"),
//     };
//   }

//   return null;
// };
// editFieldConfiguration(
//   fields: {name: "synopsis", operation: UPDATE, is_translatable: false, required: false, type: INTEGER}
//   object_class: LiveStream
// ) {
//   version
// }

// setObjectTypeConfiguration(
//   object_type: Episode
//   object_type_config: {display_name: "", field_config: {name: "test_field_no", ui_field_type: TEXTAREA, ui_position: 10}}
// ) {
//   display_name
//   primary_field
//   field_config {
//     name
//     ui_field_type
//     ui_position
//   }
// }
const buildEditObjectTypeConfigurationMutation = (
  objectType: string,
  fields: ContentModelEditorFormObjectTypeField[],
  uiConfig: ContentModelEditorFormObjectTypeUiConfig,
) => {
  if (fields.length === 0) {
    return null;
  }

  console.log({ objectType, fields, uiConfig });

  return {
    key: `${objectType}_setObjectTypeConfiguration`,
    mutation: {
      __aliasFor: "setObjectTypeConfiguration",
      __args: {
        object_type: new EnumType(objectType),
        object_type_config: {
          primary_field: uiConfig.primaryField || null,
          colour: uiConfig.colour || null,
          display_name: uiConfig.objectTypeDisplayName || objectType,
          field_config: fields.map(
            (
              field,
              i,
            ): Omit<SkylarkGraphQLObjectConfigFieldConfig, "ui_field_type"> & {
              ui_field_type: EnumType | null;
            } => {
              const fieldConfig = uiConfig.fieldConfigs?.[field.name];
              return {
                name: field.name,
                ui_field_type: fieldConfig?.fieldType
                  ? new EnumType(fieldConfig?.fieldType)
                  : null,
                ui_position:
                  // Either use fieldOrder position or a position greater than the array
                  // In reality the fieldOrder should contain all fields
                  uiConfig.fieldOrder.indexOf(field.name) + 1 ||
                  uiConfig.fieldOrder.length + i + 1,
              };
            },
          ),
        },
      },
      field_config: {
        name: true,
        ui_position: true,
        ui_field_type: true,
      },
    },
  };
};

/**
 * No clue what this was... ???
 * Only support:
 * - Add fields
 * - Remove fields
 * - Add relationships
 * - Remove relationships
 * - Add object types
 *    - Add fields
 *    - Add relationships
 */
const buildSchemaMutation = (
  formValues: ContentModelEditorForm,
  modifiedObjectTypes: string[],
) => {
  console.log({ modifiedObjectTypes });

  if (!modifiedObjectTypes || modifiedObjectTypes.length === 0) {
    return null;
  }

  const gqlOperations = modifiedObjectTypes.reduce(
    (prevMutations, objectType) => {
      const mutations = prevMutations;

      const formValue = formValues.objectTypes[objectType];

      const fieldConfiguration = buildEditObjectTypeConfigurationMutation(
        objectType,
        formValue.fields,
        formValue.uiConfig,
      );

      if (fieldConfiguration) {
        mutations[fieldConfiguration.key] = fieldConfiguration.mutation;
      }

      return mutations;
    },
    {} as Record<string, object>,
  );

  const mutation = {
    mutation: {
      __name: `UPDATE_OBJECT_TYPES_CONFIGURATION`,
      ...gqlOperations,
    },
  };

  const graphQLQuery = wrappedJsonMutation(mutation);

  return gql(graphQLQuery);
};

export const useUpdateObjectTypesConfiguration = ({
  onSuccess,
  onError,
}: {
  onSuccess: (modifiedObjectTypes: string[]) => void;
  onError: (e: GQLSkylarkErrorResponse) => void;
}) => {
  const queryClient = useQueryClient();

  const { mutate, isPending } = useMutation({
    mutationFn: async ({ formValues, modifiedFormFields }: MutationArgs) => {
      const modifiedObjectTypes =
        (
          modifiedFormFields.objectTypes &&
          Object.entries(modifiedFormFields.objectTypes)
            .filter(([name]) =>
              Boolean(modifiedFormFields.objectTypes?.[name].uiConfig),
            )
            .map(([ot]) => ot)
        )
          // Filter out any newly added object types as they're not in the schema yet so will fail
          ?.filter((objectType) => !formValues.objectTypes[objectType].isNew) ||
        [];

      console.log("here", { modifiedObjectTypes, modifiedFormFields });

      const mutation = buildSchemaMutation(formValues, modifiedObjectTypes);

      console.log("updateObjectTypesConfiguration", { mutation });

      if (modifiedObjectTypes.length === 0 || !mutation) {
        return null;
      }

      const response = await skylarkRequest<object[]>("mutation", mutation);

      return { ...response, modifiedObjectTypes };
    },
    onSuccess: async (data) => {
      await queryClient.refetchQueries({
        queryKey: [QueryKeys.ObjectTypesConfig],
        exact: false,
        type: "active",
      });

      onSuccess(data?.modifiedObjectTypes || []);
    },
    onError,
  });

  return {
    updateObjectTypesConfiguration: mutate,
    isUpdatingObjectTypesConfiguration: isPending,
  };
};
