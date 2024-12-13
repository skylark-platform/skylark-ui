import { useMutation, useQueryClient } from "@tanstack/react-query";
import { snakeCase } from "change-case";
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
  NormalizedObjectFieldType,
  SkylarkObjectFieldType,
} from "src/interfaces/skylark";
import { SchemaVersion } from "src/interfaces/skylark/environment";
import { skylarkRequest } from "src/lib/graphql/skylark/client";
import { wrappedJsonMutation } from "src/lib/graphql/skylark/dynamicQueries";

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

interface EditRelationshipConfigurationRelationship {
  operation: EnumType;
  from_class: EnumType;
  to_class: EnumType;
  relationship_name: string;
  reverse_relationship_name: string;
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
  if ((field.isNew && field.isDeleted) || field.type === "relationship") {
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
const parseRelationshipConfigurationRelationship = (
  objectType: string,
  field: ContentModelEditorFormObjectTypeField,
) => {
  if ((field.isNew && field.isDeleted) || field.type !== "relationship") {
    return null;
  }

  const common: Omit<EditRelationshipConfigurationRelationship, "operation"> = {
    relationship_name: field.name,
    reverse_relationship_name: field.reverseRelationshipName as string,
    from_class: new EnumType(objectType),
    to_class: new EnumType(field.objectType),
  };

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
  fieldValues: ContentModelEditorForm["objectTypes"][0]["fields"],
) => {
  const relationships = fieldValues
    .map((value) =>
      parseRelationshipConfigurationRelationship(objectType, value),
    )
    .filter((rel): rel is EditRelationshipConfigurationRelationship =>
      Boolean(rel),
    );
  console.log("XXX", { relationships });
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
  const newObjectTypes = Object.entries(formValues.objectTypes)
    .filter(([_, values]) => values.isNew)
    .map(([objectType]) => objectType);

  const modifiedObjectTypes =
    modifiedFormFields.objectTypes &&
    Object.entries(modifiedFormFields.objectTypes).filter(
      ([name]) =>
        Boolean(modifiedFormFields.objectTypes?.[name].fields) &&
        !newObjectTypes.includes(name),
    );

  console.log({ modifiedObjectTypes, newObjectTypes });

  if (
    (!modifiedObjectTypes || modifiedObjectTypes.length === 0) &&
    (!newObjectTypes || newObjectTypes.length === 0)
  ) {
    return null;
  }

  const modifiedObjectTypesGqlOperations = modifiedObjectTypes?.reduce(
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

      const relationshipConfiguration =
        buildEditRelationshipsConfigurationMutation(
          objectType,
          formValue.fields,
        );

      if (relationshipConfiguration) {
        mutations[relationshipConfiguration.key] =
          relationshipConfiguration.mutation;
      }

      return mutations;
    },
    {} as Record<string, object>,
  );

  const newObjectTypesGqlOperations = newObjectTypes?.reduce(
    (prevMutations, objectType) => {
      const mutations = prevMutations;

      // const formValue = formValues.objectTypes[objectType];
      // console.log({ formValue });

      // const fieldConfiguration = buildEditFieldsConfigurationMutation(
      //   objectType,
      //   formValue.fields,
      // );

      // if (fieldConfiguration) {
      //   mutations[fieldConfiguration.key] = fieldConfiguration.mutation;
      // }

      // const relationshipConfiguration =
      //   buildEditRelationshipsConfigurationMutation(
      //     objectType,
      //     formValue.fields,
      //   );

      // if (relationshipConfiguration) {
      //   mutations[relationshipConfiguration.key] =
      //     relationshipConfiguration.mutation;
      // }

      const objectTypeAsSnakeCase = snakeCase(objectType);
      console.log({ objectType, objectTypeAsSnakeCase });

      mutations[`create_${objectType}`] = {
        __aliasFor: "createObjectType",
        __args: {
          version: new VariableType("version"),
          object_types: { name: objectTypeAsSnakeCase },
        },
        version: true,
      };

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
      ...(modifiedObjectTypesGqlOperations || {}),
      ...(newObjectTypesGqlOperations || {}),
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

      console.log({ modifiedFormFields });

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
