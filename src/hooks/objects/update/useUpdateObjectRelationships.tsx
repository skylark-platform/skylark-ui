import { useMutation, useQueryClient } from "@tanstack/react-query";
import { RequestDocument } from "graphql-request";

import { createGetObjectRelationshipsKeyPrefix } from "src/hooks/objects/get/useGetObjectRelationships";
import { useSkylarkObjectOperations } from "src/hooks/useSkylarkObjectTypes";
import {
  GQLSkylarkUpdateRelationshipsResponse,
  ParsedSkylarkObject,
  ParsedSkylarkObjectRelationships,
  SkylarkObjectType,
} from "src/interfaces/skylark";
import { skylarkRequest } from "src/lib/graphql/skylark/client";
import { createUpdateObjectRelationshipsMutation } from "src/lib/graphql/skylark/dynamicMutations";

export const useUpdateObjectRelationships = ({
  objectType,
  uid,
  modifiedRelationships,
  onSuccess,
}: {
  objectType: SkylarkObjectType;
  uid: string;
  modifiedRelationships: Record<
    string,
    {
      added: ParsedSkylarkObject[];
      removed: string[];
    }
  > | null;
  onSuccess: () => void;
}) => {
  const queryClient = useQueryClient();
  const { objectOperations } = useSkylarkObjectOperations(objectType);

  const updateObjectRelationshipsMutation =
    createUpdateObjectRelationshipsMutation(
      objectOperations,
      modifiedRelationships,
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
