import { useMutation, useQueryClient } from "@tanstack/react-query";
import { RequestDocument } from "graphql-request";

import { createGetObjectAvailabilityKeyPrefix } from "src/hooks/objects/get/useGetObjectAvailability";
import { useSkylarkObjectOperations } from "src/hooks/useSkylarkObjectTypes";
import { ParsedSkylarkObject, SkylarkObjectType } from "src/interfaces/skylark";
import { skylarkRequest } from "src/lib/graphql/skylark/client";
import { createUpdateObjectAvailability } from "src/lib/graphql/skylark/dynamicMutations";

export const useUpdateObjectAvailability = ({
  objectType,
  uid,
  updatedAvailabilityObjects,
  originalAvailabilityObjects,
  onSuccess,
}: {
  objectType: SkylarkObjectType;
  uid: string;
  updatedAvailabilityObjects: ParsedSkylarkObject[] | null;
  originalAvailabilityObjects: ParsedSkylarkObject[] | null;
  onSuccess: () => void;
}) => {
  const queryClient = useQueryClient();
  const { objectOperations } = useSkylarkObjectOperations(objectType);

  const mutation = createUpdateObjectAvailability(
    objectOperations,
    originalAvailabilityObjects,
    updatedAvailabilityObjects,
  );

  const { mutate, isLoading } = useMutation({
    mutationFn: ({ uid }: { uid: string }) => {
      return skylarkRequest(mutation as RequestDocument, { uid });
    },
    onSuccess: async (_, { uid }) => {
      await queryClient.refetchQueries({
        queryKey: createGetObjectAvailabilityKeyPrefix({ uid, objectType }),
      });

      onSuccess();
    },
  });

  const updateObjectAvailability = () => mutate({ uid });

  return {
    updateObjectAvailability,
    isUpdatingObjectAvailability: isLoading,
  };
};
