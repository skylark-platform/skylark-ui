import { useMutation, useQueryClient } from "@tanstack/react-query";
import { RequestDocument } from "graphql-request";

import { createGetObjectContentKeyPrefix } from "src/hooks/objects/get/useGetObjectContent";
import { useSkylarkObjectOperations } from "src/hooks/useSkylarkObjectTypes";
import {
  GQLSkylarkErrorResponse,
  GQLSkylarkUpdateObjectContentResponse,
  SkylarkObjectContentObject,
  SkylarkObjectType,
} from "src/interfaces/skylark";
import { skylarkRequest } from "src/lib/graphql/skylark/client";
import { createUpdateObjectContentMutation } from "src/lib/graphql/skylark/dynamicMutations/objects";

interface MutationArgs {
  uid: string;
  originalContentObjects: SkylarkObjectContentObject[] | null;
  updatedContentObjects: SkylarkObjectContentObject[] | null;
}

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
      originalContentObjects,
      updatedContentObjects,
    }: MutationArgs) => {
      const updateObjectContentMutation = createUpdateObjectContentMutation(
        objectOperations,
        originalContentObjects,
        updatedContentObjects,
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

      onSuccess();
    },
    onError,
  });

  return {
    updateObjectContent: mutate,
    isUpdatingObjectContent: isPending,
  };
};
