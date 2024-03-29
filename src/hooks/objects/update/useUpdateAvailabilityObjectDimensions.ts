import { useMutation, useQueryClient } from "@tanstack/react-query";
import { RequestDocument } from "graphql-request";

import { createGetAvailabilityObjectDimensionsKeyPrefix } from "src/hooks/availability/useAvailabilityObjectDimensions";
import { useSkylarkObjectOperations } from "src/hooks/useSkylarkObjectTypes";
import {
  BuiltInSkylarkObjectType,
  GQLSkylarkErrorResponse,
} from "src/interfaces/skylark";
import { skylarkRequest } from "src/lib/graphql/skylark/client";
import { createUpdateAvailabilityDimensionsMutation } from "src/lib/graphql/skylark/dynamicMutations/objects";

interface MutationArgs {
  uid: string;
  originalAvailabilityDimensions: Record<string, string[]> | null;
  updatedAvailabilityDimensions: Record<string, string[]> | null;
}

export const useUpdateAvailabilityObjectDimensions = ({
  onSuccess,
  onError,
}: {
  onSuccess: () => void;
  onError: (e: GQLSkylarkErrorResponse) => void;
}) => {
  const queryClient = useQueryClient();
  const { objectOperations } = useSkylarkObjectOperations(
    BuiltInSkylarkObjectType.Availability,
  );

  const { mutate, isPending } = useMutation({
    mutationFn: ({
      uid,
      originalAvailabilityDimensions,
      updatedAvailabilityDimensions,
    }: MutationArgs) => {
      const updateAvailabilityObjectDimensionsMutation =
        createUpdateAvailabilityDimensionsMutation(
          objectOperations,
          originalAvailabilityDimensions,
          updatedAvailabilityDimensions,
        );

      return skylarkRequest(
        "mutation",
        updateAvailabilityObjectDimensionsMutation as RequestDocument,
        { uid },
      );
    },
    onSuccess: async (_, { uid }) => {
      await queryClient.refetchQueries({
        queryKey: createGetAvailabilityObjectDimensionsKeyPrefix({ uid }),
      });

      onSuccess();
    },
    onError,
  });

  return {
    updateAvailabilityObjectDimensions: mutate,
    isUpdatingAvailabilityObjectDimensions: isPending,
  };
};
