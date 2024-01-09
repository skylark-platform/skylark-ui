import { useMutation, useQueryClient } from "@tanstack/react-query";

import { QueryKeys } from "src/enums/graphql";
import {
  GQLSkylarkErrorResponse,
  ParsedSkylarkObjectConfig,
  SkylarkGraphQLObjectConfig,
  SkylarkSystemField,
} from "src/interfaces/skylark";
import { skylarkRequest } from "src/lib/graphql/skylark/client";
import { UPDATE_OBJECT_TYPE_CONFIG } from "src/lib/graphql/skylark/mutations";

interface MutationArgs extends ParsedSkylarkObjectConfig {
  objectType: string;
}

export const useUpdateObjectTypeConfig = ({
  onSuccess,
  onError,
}: {
  onSuccess: () => void;
  onError: (e: GQLSkylarkErrorResponse) => void;
}) => {
  const queryClient = useQueryClient();

  const { mutate, isPending } = useMutation({
    mutationFn: ({
      objectType,
      objectTypeDisplayName,
      primaryField,
      colour,
      fieldConfig,
    }: MutationArgs) => {
      const parsedFieldConfig =
        fieldConfig?.map(({ name, fieldType, position }) => ({
          name,
          ui_field_type: fieldType,
          ui_position: position,
        })) || [];

      return skylarkRequest<{
        setObjectTypeConfiguration: SkylarkGraphQLObjectConfig;
      }>("mutation", UPDATE_OBJECT_TYPE_CONFIG, {
        objectType,
        displayName: objectTypeDisplayName || null,
        primaryField: primaryField || SkylarkSystemField.UID,
        colour: colour || null,
        fieldConfig: parsedFieldConfig,
      });
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
    updateObjectTypeConfig: mutate,
    isUpdatingObjectTypeConfig: isPending,
  };
};
