import {
  QueryClient,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { RequestDocument } from "graphql-request";

import { SEGMENT_KEYS } from "src/constants/segment";
import { QueryKeys } from "src/enums/graphql";
import { useSkylarkObjectOperations } from "src/hooks/useSkylarkObjectTypes";
import {
  GQLSkylarkCreateObjectMetadataResponse,
  GQLSkylarkErrorResponse,
  SkylarkObjectIdentifier,
  SkylarkObjectMetadataField,
  SkylarkObjectType,
} from "src/interfaces/skylark";
import { segment } from "src/lib/analytics/segment";
import { skylarkRequest } from "src/lib/graphql/skylark/client";
import { createCreateObjectMutation } from "src/lib/graphql/skylark/dynamicMutations/objects";

export const refetchSearchQueriesAfterUpdate = (queryClient: QueryClient) => {
  void queryClient.refetchQueries({
    queryKey: [QueryKeys.Search],
    type: "active",
  });
  // Sometimes the object isn't immediately available in search so try again after 5 seconds
  setTimeout(() => {
    void queryClient.refetchQueries({
      queryKey: [QueryKeys.Search],
      type: "active",
    });
  }, 3000);
};

export const useCreateObject = ({
  objectType,
  onSuccess,
  onError,
}: {
  objectType: SkylarkObjectType;
  onSuccess: ({ uid, objectType, language }: SkylarkObjectIdentifier) => void;
  onError: (e: GQLSkylarkErrorResponse) => void;
}) => {
  const queryClient = useQueryClient();

  const { objectOperations } = useSkylarkObjectOperations(objectType);

  const { mutate, isPending } = useMutation({
    mutationFn: ({
      language,
      metadata,
    }: {
      language: string;
      metadata: Record<string, SkylarkObjectMetadataField>;
    }) => {
      const createObjectMetadataMutation = createCreateObjectMutation(
        objectOperations,
        metadata,
        !!language,
      );
      return skylarkRequest<GQLSkylarkCreateObjectMetadataResponse>(
        "mutation",
        createObjectMetadataMutation as RequestDocument,
        { language },
      );
    },
    onSuccess: async (data, { language }) => {
      onSuccess({
        objectType,
        uid: data.createObject.uid,
        language,
      });
      refetchSearchQueriesAfterUpdate(queryClient);

      segment.track(SEGMENT_KEYS.object.created, {
        data,
        language,
      });
    },
    onError,
  });

  const createObject = (
    language: string,
    metadata: Record<string, SkylarkObjectMetadataField>,
  ) => mutate({ language, metadata });

  return {
    createObject,
    isPending,
  };
};
