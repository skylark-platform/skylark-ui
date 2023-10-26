import { useMutation, useQueryClient } from "@tanstack/react-query";
import { RequestDocument } from "graphql-request";

import { QueryKeys } from "src/enums/graphql";
import { createGetObjectKeyPrefix } from "src/hooks/objects/get/useGetObject";
import { refetchSearchQueriesAfterUpdate } from "src/hooks/objects/useCreateObject";
import {
  useAllObjectsMeta,
  useSkylarkObjectOperations,
} from "src/hooks/useSkylarkObjectTypes";
import {
  GQLSkylarkErrorResponse,
  ParsedSkylarkObject,
  SkylarkObjectIdentifier,
  SkylarkObjectType,
} from "src/interfaces/skylark";
import { skylarkRequest } from "src/lib/graphql/skylark/client";
import {
  createBulkDeleteObjectsMutation,
  createDeleteObjectMutation,
} from "src/lib/graphql/skylark/dynamicMutations";

export const useBulkDeleteObjects = ({
  onSuccess,
  onError,
}: {
  onSuccess: (deletedObjects: ParsedSkylarkObject[]) => void;
  onError: (e: GQLSkylarkErrorResponse) => void;
}) => {
  const queryClient = useQueryClient();

  const { objects: allObjectsMeta } = useAllObjectsMeta(true);

  const { mutate, isLoading } = useMutation({
    mutationFn: ({ objects }: { objects: ParsedSkylarkObject[] }) => {
      const bulkDeleteObjectMutation = createBulkDeleteObjectsMutation(
        allObjectsMeta,
        objects,
      );

      return skylarkRequest(
        "mutation",
        bulkDeleteObjectMutation as RequestDocument,
      );
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
