import { useMutation, useQueryClient } from "@tanstack/react-query";
import { RequestDocument } from "graphql-request";

import { createGetObjectAvailabilityKeyPrefix } from "src/hooks/objects/get/useGetObjectAvailability";
import { useAllObjectsMeta } from "src/hooks/useSkylarkObjectTypes";
import { ParsedSkylarkObject } from "src/interfaces/skylark";
import { skylarkRequest } from "src/lib/graphql/skylark/client";
import { createUpdateAvailabilityAssignedToMutation } from "src/lib/graphql/skylark/dynamicMutations";

export const useUpdateAvailabilityAssignedTo = ({
  onSuccess,
}: {
  onSuccess: () => void;
}) => {
  const queryClient = useQueryClient();
  const { objects: allObjectsMeta } = useAllObjectsMeta();

  const { mutate, isLoading } = useMutation({
    mutationFn: ({
      uid,
      modifiedAvailabilityAssignedTo,
    }: {
      uid: string;
      modifiedAvailabilityAssignedTo: { added: ParsedSkylarkObject[] };
    }) => {
      const updateAvailabilityObjectDimensionsMutation =
        createUpdateAvailabilityAssignedToMutation(
          allObjectsMeta,
          uid,
          modifiedAvailabilityAssignedTo.added,
        );
      return skylarkRequest(
        "mutation",
        updateAvailabilityObjectDimensionsMutation as RequestDocument,
      );
    },
    onSuccess: async (_, { modifiedAvailabilityAssignedTo }) => {
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

      onSuccess();
    },
  });

  return {
    updateAvailabilityAssignedTo: mutate,
    isUpdatingAvailabilityAssignedTo: isLoading,
  };
};
