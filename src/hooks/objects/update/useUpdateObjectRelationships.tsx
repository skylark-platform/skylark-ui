import { useMutation, useQueryClient } from "@tanstack/react-query";
import { RequestDocument } from "graphql-request";

import { createGetObjectRelationshipsKeyPrefix } from "src/hooks/objects/get/useGetObjectRelationships";
import { useSkylarkObjectOperations } from "src/hooks/useSkylarkObjectTypes";
import {
  GQLSkylarkErrorResponse,
  GQLSkylarkUpdateRelationshipsResponse,
  ModifiedRelationshipsObject,
  SkylarkObjectType,
} from "src/interfaces/skylark";
import { skylarkRequest } from "src/lib/graphql/skylark/client";
import { createUpdateObjectRelationshipsMutation } from "src/lib/graphql/skylark/dynamicMutations/objects";

interface MutationArgs {
  uid: string;
  modifiedRelationships: ModifiedRelationshipsObject | null;
}

export const useUpdateObjectRelationships = ({
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
    mutationFn: ({ uid, modifiedRelationships }: MutationArgs) => {
      const updateObjectRelationshipsMutation =
        createUpdateObjectRelationshipsMutation(
          objectOperations,
          modifiedRelationships,
        );

      return skylarkRequest<GQLSkylarkUpdateRelationshipsResponse>(
        "mutation",
        updateObjectRelationshipsMutation as RequestDocument,
        { uid },
      );
    },
    onSuccess: async (_, { uid }) => {
      await queryClient.refetchQueries({
        queryKey: createGetObjectRelationshipsKeyPrefix({ objectType, uid }),
      });

      onSuccess();
    },
    onError,
  });

  return {
    updateObjectRelationships: mutate,
    isUpdatingObjectRelationships: isPending,
  };
};
