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

import { refetchSearchQueriesAfterUpdate } from "./useCreateObject";
import { createGetObjectKeyPrefix } from "./useGetObject";
import { useSkylarkObjectOperations } from "./useSkylarkObjectTypes";

export const useUpdateObjectMetadata = ({
  objectType,
  uid,
  language,
  onSuccess,
}: {
  objectType: SkylarkObjectType;
  uid: string;
  language: string;
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
        !!language,
      );
      return skylarkRequest<GQLSkylarkUpdateObjectMetadataResponse>(
        updateObjectMetadataMutation as RequestDocument,
        { uid, language },
      );
    },
    onSuccess: (data, { uid }) => {
      queryClient.invalidateQueries({
        queryKey: createGetObjectKeyPrefix({ objectType, uid }),
      });
      const parsedObject = parseSkylarkObject(data.updateObjectMetadata);
      onSuccess(parsedObject.metadata);
      refetchSearchQueriesAfterUpdate(queryClient);
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
