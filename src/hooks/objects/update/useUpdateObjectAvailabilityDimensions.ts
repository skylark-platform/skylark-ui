import { useMutation, useQueryClient } from "@tanstack/react-query";
import { RequestDocument } from "graphql-request";

import { createGetAvailabilityObjectDimensionsKeyPrefix } from "src/hooks/availability/useAvailabilityObjectDimensions";
import { useSkylarkObjectOperations } from "src/hooks/useSkylarkObjectTypes";
import {
  GQLSkylarkErrorResponse,
  ModifiedAvailabilityDimensions,
} from "src/interfaces/skylark";
import { skylarkRequest } from "src/lib/graphql/skylark/client";
import { createUpdateAvailabilityDimensionsMutation } from "src/lib/graphql/skylark/dynamicMutations/objects";

interface MutationArgs {
  uid: string;
  modifiedAvailabilityDimensions: ModifiedAvailabilityDimensions;
}

export const useUpdateObjectAvailabilityDimensions = ({
  objectType,
  onSuccess,
  onError,
}: {
  objectType: string;
  onSuccess: () => void;
  onError: (e: GQLSkylarkErrorResponse) => void;
}) => {
  const queryClient = useQueryClient();
  const { objectOperations } = useSkylarkObjectOperations(objectType);

  const { mutate, isPending } = useMutation({
    mutationFn: ({ uid, modifiedAvailabilityDimensions }: MutationArgs) => {
      const updateAvailabilityObjectDimensionsMutation =
        createUpdateAvailabilityDimensionsMutation(
          objectOperations,
          modifiedAvailabilityDimensions,
        );

      return skylarkRequest(
        "mutation",
        updateAvailabilityObjectDimensionsMutation as RequestDocument,
        { uid },
      );
    },
    onSuccess: async (_, { uid }) => {
      await queryClient.refetchQueries({
        queryKey: createGetAvailabilityObjectDimensionsKeyPrefix({
          uid,
          objectType,
        }),
      });

      onSuccess();
    },
    onError,
  });

  return {
    updateObjectAvailabilityDimensions: mutate,
    isUpdatingObjectAvailabilityDimensions: isPending,
  };
};
