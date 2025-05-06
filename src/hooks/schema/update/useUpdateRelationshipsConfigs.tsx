import { useMutation, useQueryClient } from "@tanstack/react-query";
import gql from "graphql-tag";
import { EnumType } from "json-to-graphql-query";
import { FormState } from "react-hook-form";

import { ContentModelEditorForm } from "src/components/contentModel/editor/sections/common.component";
import { QueryKeys } from "src/enums/graphql";
import {
  GQLObjectTypeRelationshipConfig,
  GQLSkylarkErrorResponse,
  ParsedSkylarkObjectConfig,
  ParsedSkylarkObjectTypeRelationshipConfigurations,
  SkylarkGraphQLObjectConfig,
} from "src/interfaces/skylark";
import { skylarkRequest } from "src/lib/graphql/skylark/client";
import { createUpdateRelationshipConfigMutation } from "src/lib/graphql/skylark/dynamicMutations/schema";
import { wrappedJsonMutation } from "src/lib/graphql/skylark/dynamicQueries";

interface MutationArgs extends ParsedSkylarkObjectConfig {
  formValues: ContentModelEditorForm;
  modifiedFormFields: FormState<ContentModelEditorForm>["dirtyFields"];
}

const createUpdateRelationshipsConfigsMutation = (
  formValues: ContentModelEditorForm,
  modifiedObjectTypes: {
    objectType: string;
    modifiedRelationshipConfigs: string[];
  }[],
) => {
  if (!modifiedObjectTypes || modifiedObjectTypes.length === 0) {
    return null;
  }

  const gqlOperationsArr = modifiedObjectTypes.flatMap(
    ({ objectType, modifiedRelationshipConfigs }) => {
      const formValue = formValues.objectTypes[objectType];

      const relationshipConfigMutations = Object.entries(
        formValue.relationshipConfigs,
      )
        .filter(([relationshipName]) =>
          modifiedRelationshipConfigs.includes(relationshipName),
        )
        .map(([relationshipName, relationshipConfig]) => {
          const gqlRelationshipConfig: GQLObjectTypeRelationshipConfig = {
            default_sort_field: relationshipConfig.defaultSortField || null,
            inherit_availability: relationshipConfig.inheritAvailability,
          };

          const operation = {
            __aliasFor: "setRelationshipConfiguration",
            __args: {
              object: new EnumType(objectType),
              relationship_name: relationshipName,
              relationship_config: gqlRelationshipConfig,
            },
            default_sort_field: true,
            inherit_availability: true,
          };

          return { key: `${objectType}_${relationshipName}`, operation };
        }, []);

      return relationshipConfigMutations;
    },
    [],
  );

  const gqlOperations = Object.fromEntries(
    gqlOperationsArr
      .sort((opA) => {
        // Need false ignore_availability to be first in operations otherwise we could enable the reverse of an already enabled ignore_availability
        return !opA.operation.__args.relationship_config.inherit_availability
          ? -1
          : 1;
      })
      .map(({ key, operation }) => [key, operation]),
  );

  const mutation = {
    mutation: {
      __name: `UPDATE_RELATIONSHIPS_CONFIGS`,
      ...gqlOperations,
    },
  };

  const graphQLQuery = wrappedJsonMutation(mutation);

  return gql(graphQLQuery);
};

export const useUpdateRelationshipsConfigs = ({
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
              Boolean(
                modifiedFormFields.objectTypes?.[name].relationshipConfigs,
              ),
            )
            .map(
              ([objectType, modifiedObjectType]): {
                objectType: string;
                modifiedRelationshipConfigs: string[];
              } => ({
                objectType,
                modifiedRelationshipConfigs:
                  modifiedObjectType?.relationshipConfigs
                    ? Object.keys(modifiedObjectType.relationshipConfigs)
                    : [],
              }),
            )
        )
          // Filter out any newly added object types as they're not in the schema yet so will fail
          ?.filter(
            ({ objectType }) => !formValues.objectTypes[objectType].isNew,
          ) || [];

      const mutation = createUpdateRelationshipsConfigsMutation(
        formValues,
        modifiedObjectTypes,
      );

      if (modifiedObjectTypes.length === 0 || !mutation) {
        return null;
      }

      const response = await skylarkRequest<object[]>("mutation", mutation);

      return {
        modifiedObjectTypes,
        ...response,
      };
    },
    onSuccess: async (data) => {
      await queryClient.refetchQueries({
        queryKey: [QueryKeys.ObjectTypeRelationshipConfig],
        exact: false,
        type: "active",
      });

      onSuccess(
        data?.modifiedObjectTypes.map(({ objectType }) => objectType) || [],
      );
    },
    onError,
  });

  return {
    updateRelationshipsConfigs: mutate,
    isUpdatingRelationshipsConfigs: isPending,
  };
};
