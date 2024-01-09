import { useMutation, useQueryClient } from "@tanstack/react-query";
import { RequestDocument } from "graphql-request";

import { createGetObjectAvailabilityKeyPrefix } from "src/hooks/objects/get/useGetObjectAvailability";
import { useSkylarkObjectOperations } from "src/hooks/useSkylarkObjectTypes";
import {
  GQLSkylarkErrorResponse,
  ParsedSkylarkObject,
  SkylarkObjectType,
} from "src/interfaces/skylark";
import { skylarkRequest } from "src/lib/graphql/skylark/client";
import { createUpdateObjectAvailability } from "src/lib/graphql/skylark/dynamicMutations/objects";

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
  onError,
}: {
  objectType: SkylarkObjectType;
  onSuccess: () => void;
  onError: (e: GQLSkylarkErrorResponse) => void;
}) => {
  const queryClient = useQueryClient();
  const { objectOperations } = useSkylarkObjectOperations(objectType);

  const { mutate, isPending } = useMutation({
    mutationFn: ({ uid, modifiedAvailabilityObjects }: MutationFnArgs) => {
      const mutation = createUpdateObjectAvailability(
        objectOperations,
        modifiedAvailabilityObjects,
      );

      return skylarkRequest("mutation", mutation as RequestDocument, { uid });
    },
    onSuccess: async (_, { uid }) => {
      await queryClient.refetchQueries({
        queryKey: createGetObjectAvailabilityKeyPrefix({ uid, objectType }),
      });

      onSuccess();
    },
    onError,
  });

  return {
    updateObjectAvailability: mutate,
    isUpdatingObjectAvailability: isPending,
  };
};
