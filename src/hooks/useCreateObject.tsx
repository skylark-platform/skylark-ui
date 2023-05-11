import {
  QueryClient,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { RequestDocument } from "graphql-request";

import { QueryKeys } from "src/enums/graphql";
import {
  GQLSkylarkCreateObjectMetadataResponse,
  SkylarkObjectIdentifier,
  SkylarkObjectMetadataField,
  SkylarkObjectType,
} from "src/interfaces/skylark";
import { skylarkRequest } from "src/lib/graphql/skylark/client";
import { createCreateObjectMutation } from "src/lib/graphql/skylark/dynamicMutations";

import { useSkylarkObjectOperations } from "./useSkylarkObjectTypes";

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
}: {
  objectType: SkylarkObjectType;
  onSuccess: ({ uid, objectType, language }: SkylarkObjectIdentifier) => void;
}) => {
  const queryClient = useQueryClient();

  const { objectOperations } = useSkylarkObjectOperations(objectType);

  const { mutate, ...rest } = useMutation({
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
    },
  });

  const createObject = (
    language: string,
    metadata: Record<string, SkylarkObjectMetadataField>,
  ) => mutate({ language, metadata });

  return {
    createObject,
    ...rest,
  };
};
