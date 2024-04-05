import { useQuery } from "@tanstack/react-query";

import { QueryKeys } from "src/enums/graphql";
import { IntegrationCloudinaryUploadUrlResponseBody } from "src/interfaces/skylark/integrations";
import { integrationServiceRequest } from "src/lib/integrationService/client";

export const useGenerateCloudinaryUploadUrl = (uid: string) => {
  const { data, isLoading } = useQuery({
    queryKey: [QueryKeys.Integrations, "cloudinary", "uploadUrl", uid],
    queryFn: async () => {
      const data =
        await integrationServiceRequest<IntegrationCloudinaryUploadUrlResponseBody>(
          "/upload-url/image/cloudinary",
          {
            body: {
              skylark_object_uid: uid,
            },
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
  };
};
