import { useMutation, useQueryClient } from "@tanstack/react-query";
import { RequestDocument } from "graphql-request";

import { createGetObjectContentKeyPrefix } from "src/hooks/objects/get/useGetObjectContent";
import { useSkylarkObjectOperations } from "src/hooks/useSkylarkObjectTypes";
import {
  GQLSkylarkUpdateObjectContentResponse,
  ParsedSkylarkObjectContentObject,
  SkylarkObjectType,
} from "src/interfaces/skylark";
import { skylarkRequest } from "src/lib/graphql/skylark/client";
import { createUpdateObjectContentMutation } from "src/lib/graphql/skylark/dynamicMutations";

export const useUpdateObjectContent = ({
  objectType,
  uid,
  originalContentObjects,
  updatedContentObjects,
  onSuccess,
}: {
  objectType: SkylarkObjectType;
  uid: string;
  originalContentObjects: ParsedSkylarkObjectContentObject[] | null;
  updatedContentObjects: ParsedSkylarkObjectContentObject[] | null;
  onSuccess: () => void;
}) => {
  const queryClient = useQueryClient();
  const { objectOperations } = useSkylarkObjectOperations(objectType);

  const updateObjectContentMutation = createUpdateObjectContentMutation(
    objectOperations,
    originalContentObjects,
    updatedContentObjects,
  );

  const { mutate, ...rest } = useMutation({
    mutationFn: ({ uid }: { uid: string }) => {
      return skylarkRequest<GQLSkylarkUpdateObjectContentResponse>(
        updateObjectContentMutation as RequestDocument,
        { uid },
      );
    },
    onSuccess: async (_, { uid }) => {
      await queryClient.refetchQueries({
        queryKey: createGetObjectContentKeyPrefix({ uid, objectType }),
      });

      onSuccess();
    },
  });

  const updateObjectContent = () => mutate({ uid });

  return {
    updateObjectContent,
    ...rest,
  };
};
