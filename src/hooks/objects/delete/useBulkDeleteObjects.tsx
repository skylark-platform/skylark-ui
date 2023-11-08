import { useMutation, useQueryClient } from "@tanstack/react-query";

import { QueryKeys } from "src/enums/graphql";
import { createGetObjectKeyPrefix } from "src/hooks/objects/get/useGetObject";
import { refetchSearchQueriesAfterUpdate } from "src/hooks/objects/useCreateObject";
import {
  GQLSkylarkErrorResponse,
  ParsedSkylarkObject,
} from "src/interfaces/skylark";
import { skylarkRequest } from "src/lib/graphql/skylark/client";
import { BATCH_DELETE } from "src/lib/graphql/skylark/mutations";

export const useBulkDeleteObjects = ({
  onSuccess,
  onError,
}: {
  onSuccess: (deletedObjects: ParsedSkylarkObject[]) => void;
  onError: (e: GQLSkylarkErrorResponse) => void;
}) => {
  const queryClient = useQueryClient();

  const { mutate, isLoading } = useMutation({
    mutationFn: ({ objects }: { objects: ParsedSkylarkObject[] }) => {
      const formattedObjects = objects.map(({ uid, meta: { language } }) => ({
        uid,
        language,
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
    isDeleting: isLoading,
  };
};
