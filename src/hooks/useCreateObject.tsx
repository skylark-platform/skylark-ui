import { useMutation } from "@tanstack/react-query";
import { RequestDocument } from "graphql-request";

import {
  GQLSkylarkUpdateObjectMetadataResponse,
  SkylarkObjectIdentifier,
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
  const { objectOperations } = useSkylarkObjectOperations(objectType);

  const { mutate, ...rest } = useMutation({
    mutationFn: ({ language }: { language: string }) => {
      const updateObjectMetadataMutation =
        createCreateObjectMutation(objectOperations);
      return skylarkRequest<GQLSkylarkUpdateObjectMetadataResponse>(
        updateObjectMetadataMutation as RequestDocument,
        { language },
      );
    },
    onSuccess: (data, { language }) => {
      onSuccess({
        objectType,
        uid: data.createObject.uid,
        language,
      });
    },
  });

  const createObject = (language: string) => mutate({ language });

  return {
    createObject,
    ...rest,
  };
};
