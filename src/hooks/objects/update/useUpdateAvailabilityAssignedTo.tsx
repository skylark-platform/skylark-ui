import { useMutation, useQueryClient } from "@tanstack/react-query";
import { RequestDocument } from "graphql-request";

import { createGetAvailabilityAssignedToKeyPrefix } from "src/hooks/availability/useAvailabilityAssignedTo";
import { createGetObjectAvailabilityKeyPrefix } from "src/hooks/objects/get/useGetObjectAvailability";
import { useAllObjectsMeta } from "src/hooks/useSkylarkObjectTypes";
import {
  GQLSkylarkErrorResponse,
  SkylarkObjectIdentifier,
} from "src/interfaces/skylark";
import { skylarkRequest } from "src/lib/graphql/skylark/client";
import { createUpdateAvailabilityAssignedToMutation } from "src/lib/graphql/skylark/dynamicMutations/objects";

export const useUpdateAvailabilityAssignedTo = ({
  onSuccess,
  onError,
}: {
  onSuccess: () => void;
  onError: (e: GQLSkylarkErrorResponse) => void;
}) => {
  const queryClient = useQueryClient();
  const { objects: allObjectsMeta } = useAllObjectsMeta();

  const { mutate, isPending } = useMutation({
    mutationFn: ({
      uid,
      modifiedAvailabilityAssignedTo,
    }: {
      uid: string;
      modifiedAvailabilityAssignedTo: {
        added: SkylarkObjectIdentifier[];
        removed: SkylarkObjectIdentifier[];
      };
    }) => {
      const updateAvailabilityObjectDimensionsMutation =
        createUpdateAvailabilityAssignedToMutation(
          allObjectsMeta,
          uid,
          modifiedAvailabilityAssignedTo.added,
          modifiedAvailabilityAssignedTo.removed,
        );
      return skylarkRequest(
        "mutation",
        updateAvailabilityObjectDimensionsMutation as RequestDocument,
      );
    },
    onSuccess: async (_, { uid, modifiedAvailabilityAssignedTo }) => {
      await Promise.all(
        modifiedAvailabilityAssignedTo.added.map(({ uid, objectType }) =>
          queryClient.invalidateQueries({
            queryKey: createGetObjectAvailabilityKeyPrefix({
              uid,
              objectType,
            }),
          }),
        ),
      );
      await queryClient.refetchQueries({
        queryKey: createGetAvailabilityAssignedToKeyPrefix({ uid }),
      });

      onSuccess();
    },
    onError,
  });

  return {
    updateAvailabilityAssignedTo: mutate,
    isUpdatingAvailabilityAssignedTo: isPending,
  };
};
