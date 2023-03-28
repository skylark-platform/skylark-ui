import { useMutation, useQueryClient } from "@tanstack/react-query";
import { RequestDocument } from "graphql-request";

import {
  GQLSkylarkUpdateObjectMetadataResponse,
  ParsedSkylarkObjectMetadata,
  SkylarkObjectMetadataField,
  SkylarkObjectType,
} from "src/interfaces/skylark";
import { skylarkRequest } from "src/lib/graphql/skylark/client";
import { createUpdateObjectMetadataMutation } from "src/lib/graphql/skylark/dynamicMutations";
import { parseSkylarkObject } from "src/lib/skylark/parsers";

import { createGetObjectKeyPrefix } from "./useGetObject";
import { useSkylarkObjectOperations } from "./useSkylarkObjectTypes";

export const useUpdateObjectMetadata = ({
  objectType,
  uid,
  onSuccess,
}: {
  objectType: SkylarkObjectType;
  uid: string;
  onSuccess: (updatedMetadata: ParsedSkylarkObjectMetadata) => void;
}) => {
  const queryClient = useQueryClient();
  const { objectOperations } = useSkylarkObjectOperations(objectType);

  const { mutate, ...rest } = useMutation({
    mutationFn: ({
      uid,
      metadata,
    }: {
      uid: string;
      metadata: Record<string, SkylarkObjectMetadataField>;
    }) => {
      const updateObjectMetadataMutation = createUpdateObjectMetadataMutation(
        objectOperations,
        metadata,
      );
      return skylarkRequest<GQLSkylarkUpdateObjectMetadataResponse>(
        updateObjectMetadataMutation as RequestDocument,
        { uid },
      );
    },
    onSuccess: (data, { uid }) => {
      queryClient.invalidateQueries({
        queryKey: createGetObjectKeyPrefix({ objectType, uid }),
      });
      const parsedObject = parseSkylarkObject(data.updateObjectMetadata);
      onSuccess(parsedObject.metadata);
    },
  });

  const updateObjectMetadata = (
    metadata: Record<string, SkylarkObjectMetadataField>,
  ) => mutate({ uid, metadata });

  return {
    updateObjectMetadata,
    ...rest,
  };
};
