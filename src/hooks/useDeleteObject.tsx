import { useMutation, useQueryClient } from "@tanstack/react-query";
import { RequestDocument } from "graphql-request";
import { toast } from "react-toastify";

import { QueryKeys } from "src/enums/graphql";
import { SkylarkObjectType } from "src/interfaces/skylark";
import { request } from "src/lib/graphql/skylark/client";
import { createDeleteObjectMutation } from "src/lib/graphql/skylark/dynamicMutations";

import { createGetObjectKeyPrefix } from "./useGetObject";
import { useSkylarkObjectOperations } from "./useSkylarkObjectTypes";

export const useDeleteObject = ({
  objectType,
  onSuccess,
}: {
  objectType: SkylarkObjectType;
  onSuccess: ({ objectType, uid }: { objectType: string; uid: string }) => void;
}) => {
  const queryClient = useQueryClient();

  const { objectOperations } = useSkylarkObjectOperations(objectType);

  const deleteObjectMutation = createDeleteObjectMutation(objectOperations);

  const mutation = useMutation({
    mutationFn: ({ uid }: { uid: string }) => {
      return request(deleteObjectMutation as RequestDocument, { uid });
    },
    onSuccess: (_, { uid }) => {
      queryClient.invalidateQueries({ queryKey: [QueryKeys.Search] });
      queryClient.invalidateQueries({
        queryKey: createGetObjectKeyPrefix({ objectType, uid }),
      });
      onSuccess({ objectType, uid });
    },
  });

  return mutation;
};
