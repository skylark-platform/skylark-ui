import { useQuery } from "@tanstack/react-query";

import { QueryKeys } from "src/enums/graphql";
import { integrationServiceRequest } from "src/lib/integrationService/client";

export const useGenerateCloudinaryUploadUrl = (uid: string) => {
  const { data, isLoading } = useQuery({
    queryKey: [QueryKeys.Integrations, "cloudinary", "uploadUrl", uid],
    queryFn: async () => {
      const data = await integrationServiceRequest<{ url: string }>(
        "/upload-url/video/cloudinary",
        {
          body: {
            asset_uid: uid,
          },
          method: "POST",
        },
      );

      return data.url;
    },
    retry: false,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchOnReconnect: false,
    staleTime: 60000 * 30, // 30 minutes
  });

  return {
    muxUploadUrl: data,
    isGeneratingMuxUploadUrl: isLoading,
  };
};
