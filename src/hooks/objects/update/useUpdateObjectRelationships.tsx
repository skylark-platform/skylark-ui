import { useMutation, useQueryClient } from "@tanstack/react-query";
import { RequestDocument } from "graphql-request";

import { createGetObjectRelationshipsKeyPrefix } from "src/hooks/objects/get/useGetObjectRelationships";
import { useSkylarkObjectOperations } from "src/hooks/useSkylarkObjectTypes";
import {
  GQLSkylarkUpdateRelationshipsResponse,
  ParsedSkylarkObjectRelationships,
  SkylarkObjectType,
} from "src/interfaces/skylark";
import { skylarkRequest } from "src/lib/graphql/skylark/client";
import { createUpdateObjectRelationshipsMutation } from "src/lib/graphql/skylark/dynamicMutations";

export const useUpdateObjectRelationships = ({
  objectType,
  uid,
  updatedRelationshipObjects,
  originalRelationshipObjects,
  onSuccess,
}: {
  objectType: SkylarkObjectType;
  uid: string;
  updatedRelationshipObjects: ParsedSkylarkObjectRelationships[] | null;
  originalRelationshipObjects: ParsedSkylarkObjectRelationships[] | null;
  onSuccess: () => void;
}) => {
  const queryClient = useQueryClient();
  const { objectOperations } = useSkylarkObjectOperations(objectType);

  const updateObjectRelationshipsMutation =
    createUpdateObjectRelationshipsMutation(
      objectOperations,
      updatedRelationshipObjects,
      originalRelationshipObjects,
    );

  const { mutate, isLoading } = useMutation({
    mutationFn: ({ uid }: { uid: string }) => {
      return skylarkRequest<GQLSkylarkUpdateRelationshipsResponse>(
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
  });

  const updateObjectRelationships = () => mutate({ uid });

  return {
    updateObjectRelationships,
    isUpdatingObjectRelationships: isLoading,
  };
};
