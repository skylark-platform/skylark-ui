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
} from "src/interfaces/skylark";
import { SchemaVersion } from "src/interfaces/skylark/environment";
import { skylarkRequest } from "src/lib/graphql/skylark/client";
import { wrappedJsonMutation } from "src/lib/graphql/skylark/dynamicQueries";
import { UPDATE_OBJECT_TYPE_CONFIG } from "src/lib/graphql/skylark/mutations";

interface MutationArgs {
  createNewSchemaVersion: boolean;
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

const buildEditFieldsConfigurationMutation = (
  objectType: string,
  fieldValues: ContentModelEditorForm["objectTypes"][0]["fields"],
) => {
  const fields = fieldValues
    .map((value) => parseFieldConfigurationField(value))
    .filter((field): field is EditFieldConfigurationField => Boolean(field));
  console.log("XXX", { fields });
  if (fields.length === 0) {
    return null;
  }

  return {
    key: `${objectType}_editFieldConfiguration`,
    mutation: {
      __aliasFor: "editFieldConfiguration",
      __args: {
        version: new VariableType("version"),
        object_class: new EnumType(objectType),
        fields,
      },
      version: true,
    },
  };
};

// editRelationshipConfiguration(
//   relationships: {operation: CREATE, from_class: SkylarkImage, to_class: SkylarkImage, relationship_name: "", reverse_relationship_name: ""}
//   version: 10
// ) {
//   messages
//   version
// }
const buildEditRelationshipsConfigurationMutation = (
  objectType: string,
  relationshipValues: ContentModelEditorForm["objectTypes"][0]["relationships"],
) => {
  const relationships = relationshipValues;

  if (relationships.length === 0) {
    return null;
  }

  return {
    key: `${objectType}_editRelationshipConfiguration`,
    mutation: {
      __aliasFor: "editRelationshipConfiguration",
      __args: {
        version: new VariableType("version"),
        relationships,
      },
      version: true,
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
      __name: `UPDATE_SCHEMA`,
      __variables: {
        version: "Int!",
      },
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

export const useUpdateSchema = ({
  onSuccess,
  onError,
}: {
  onSuccess: (schemaVersion: SchemaVersion) => void;
  onError: (e: GQLSkylarkErrorResponse) => void;
}) => {
  const queryClient = useQueryClient();

  const { mutate, isPending } = useMutation({
    mutationFn: async ({
      createNewSchemaVersion,
      schemaVersion,
      formValues,
      modifiedFormFields,
    }: MutationArgs) => {
      let versionToUpdate: SchemaVersion = schemaVersion;

      const mutation = buildSchemaMutation(formValues, modifiedFormFields);

      if (!mutation) {
        return {
          schemaVersion: versionToUpdate,
        };
      }

      if (createNewSchemaVersion) {
        const newSchemaVersion = await createSchemaVersionRequest(
          schemaVersion.version,
        );
        versionToUpdate = newSchemaVersion;
      }

      const response = await skylarkRequest<object[]>("mutation", mutation, {
        version: versionToUpdate.version,
      });

      return { ...response, schemaVersion: versionToUpdate };
    },
    onSuccess: async ({ schemaVersion }) => {
      await queryClient.refetchQueries({
        queryKey: [QueryKeys.Schema],
        exact: false,
        type: "active",
      });

      onSuccess(schemaVersion);
    },
    onError,
  });

  return {
    updateSchema: mutate,
    isUpdatingSchema: isPending,
  };
};
