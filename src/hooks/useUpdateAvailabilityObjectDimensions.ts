import { useMutation, useQueryClient } from "@tanstack/react-query";
import { RequestDocument } from "graphql-request";

import { BuiltInSkylarkObjectType } from "src/interfaces/skylark";
import { skylarkRequest } from "src/lib/graphql/skylark/client";
import { createUpdateAvailabilityDimensionsMutation } from "src/lib/graphql/skylark/dynamicMutations";

import { createGetAvailabilityObjectDimensionsKeyPrefix } from "./availability/useAvailabilityObjectDimensions";
import { useSkylarkObjectOperations } from "./useSkylarkObjectTypes";

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

  const { mutate, ...rest } = useMutation({
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
    ...rest,
  };
};
