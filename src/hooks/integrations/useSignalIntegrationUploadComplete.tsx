import { useMutation } from "@tanstack/react-query";

import {
  IntegrationUploadType,
  IntegrationUploaderProvider,
  createIntegrationServiceObj,
} from "src/components/integrations";
import { SkylarkObjectType } from "src/interfaces/skylark";
import { integrationServiceRequest } from "src/lib/integrationService/client";

export const useSignalIntegrationUploadComplete = ({
  type,
  provider,
  uid,
  objectType,
  relationshipName,
}: {
  type: IntegrationUploadType;
  provider: IntegrationUploaderProvider;
  uid: string;
  objectType: SkylarkObjectType;
  relationshipName?: string;
  // onSuccess: ({ uid, objectType, language }: SkylarkObjectIdentifier) => void;
  // onError: (e: GQLSkylarkErrorResponse) => void;
}) => {
  const { mutate, isPending } = useMutation({
    mutationFn: ({
      uploadId,
      fileName,
    }: {
      uploadId: string;
      fileName: string;
    }) => {
      const body = {
        upload_id: uploadId,
        file_name: fileName,
        ...createIntegrationServiceObj({
          uid,
          objectType,
          relationshipName,
        }),
      };

      return integrationServiceRequest(`/upload-complete/${type}/${provider}`, {
        method: "POST",
        body,
      });
    },
  });

  return {
    signalUploadComplete: mutate,
    isPending,
  };
};
