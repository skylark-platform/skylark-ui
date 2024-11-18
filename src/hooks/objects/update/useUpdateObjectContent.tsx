import {
  QueryClient,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { RequestDocument } from "graphql-request";

import { QueryKeys } from "src/enums/graphql";
import { createGetObjectContentKeyPrefix } from "src/hooks/objects/get/useGetObjectContent";
import { createGetObjectDynamicContentConfigurationKeyPrefix } from "src/hooks/objects/get/useGetObjectDynamicContentConfiguration";
import { useSkylarkObjectOperations } from "src/hooks/useSkylarkObjectTypes";
import {
  GQLSkylarkErrorResponse,
  GQLSkylarkUpdateObjectContentResponse,
  ModifiedContents,
  SkylarkObjectType,
} from "src/interfaces/skylark";
import { skylarkRequest } from "src/lib/graphql/skylark/client";
import { createUpdateObjectContentMutation } from "src/lib/graphql/skylark/dynamicMutations/objects";

type MutationArgs = ModifiedContents & {
  uid: string;
};

export const refetchObjectContentQueries = async (
  queryClient: QueryClient,
  uid: string,
  objectType: string,
) => {
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
};

export const useUpdateObjectContent = ({
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
    mutationFn: ({
      uid,
      original: originalContentObjects,
      updated: updatedContentObjects,
      config: modifiedConfig,
    }: MutationArgs) => {
      const updateObjectContentMutation = createUpdateObjectContentMutation(
        objectOperations,
        originalContentObjects,
        updatedContentObjects,
        modifiedConfig,
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
    updateObjectContent: mutate,
    isUpdatingObjectContent: isPending,
  };
};
