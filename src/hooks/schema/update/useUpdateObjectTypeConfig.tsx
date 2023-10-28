import { useMutation, useQueryClient } from "@tanstack/react-query";
import { EnumType } from "json-to-graphql-query";

import { QueryKeys } from "src/enums/graphql";
import {
  GQLSkylarkErrorResponse,
  ParsedSkylarkObjectConfig,
  SkylarkGraphQLObjectConfig,
} from "src/interfaces/skylark";
import { skylarkRequest } from "src/lib/graphql/skylark/client";
import { UPDATE_OBJECT_TYPE_CONFIG } from "src/lib/graphql/skylark/mutations";

interface MutationArgs {
  objectType: string;
  objectTypeConfig: ParsedSkylarkObjectConfig;
}

export const useUpdateObjectTypeConfig = ({
  onSuccess,
  onError,
}: {
  onSuccess: () => void;
  onError: (e: GQLSkylarkErrorResponse) => void;
}) => {
  const queryClient = useQueryClient();

  const { mutate, isLoading } = useMutation({
    mutationFn: ({
      objectType,
      objectTypeConfig: parsedObjectTypeConfig,
    }: MutationArgs) => {
      const objectTypeConfig: SkylarkGraphQLObjectConfig = {
        display_name: parsedObjectTypeConfig.objectTypeDisplayName || null,
        primary_field: parsedObjectTypeConfig.primaryField || null,
        colour: parsedObjectTypeConfig.colour || null,
        field_config:
          parsedObjectTypeConfig.fieldConfig?.map(
            ({ name, fieldType, position }) => ({
              name,
              ui_field_type: fieldType,
              ui_position: position,
            }),
          ) || [],
      };

      return skylarkRequest<{
        setObjectTypeConfiguration: SkylarkGraphQLObjectConfig;
      }>("mutation", UPDATE_OBJECT_TYPE_CONFIG, {
        objectType,
        objectTypeConfig,
      });
    },
    onSuccess: async () => {
      await queryClient.refetchQueries({
        queryKey: [QueryKeys.ObjectTypesConfig],
      });

      onSuccess();
    },
    onError,
  });

  return {
    updateObjectTypeConfig: mutate,
    isUpdatingObjectTypeConfig: isLoading,
  };
};
