import { useMutation, useQueryClient } from "@tanstack/react-query";
import { RequestDocument } from "graphql-request";

import { QueryKeys } from "src/enums/graphql";
import {
  GQLSkylarkUpdateObjectMetadataResponse,
  SkylarkObjectIdentifier,
  SkylarkObjectMetadataField,
  SkylarkObjectType,
} from "src/interfaces/skylark";
import { skylarkRequest } from "src/lib/graphql/skylark/client";
import { createCreateObjectMutation } from "src/lib/graphql/skylark/dynamicMutations";

import { useSkylarkObjectOperations } from "./useSkylarkObjectTypes";

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
      const updateObjectMetadataMutation = createCreateObjectMutation(
        objectOperations,
        metadata,
        !!language,
      );
      return skylarkRequest<GQLSkylarkUpdateObjectMetadataResponse>(
        updateObjectMetadataMutation as RequestDocument,
        { language },
      );
    },
    onSuccess: (data, { language }) => {
      queryClient.invalidateQueries({
        queryKey: [QueryKeys.Search],
      });
      onSuccess({
        objectType,
        uid: data.createObject.uid,
        language,
      });
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
