import { useMutation, useQueryClient } from "@tanstack/react-query";
import { RequestDocument } from "graphql-request";

import {
  GQLSkylarkGetObjectResponse,
  GQLSkylarkUpdateObjectMetadataResponse,
  SkylarkObjectIdentifier,
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
  onSuccess,
}: {
  objectType: SkylarkObjectType;
  onSuccess: (o: SkylarkObjectIdentifier) => void;
}) => {
  const queryClient = useQueryClient();
  const { objectOperations } = useSkylarkObjectOperations(objectType);

  const { mutate, ...rest } = useMutation({
    mutationFn: ({
      uid,
      language,
      metadata,
    }: {
      uid: string;
      language?: string;
      metadata: Record<string, SkylarkObjectMetadataField>;
    }) => {
      const updateObjectMetadataMutation = createUpdateObjectMetadataMutation(
        objectOperations,
        metadata,
        objectOperations?.isTranslatable,
      );
      return skylarkRequest<GQLSkylarkUpdateObjectMetadataResponse>(
        updateObjectMetadataMutation as RequestDocument,
        { uid, language },
      );
    },
    onSuccess: (data, { uid, language }) => {
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
      onSuccess({ uid, language: language || "", objectType });
      refetchSearchQueriesAfterUpdate(queryClient);
    },
  });

  const updateObjectMetadata = ({
    uid,
    metadata,
    language,
  }: {
    uid: string;
    metadata: Record<string, SkylarkObjectMetadataField>;
    language: string;
  }) => mutate({ uid, metadata, language });

  return {
    updateObjectMetadata,
    ...rest,
  };
};
