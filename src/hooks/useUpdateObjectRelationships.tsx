import { useMutation, useQueryClient } from "@tanstack/react-query";
import { RequestDocument } from "graphql-request";

import {
  GQLSkylarkUpdateRelationshipsResponse,
  ParsedSkylarkObjectRelationships,
  SkylarkObjectType,
} from "src/interfaces/skylark";
import { skylarkRequest } from "src/lib/graphql/skylark/client";
import { createUpdateObjectRelationshipsMutation } from "src/lib/graphql/skylark/dynamicMutations";

import { createGetObjectRelationshipsKeyPrefix } from "./useGetObjectRelationships";
import { useSkylarkObjectOperations } from "./useSkylarkObjectTypes";

export const useUpdateObjectRelationships = ({
  objectType,
  uid,
  updatedRelationshipObjects,
  originalRelationshipObjects,
  onSuccess,
}: {
  objectType: SkylarkObjectType;
  uid: string;
  updatedRelationshipObjects: ParsedSkylarkObjectRelationships[] | null;
  originalRelationshipObjects: ParsedSkylarkObjectRelationships[] | null;
  onSuccess: () => void;
}) => {
  const queryClient = useQueryClient();
  const { objectOperations } = useSkylarkObjectOperations(objectType);

  const updateObjectRelationshipsMutation =
    createUpdateObjectRelationshipsMutation(
      objectOperations,
      updatedRelationshipObjects,
      originalRelationshipObjects,
    );

  const { mutate, ...rest } = useMutation({
    mutationFn: ({ uid }: { uid: string }) => {
      return skylarkRequest<GQLSkylarkUpdateRelationshipsResponse>(
        updateObjectRelationshipsMutation as RequestDocument,
        { uid },
      );
    },
    onSuccess: async (_, { uid }) => {
      await queryClient.refetchQueries({
        queryKey: createGetObjectRelationshipsKeyPrefix({ objectType, uid }),
      });

      onSuccess();
    },
  });

  const updateObjectRelationships = () => mutate({ uid });

  return {
    updateObjectRelationships,
    ...rest,
  };
};