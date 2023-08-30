import { useMutation, useQueryClient } from "@tanstack/react-query";
import { RequestDocument } from "graphql-request";

import { createGetObjectKeyPrefix } from "src/hooks/objects/get/useGetObject";
import { refetchSearchQueriesAfterUpdate } from "src/hooks/objects/useCreateObject";
import { useSkylarkObjectOperations } from "src/hooks/useSkylarkObjectTypes";
import {
  GQLSkylarkErrorResponse,
  GQLSkylarkGetObjectResponse,
  GQLSkylarkUpdateObjectMetadataResponse,
  SkylarkObjectIdentifier,
  SkylarkObjectMetadataField,
  SkylarkObjectType,
} from "src/interfaces/skylark";
import { skylarkRequest } from "src/lib/graphql/skylark/client";
import { createUpdateObjectMetadataMutation } from "src/lib/graphql/skylark/dynamicMutations";

interface MutationVariables {
  uid: string;
  language?: string;
  metadata: Record<string, SkylarkObjectMetadataField>;
}

export const useUpdateObjectMetadata = ({
  objectType,
  onSuccess,
  onError,
}: {
  objectType: SkylarkObjectType;
  onSuccess: (o: SkylarkObjectIdentifier) => void;
  onError: (
    e: GQLSkylarkErrorResponse<GQLSkylarkUpdateObjectMetadataResponse>,
    variables: MutationVariables,
  ) => void;
}) => {
  const queryClient = useQueryClient();
  const { objectOperations } = useSkylarkObjectOperations(objectType);

  const { mutate, isLoading } = useMutation({
    mutationFn: ({ uid, language, metadata }: MutationVariables) => {
      const updateObjectMetadataMutation = createUpdateObjectMetadataMutation(
        objectOperations,
        metadata,
        objectOperations?.isTranslatable,
      );
      return skylarkRequest<GQLSkylarkUpdateObjectMetadataResponse>(
        "mutation",
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
    onError,
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
    isUpdatingObjectMetadata: isLoading,
  };
};
