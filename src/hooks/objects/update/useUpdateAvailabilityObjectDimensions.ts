import { useMutation, useQueryClient } from "@tanstack/react-query";
import { RequestDocument } from "graphql-request";

import { createGetAvailabilityObjectDimensionsKeyPrefix } from "src/hooks/availability/useAvailabilityObjectDimensions";
import { useSkylarkObjectOperations } from "src/hooks/useSkylarkObjectTypes";
import { BuiltInSkylarkObjectType } from "src/interfaces/skylark";
import { skylarkRequest } from "src/lib/graphql/skylark/client";
import { createUpdateAvailabilityDimensionsMutation } from "src/lib/graphql/skylark/dynamicMutations";

export const useUpdateAvailabilityObjectDimensions = ({
  uid,
  originalAvailabilityDimensions,
  updatedAvailabilityDimensions,
  onSuccess,
}: {
  uid: string;
  originalAvailabilityDimensions: Record<string, string[]> | null;
  updatedAvailabilityDimensions: Record<string, string[]> | null;
  onSuccess: () => void;
}) => {
  const queryClient = useQueryClient();
  const { objectOperations } = useSkylarkObjectOperations(
    BuiltInSkylarkObjectType.Availability,
  );

  const updateAvailabilityObjectDimensionsMutation =
    createUpdateAvailabilityDimensionsMutation(
      objectOperations,
      originalAvailabilityDimensions,
      updatedAvailabilityDimensions,
    );

  const { mutate, isLoading } = useMutation({
    mutationFn: ({ uid }: { uid: string }) => {
      return skylarkRequest(
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

  const updateAvailabilityObjectDimensions = () => mutate({ uid });

  return {
    updateAvailabilityObjectDimensions,
    isUpdatingAvailabilityObjectDimensions: isLoading,
  };
};
