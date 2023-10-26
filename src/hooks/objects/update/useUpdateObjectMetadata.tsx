import { useMutation, useQueryClient } from "@tanstack/react-query";
import { RequestDocument } from "graphql-request";
import { useCallback } from "react";

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
import {
  createPublishVersionMutation,
  createUpdateObjectMetadataMutation,
} from "src/lib/graphql/skylark/dynamicMutations";

interface MutationVariables {
  uid: string;
  language?: string;
  metadata: Record<string, SkylarkObjectMetadataField> | null;
  draft?: boolean;
  languageVersion?: number;
  globalVersion?: number;
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
    mutationFn: ({
      uid,
      language,
      metadata,
      draft,
      languageVersion,
      globalVersion,
    }: MutationVariables) => {
      const updateObjectMetadataMutation =
        metadata === null
          ? createPublishVersionMutation(
              objectOperations,
              objectOperations?.isTranslatable,
            )
          : createUpdateObjectMetadataMutation(
              objectOperations,
              metadata,
              objectOperations?.isTranslatable,
            );
      return skylarkRequest<GQLSkylarkUpdateObjectMetadataResponse>(
        "mutation",
        updateObjectMetadataMutation as RequestDocument,
        { uid, language, draft, languageVersion, globalVersion },
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

  const updateObjectMetadata = useCallback(
    (values: MutationVariables & { language: string }) => mutate(values),
    [mutate],
  );

  return {
    updateObjectMetadata,
    isUpdatingObjectMetadata: isLoading,
  };
};
