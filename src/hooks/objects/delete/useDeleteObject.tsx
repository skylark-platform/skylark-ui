import { useMutation, useQueryClient } from "@tanstack/react-query";
import { RequestDocument } from "graphql-request";

import { QueryKeys } from "src/enums/graphql";
import { createGetObjectKeyPrefix } from "src/hooks/objects/get/useGetObject";
import { refetchSearchQueriesAfterUpdate } from "src/hooks/objects/useCreateObject";
import { useSkylarkObjectOperations } from "src/hooks/useSkylarkObjectTypes";
import {
  GQLSkylarkErrorResponse,
  SkylarkObjectIdentifier,
  SkylarkObjectType,
} from "src/interfaces/skylark";
import { skylarkRequest } from "src/lib/graphql/skylark/client";
import { createDeleteObjectMutation } from "src/lib/graphql/skylark/dynamicMutations/objects";

export const useDeleteObject = ({
  objectType,
  isDeleteTranslation,
  onSuccess,
  onError,
}: {
  objectType: SkylarkObjectType;
  isDeleteTranslation: boolean;
  onSuccess: (o: SkylarkObjectIdentifier) => void;
  onError: (e: GQLSkylarkErrorResponse) => void;
}) => {
  const queryClient = useQueryClient();

  const { objectOperations } = useSkylarkObjectOperations(objectType);

  const deleteObjectMutation = createDeleteObjectMutation(
    objectOperations,
    isDeleteTranslation,
  );

  const { mutate, isPending } = useMutation({
    mutationFn: ({ uid, language }: { uid: string; language?: string }) => {
      return skylarkRequest(
        "mutation",
        deleteObjectMutation as RequestDocument,
        {
          uid,
          language,
        },
      );
    },
    onSuccess: (_, { uid, language }) => {
      queryClient.invalidateQueries({ queryKey: [QueryKeys.Search] });
      queryClient.invalidateQueries({
        queryKey: createGetObjectKeyPrefix({ objectType, uid }),
      });
      refetchSearchQueriesAfterUpdate(queryClient);
      onSuccess({ objectType, uid, language: language || "" });
    },
    onError,
  });

  return {
    deleteObject: mutate,
    isDeleting: isPending,
  };
};
