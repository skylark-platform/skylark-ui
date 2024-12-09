import { useMutation, useQueryClient } from "@tanstack/react-query";
import { RequestDocument } from "graphql-request";

import { useSkylarkObjectOperations } from "src/hooks/useSkylarkObjectTypes";
import {
  DynamicSetConfig,
  GQLSkylarkErrorResponse,
  GQLSkylarkUpdateObjectContentResponse,
  SkylarkObjectType,
} from "src/interfaces/skylark";
import { skylarkRequest } from "src/lib/graphql/skylark/client";
import { createUpdateObjectDynamicContentConfigurationMutation } from "src/lib/graphql/skylark/dynamicMutations/objects";

import { refetchObjectContentQueries } from "./useUpdateObjectContent";

interface MutationArgs {
  uid: string;
  dynamicSetConfig: DynamicSetConfig;
}

export const useUpdateObjectDynamicContentConfiguration = ({
  objectType,
  onSuccess,
  onError,
}: {
  objectType: SkylarkObjectType;
  onSuccess: () => void;
  onError: (e: GQLSkylarkErrorResponse) => void;
}) => {
  const queryClient = useQueryClient();
  const { objectOperations } = useSkylarkObjectOperations(objectType);

  const { mutate, isPending } = useMutation({
    mutationFn: ({ uid, dynamicSetConfig }: MutationArgs) => {
      const updateObjectContentMutation =
        createUpdateObjectDynamicContentConfigurationMutation(
          objectOperations,
          dynamicSetConfig,
        );

      return skylarkRequest<GQLSkylarkUpdateObjectContentResponse>(
        "mutation",
        updateObjectContentMutation as RequestDocument,
        { uid },
      );
    },
    onSuccess: async (_, { uid }) => {
      await refetchObjectContentQueries(queryClient, uid, objectType);

      onSuccess();
    },
    onError,
  });

  return {
    updateObjectDynamicContentConfiguration: mutate,
    isUpdating: isPending,
  };
};
