import { useQuery } from "@tanstack/react-query";

import {
  IntegrationObjectInfo,
  createIntegrationServiceObj,
} from "src/components/integrations";
import { QueryKeys } from "src/enums/graphql";
import { IntegrationCloudinaryUploadUrlResponseBody } from "src/interfaces/skylark/integrations";
import { integrationServiceRequest } from "src/lib/integrationService/client";

export const useGenerateCloudinaryUploadUrl = ({
  uid,
  objectType,
  relationshipName,
}: IntegrationObjectInfo) => {
  const { data, isLoading, isError } = useQuery({
    queryKey: [
      QueryKeys.Integrations,
      "cloudinary",
      "uploadUrl",
      uid,
      relationshipName,
      objectType,
    ],
    queryFn: async () => {
      const body = createIntegrationServiceObj({
        uid,
        objectType,
        relationshipName,
      });

      const data =
        await integrationServiceRequest<IntegrationCloudinaryUploadUrlResponseBody>(
          "/upload-url/image/cloudinary",
          {
            body,
            method: "POST",
          },
        );

      return data;
    },
    retry: false,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
    staleTime: 60000 * 30, // 30 minutes
  });

  return {
    data,
    isLoading,
    isError,
  };
};
