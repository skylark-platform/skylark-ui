import { useMutation, useQueryClient } from "@tanstack/react-query";
import { RequestDocument } from "graphql-request";

import { QueryKeys } from "src/enums/graphql";
import { useSkylarkObjectOperations } from "src/hooks/useSkylarkObjectTypes";
import {
  SkylarkObjectIdentifier,
  SkylarkObjectType,
} from "src/interfaces/skylark";
import { skylarkRequest } from "src/lib/graphql/skylark/client";
import { createDeleteObjectMutation } from "src/lib/graphql/skylark/dynamicMutations";

import { createGetObjectKeyPrefix } from "./get/useGetObject";
import { refetchSearchQueriesAfterUpdate } from "./useCreateObject";

export const useDeleteObject = ({
  objectType,
  isDeleteTranslation,
  onSuccess,
}: {
  objectType: SkylarkObjectType;
  isDeleteTranslation: boolean;
  onSuccess: (o: SkylarkObjectIdentifier) => void;
}) => {
  const queryClient = useQueryClient();

  const { objectOperations } = useSkylarkObjectOperations(objectType);

  const deleteObjectMutation = createDeleteObjectMutation(
    objectOperations,
    isDeleteTranslation,
  );

  const { mutate, isLoading } = useMutation({
    mutationFn: ({ uid, language }: { uid: string; language?: string }) => {
      return skylarkRequest(deleteObjectMutation as RequestDocument, {
        uid,
        language,
      });
    },
    onSuccess: (_, { uid, language }) => {
      queryClient.invalidateQueries({ queryKey: [QueryKeys.Search] });
      queryClient.invalidateQueries({
        queryKey: createGetObjectKeyPrefix({ objectType, uid }),
      });
      refetchSearchQueriesAfterUpdate(queryClient);
      onSuccess({ objectType, uid, language: language || "" });
    },
  });

  return {
    deleteObject: mutate,
    isDeleting: isLoading,
  };
};
