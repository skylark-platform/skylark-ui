import { useMutation, useQueryClient } from "@tanstack/react-query";
import { RequestDocument } from "graphql-request";

import { ParsedSkylarkObject, SkylarkObjectType } from "src/interfaces/skylark";
import { skylarkRequest } from "src/lib/graphql/skylark/client";
import { createUpdateObjectAvailability } from "src/lib/graphql/skylark/dynamicMutations";

import { createGetObjectAvailabilityKeyPrefix } from "./useGetObjectAvailability";
import { useSkylarkObjectOperations } from "./useSkylarkObjectTypes";

export const useUpdateObjectAvailability = ({
  objectType,
  uid,
  updatedRelationshipObjects,
  originalRelationshipObjects,
  onSuccess,
}: {
  objectType: SkylarkObjectType;
  uid: string;
  updatedRelationshipObjects: ParsedSkylarkObject[] | null;
  originalRelationshipObjects: ParsedSkylarkObject[] | null;
  onSuccess: () => void;
}) => {
  const queryClient = useQueryClient();
  const { objectOperations } = useSkylarkObjectOperations(objectType);

  const updateObjectRelationshipsMutation = createUpdateObjectAvailability(
    objectOperations,
    originalRelationshipObjects,
    updatedRelationshipObjects,
  );

  const { mutate, ...rest } = useMutation({
    mutationFn: ({ uid }: { uid: string }) => {
      return skylarkRequest(
        updateObjectRelationshipsMutation as RequestDocument,
        { uid },
      );
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
    ...rest,
  };
};
