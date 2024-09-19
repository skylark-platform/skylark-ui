import { useMutation, useQueryClient } from "@tanstack/react-query";
import gql from "graphql-tag";
import { EnumType, VariableType } from "json-to-graphql-query";
import { FormState } from "react-hook-form";

import {
  ContentModelEditorForm,
  ContentModelEditorFormObjectTypeField,
} from "src/components/contentModel/editor/sections/common.component";
import { QueryKeys } from "src/enums/graphql";
import { createSchemaVersionRequest } from "src/hooks/schema/create/useCreateSchemaVersion";
import { GQLScalars } from "src/interfaces/graphql/introspection";
import {
  GQLSkylarkErrorResponse,
  NormalizedObjectField,
  NormalizedObjectFieldType,
  ParsedSkylarkObjectConfig,
  SkylarkObjectFieldType,
  SkylarkGraphQLObjectConfig,
  SkylarkSystemField,
  SkylarkGraphQLObjectConfigFieldConfig,
} from "src/interfaces/skylark";
import { SchemaVersion } from "src/interfaces/skylark/environment";
import { skylarkRequest } from "src/lib/graphql/skylark/client";
import { wrappedJsonMutation } from "src/lib/graphql/skylark/dynamicQueries";
import { UPDATE_OBJECT_TYPE_CONFIG } from "src/lib/graphql/skylark/mutations";

interface MutationArgs {
  schemaVersion: SchemaVersion;
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

const parseFieldConfigurationField = (
  field: ContentModelEditorFormObjectTypeField,
): EditFieldConfigurationField | null => {
  console.log({ field });
  if (field.isNew && field.isDeleted) {
    return null;
  }

  const type = convertFieldType(field.type);

  const common: Omit<EditFieldConfigurationField, "operation"> = {
    name: field.name,
    is_translatable: Boolean(field.isTranslatable),
    required: Boolean(field.isRequired),
    type: new EnumType(type),
  };

  if (type === "ENUM") {
    common["enum_name"] = field.originalType;
  }

  if (field.isNew) {
    return {
      ...common,
      operation: new EnumType("CREATE"),
    };
  }

  if (field.isDeleted) {
    return {
      ...common,
      operation: new EnumType("DELETE"),
    };
  }

  return null;
};
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
const buildEditFieldsConfigurationMutation = (
  objectType: string,
  fields: ContentModelEditorFormObjectTypeField[],
) => {
  if (fields.length === 0) {
    return null;
  }

  return {
    key: `${objectType}_setObjectTypeConfiguration`,
    mutation: {
      __aliasFor: "setObjectTypeConfiguration",
      __args: {
        object_type: new EnumType(objectType),
        object_type_config: {
          field_config: fields.map(
            (
              field,
              i,
            ): Omit<SkylarkGraphQLObjectConfigFieldConfig, "ui_field_type"> & {
              ui_field_type: EnumType | null;
            } => ({
              name: field.name,
              ui_field_type: field.config?.fieldType
                ? new EnumType(field.config.fieldType)
                : null,
              ui_position: i + 1,
            }),
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
  modifiedFormFields: MutationArgs["modifiedFormFields"],
) => {
  const modifiedObjectTypes =
    modifiedFormFields.objectTypes &&
    Object.entries(modifiedFormFields.objectTypes).filter(([name]) =>
      Boolean(modifiedFormFields.objectTypes?.[name]),
    );

  console.log({ modifiedObjectTypes });

  if (!modifiedObjectTypes) {
    return null;
  }

  const gqlOperations = modifiedObjectTypes.reduce(
    (prevMutations, [objectType, x]) => {
      const mutations = prevMutations;

      const formValue = formValues.objectTypes[objectType];
      console.log({ formValue, x });

      const fieldConfiguration = buildEditFieldsConfigurationMutation(
        objectType,
        formValue.fields,
      );

      if (fieldConfiguration) {
        mutations[fieldConfiguration.key] = fieldConfiguration.mutation;
      }

      // const relationshipConfiguration =
      //   buildEditRelationshipsConfigurationMutation;

      return mutations;
    },
    {} as Record<string, object>,
  );

  const mutation = {
    mutation: {
      __name: `UPDATE_OBJECT_TYPES_FIELD_CONFIG`,
      ...gqlOperations,
    },
  };

  const graphQLQuery = wrappedJsonMutation(mutation);

  console.log("BuildSchemaMutation", {
    formValues,
    modifiedFormFields,
    modifiedObjectTypes,
    mutation,
    graphQLQuery,
  });

  return gql(graphQLQuery);
};

export const useUpdateObjectTypesFieldConfig = ({
  onSuccess,
  onError,
}: {
  onSuccess: () => void;
  onError: (e: GQLSkylarkErrorResponse) => void;
}) => {
  const queryClient = useQueryClient();

  const { mutate, isPending } = useMutation({
    mutationFn: async ({
      schemaVersion,
      formValues,
      modifiedFormFields,
    }: MutationArgs) => {
      const versionToUpdate: SchemaVersion = schemaVersion;

      const mutation = buildSchemaMutation(formValues, modifiedFormFields);

      if (!mutation) {
        return;
      }

      const response = await skylarkRequest<object[]>("mutation", mutation);

      return { ...response, schemaVersion: versionToUpdate };
    },
    onSuccess: async () => {
      await queryClient.refetchQueries({
        queryKey: [QueryKeys.ObjectTypesConfig],
        exact: false,
        type: "active",
      });

      onSuccess();
    },
    onError,
  });

  return {
    updateObjectTypesFieldConfig: mutate,
    isUpdatingObjectTypesFieldConfig: isPending,
  };
};
