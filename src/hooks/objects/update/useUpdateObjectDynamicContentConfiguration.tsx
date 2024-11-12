import { useMutation, useQueryClient } from "@tanstack/react-query";
import { RequestDocument } from "graphql-request";

import { QueryKeys } from "src/enums/graphql";
import { createGetObjectContentKeyPrefix } from "src/hooks/objects/get/useGetObjectContent";
import { createGetObjectDynamicContentConfigurationKeyPrefix } from "src/hooks/objects/get/useGetObjectDynamicContentConfiguration";
import { createDynamicContentPreviewPrefix } from "src/hooks/useDynamicContentPreview";
import { useSkylarkObjectOperations } from "src/hooks/useSkylarkObjectTypes";
import {
  DynamicSetConfig,
  GQLSkylarkErrorResponse,
  GQLSkylarkUpdateObjectContentResponse,
  SkylarkObjectContentObject,
  SkylarkObjectType,
} from "src/interfaces/skylark";
import { skylarkRequest } from "src/lib/graphql/skylark/client";
import {
  createUpdateObjectContentMutation,
  createUpdateObjectDynamicContentConfigurationMutation,
} from "src/lib/graphql/skylark/dynamicMutations/objects";

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
      await queryClient.refetchQueries({
        queryKey: createGetObjectContentKeyPrefix({ uid, objectType }),
      });
      await queryClient.refetchQueries({
        queryKey: [QueryKeys.PreviewDynamicContent],
      });
      await queryClient.refetchQueries({
        queryKey: createGetObjectDynamicContentConfigurationKeyPrefix({
          uid,
          objectType,
        }),
      });
      onSuccess();
    },
    onError,
  });

  return {
    updateObjectDynamicContentConfiguration: mutate,
    isUpdating: isPending,
  };
};
