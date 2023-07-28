import { useMutation, useQueryClient } from "@tanstack/react-query";
import { RequestDocument } from "graphql-request";

import { createGetObjectAvailabilityKeyPrefix } from "src/hooks/objects/get/useGetObjectAvailability";
import { useSkylarkObjectOperations } from "src/hooks/useSkylarkObjectTypes";
import { ParsedSkylarkObject, SkylarkObjectType } from "src/interfaces/skylark";
import { skylarkRequest } from "src/lib/graphql/skylark/client";
import { createUpdateObjectAvailability } from "src/lib/graphql/skylark/dynamicMutations";

interface MutationFnArgs {
  uid: string;
  modifiedAvailabilityObjects: {
    added: ParsedSkylarkObject[];
    removed: string[];
  } | null;
}

export const useUpdateObjectAvailability = ({
  objectType,
  onSuccess,
}: {
  objectType: SkylarkObjectType;
  onSuccess: () => void;
}) => {
  const queryClient = useQueryClient();
  const { objectOperations } = useSkylarkObjectOperations(objectType);

  const { mutate, isLoading } = useMutation({
    mutationFn: ({ uid, modifiedAvailabilityObjects }: MutationFnArgs) => {
      const mutation = createUpdateObjectAvailability(
        objectOperations,
        modifiedAvailabilityObjects,
      );

      return skylarkRequest(mutation as RequestDocument, { uid });
    },
    onSuccess: async (_, { uid }) => {
      await queryClient.refetchQueries({
        queryKey: createGetObjectAvailabilityKeyPrefix({ uid, objectType }),
      });

      onSuccess();
    },
  });

  return {
    updateObjectAvailability: mutate,
    isUpdatingObjectAvailability: isLoading,
  };
};
