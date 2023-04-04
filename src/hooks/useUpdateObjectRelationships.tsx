import { useMutation, useQueryClient } from "@tanstack/react-query";
import { RequestDocument } from "graphql-request";

import {
  GQLSkylarkUpdateObjectContentResponse,
  ParsedSkylarkObject,
  ParsedSkylarkObjectContent,
  SkylarkObjectType,
} from "src/interfaces/skylark";
import { skylarkRequest } from "src/lib/graphql/skylark/client";
import { createUpdateObjectRelationshipsMutation } from "src/lib/graphql/skylark/dynamicMutations";
import { parseObjectContent } from "src/lib/skylark/parsers";

import { createGetObjectKeyPrefix } from "./useGetObject";
import { useSkylarkObjectOperations } from "./useSkylarkObjectTypes";

export const useUpdateObjectRelationships = ({
  objectType,
  uid,
  newRelationshipObjects,
  removedRelationshipObjects,
  onSuccess,
}: {
  objectType: SkylarkObjectType;
  uid: string;
  newRelationshipObjects: ParsedSkylarkObject[];
  removedRelationshipObjects: { [key: string]: string[] } | null;
  onSuccess: (updatedContent: ParsedSkylarkObjectContent) => void;
}) => {
  const queryClient = useQueryClient();
  const { objectOperations } = useSkylarkObjectOperations(objectType);

  console.warn("useUpdateObjectRelationships start #");

  const updateObjectRelationshipsMutation =
    createUpdateObjectRelationshipsMutation(
      objectOperations,
      newRelationshipObjects,
      removedRelationshipObjects,
    );

  const { mutate, ...rest } = useMutation({
    mutationFn: ({ uid }: { uid: string }) => {
      return skylarkRequest<GQLSkylarkUpdateObjectContentResponse>(
        updateObjectRelationshipsMutation as RequestDocument,
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

  const updateObjectRelationships = () => mutate({ uid });

  return {
    updateObjectRelationships,
    ...rest,
  };
};
