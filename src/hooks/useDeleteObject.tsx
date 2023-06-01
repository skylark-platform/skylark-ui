import { useMutation, useQueryClient } from "@tanstack/react-query";
import { RequestDocument } from "graphql-request";

import { QueryKeys } from "src/enums/graphql";
import {
  SkylarkObjectIdentifier,
  SkylarkObjectType,
} from "src/interfaces/skylark";
import { skylarkRequest } from "src/lib/graphql/skylark/client";
import { createDeleteObjectMutation } from "src/lib/graphql/skylark/dynamicMutations";

import { refetchSearchQueriesAfterUpdate } from "./useCreateObject";
import { createGetObjectKeyPrefix } from "./useGetObject";
import { useSkylarkObjectOperations } from "./useSkylarkObjectTypes";

export const useDeleteObject = ({
  objectType,
  onSuccess,
}: {
  objectType: SkylarkObjectType;
  onSuccess: (o: SkylarkObjectIdentifier) => void;
}) => {
  const queryClient = useQueryClient();

  const { objectOperations } = useSkylarkObjectOperations(objectType);

  const deleteObjectMutation = createDeleteObjectMutation(objectOperations);

  const mutation = useMutation({
    mutationFn: ({ uid, language }: { uid: string; language: string }) => {
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
      onSuccess({ objectType, uid, language });
    },
  });

  return mutation;
};
