import { useMutation, useQueryClient } from "@tanstack/react-query";
import { RequestDocument } from "graphql-request";

import {
  GQLSkylarkGetObjectResponse,
  GQLSkylarkUpdateObjectMetadataResponse,
  ParsedSkylarkObjectMetadata,
  SkylarkObjectMetadataField,
  SkylarkObjectType,
} from "src/interfaces/skylark";
import { skylarkRequest } from "src/lib/graphql/skylark/client";
import { createUpdateObjectMetadataMutation } from "src/lib/graphql/skylark/dynamicMutations";

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
  onSuccess: () => void;
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
      // Update get query with updated data
      queryClient.setQueryData<GQLSkylarkGetObjectResponse>(
        createGetObjectKeyPrefix({ objectType, uid, language }),
        (oldData) => ({
          getObject: {
            ...oldData?.getObject,
            ...data.updateObjectMetadata,
          },
        }),
      );
      onSuccess();
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
