import { useMutation, useQueryClient } from "@tanstack/react-query";
import { RequestDocument } from "graphql-request";

import {
  GQLSkylarkUpdateObjectContentResponse,
  ParsedSkylarkObjectContent,
  ParsedSkylarkObjectContentObject,
  SkylarkObjectType,
} from "src/interfaces/skylark";
import { skylarkRequest } from "src/lib/graphql/skylark/client";
import { createUpdateObjectContentMutation } from "src/lib/graphql/skylark/dynamicMutations";
import { parseObjectContent } from "src/lib/skylark/parsers";

import { createGetObjectContentKeyPrefix } from "./useGetObjectContent";
import {
  useAllObjectsMeta,
  useSkylarkObjectOperations,
} from "./useSkylarkObjectTypes";

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
  onSuccess: (updatedContent: ParsedSkylarkObjectContent) => void;
}) => {
  const queryClient = useQueryClient();
  const { objectOperations } = useSkylarkObjectOperations(objectType);
  const { objects } = useAllObjectsMeta(false);

  const updateObjectContentMutation = createUpdateObjectContentMutation(
    objectOperations,
    originalContentObjects,
    updatedContentObjects,
    objects,
  );

  const { mutate, ...rest } = useMutation({
    mutationFn: ({ uid }: { uid: string }) => {
      return skylarkRequest<GQLSkylarkUpdateObjectContentResponse>(
        updateObjectContentMutation as RequestDocument,
        { uid },
      );
    },
    onSuccess: (data, { uid }) => {
      queryClient.invalidateQueries({
        queryKey: createGetObjectContentKeyPrefix({ objectType, uid }),
      });
      const parsedObjectContent = parseObjectContent(
        data.updateObjectContent.content,
      );
      onSuccess(parsedObjectContent);
    },
  });

  const updateObjectContent = () => mutate({ uid });

  return {
    updateObjectContent,
    ...rest,
  };
};
