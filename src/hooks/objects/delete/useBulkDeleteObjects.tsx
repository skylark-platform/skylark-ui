import { useMutation, useQueryClient } from "@tanstack/react-query";

import { QueryKeys } from "src/enums/graphql";
import { createGetObjectKeyPrefix } from "src/hooks/objects/get/useGetObject";
import { refetchSearchQueriesAfterUpdate } from "src/hooks/objects/useCreateObject";
import {
  GQLSkylarkErrorResponse,
  SkylarkObjectIdentifier,
} from "src/interfaces/skylark";
import { skylarkRequest } from "src/lib/graphql/skylark/client";
import { BATCH_DELETE } from "src/lib/graphql/skylark/mutations";

export const useBulkDeleteObjects = ({
  onSuccess,
  onError,
}: {
  onSuccess: (deletedObjects: SkylarkObjectIdentifier[]) => void;
  onError: (e: GQLSkylarkErrorResponse) => void;
}) => {
  const queryClient = useQueryClient();

  const { mutate, isPending } = useMutation({
    mutationFn: ({ objects }: { objects: SkylarkObjectIdentifier[] }) => {
      const formattedObjects = objects.map(({ uid, language, objectType }) => ({
        uid,
        language,
        object_type: objectType,
      }));
      return skylarkRequest("mutation", BATCH_DELETE, {
        objects: formattedObjects,
      });
    },
    onSuccess: (_, { objects }) => {
      queryClient.invalidateQueries({ queryKey: [QueryKeys.Search] });
      objects.map((object) =>
        queryClient.invalidateQueries({
          queryKey: createGetObjectKeyPrefix({
            objectType: object.objectType,
            uid: object.uid,
          }),
        }),
      );
      refetchSearchQueriesAfterUpdate(queryClient);
      onSuccess(objects);
    },
    onError,
  });

  return {
    deleteObjects: mutate,
    isDeleting: isPending,
  };
};
