import { useMutation, useQueryClient } from "@tanstack/react-query";
import { RequestDocument } from "graphql-request";

import { createGetAvailabilityObjectDimensionsKeyPrefix } from "src/hooks/availability/useAvailabilityObjectDimensions";
import { useSkylarkObjectOperations } from "src/hooks/useSkylarkObjectTypes";
import { BuiltInSkylarkObjectType } from "src/interfaces/skylark";
import { skylarkRequest } from "src/lib/graphql/skylark/client";
import { createUpdateAvailabilityDimensionsMutation } from "src/lib/graphql/skylark/dynamicMutations";

interface MutationArgs {
  uid: string;
  originalAvailabilityDimensions: Record<string, string[]> | null;
  updatedAvailabilityDimensions: Record<string, string[]> | null;
}

export const useUpdateAvailabilityObjectDimensions = ({
  onSuccess,
}: {
  onSuccess: () => void;
}) => {
  const queryClient = useQueryClient();
  const { objectOperations } = useSkylarkObjectOperations(
    BuiltInSkylarkObjectType.Availability,
  );

  const { mutate, isLoading } = useMutation({
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
  });

  return {
    updateAvailabilityObjectDimensions: mutate,
    isUpdatingAvailabilityObjectDimensions: isLoading,
  };
};
