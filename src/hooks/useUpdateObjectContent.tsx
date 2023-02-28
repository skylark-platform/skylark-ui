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

import { createGetObjectKeyPrefix } from "./useGetObject";
import {
  useAllObjectsMeta,
  useSkylarkObjectOperations,
} from "./useSkylarkObjectTypes";

export const useUpdateObjectContent = ({
  objectType,
  uid,
  currentContentObjects,
  updatedContentObjects,
  onSuccess,
}: {
  objectType: SkylarkObjectType;
  uid: string;
  currentContentObjects: ParsedSkylarkObjectContentObject[];
  updatedContentObjects: ParsedSkylarkObjectContentObject[];
  onSuccess: (updatedContent: ParsedSkylarkObjectContent) => void;
}) => {
  const queryClient = useQueryClient();
  const { objectOperations } = useSkylarkObjectOperations(objectType);
  const { objects } = useAllObjectsMeta();

  const updateObjectContentMutation = createUpdateObjectContentMutation(
    objectOperations,
    currentContentObjects,
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
        queryKey: createGetObjectKeyPrefix({ objectType, uid }),
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
