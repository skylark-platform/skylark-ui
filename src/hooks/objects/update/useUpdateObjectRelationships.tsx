import { useMutation, useQueryClient } from "@tanstack/react-query";
import { RequestDocument } from "graphql-request";

import { createGetObjectRelationshipsKeyPrefix } from "src/hooks/objects/get/useGetObjectRelationships";
import { useSkylarkObjectOperations } from "src/hooks/useSkylarkObjectTypes";
import {
  GQLSkylarkUpdateRelationshipsResponse,
  ParsedSkylarkObject,
  SkylarkObjectType,
} from "src/interfaces/skylark";
import { skylarkRequest } from "src/lib/graphql/skylark/client";
import { createUpdateObjectRelationshipsMutation } from "src/lib/graphql/skylark/dynamicMutations";

interface MutationArgs {
  uid: string;
  modifiedRelationships: Record<
    string,
    {
      added: ParsedSkylarkObject[];
      removed: string[];
    }
  > | null;
}

export const useUpdateObjectRelationships = ({
  objectType,
  onSuccess,
}: {
  objectType: SkylarkObjectType;
  onSuccess: () => void;
}) => {
  const queryClient = useQueryClient();
  const { objectOperations } = useSkylarkObjectOperations(objectType);

  const { mutate, isLoading } = useMutation({
    mutationFn: ({ uid, modifiedRelationships }: MutationArgs) => {
      const updateObjectRelationshipsMutation =
        createUpdateObjectRelationshipsMutation(
          objectOperations,
          modifiedRelationships,
        );

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

  return {
    updateObjectRelationships: mutate,
    isUpdatingObjectRelationships: isLoading,
  };
};
