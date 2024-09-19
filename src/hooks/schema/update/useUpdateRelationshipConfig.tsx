import { useMutation, useQueryClient } from "@tanstack/react-query";

import { QueryKeys } from "src/enums/graphql";
import {
  GQLSkylarkErrorResponse,
  ParsedSkylarkObjectConfig,
  ParsedSkylarkObjectTypeRelationshipConfigurations,
  SkylarkGraphQLObjectConfig,
} from "src/interfaces/skylark";
import { skylarkRequest } from "src/lib/graphql/skylark/client";
import { createUpdateRelationshipConfigMutation } from "src/lib/graphql/skylark/dynamicMutations/schema";

interface MutationArgs extends ParsedSkylarkObjectConfig {
  objectType: string;
  relationshipConfig: ParsedSkylarkObjectTypeRelationshipConfigurations;
}

export const useUpdateRelationshipConfig = ({
  onSuccess,
  onError,
}: {
  onSuccess: () => void;
  onError: (e: GQLSkylarkErrorResponse) => void;
}) => {
  const queryClient = useQueryClient();

  const { mutate, isPending } = useMutation({
    mutationFn: ({ objectType, relationshipConfig }: MutationArgs) => {
      const mutation = createUpdateRelationshipConfigMutation(
        objectType,
        relationshipConfig,
      );

      return skylarkRequest<{
        setObjectTypeConfiguration: SkylarkGraphQLObjectConfig;
      }>("mutation", mutation, {
        objectType,
      });
    },
    onSuccess: async () => {
      await queryClient.refetchQueries({
        queryKey: [QueryKeys.ObjectTypeRelationshipConfig],
        exact: false,
        type: "active",
      });

      onSuccess();
    },
    onError,
  });

  return {
    updateRelationshipConfig: mutate,
    isUpdatingRelationshipConfig: isPending,
  };
};
