import { useQuery } from "@tanstack/react-query";

import { QueryKeys } from "src/enums/graphql";
import { integrationServiceRequest } from "src/lib/integrationService/client";

// const integrationServiceMuxToken =
//   process.env.NEXT_PUBLIC_INTEGRATION_SERVICE_MUX_TOKEN ||
//   "b9fda8e2-4a4c-4f1e-a6a8-26cc8d36a823";

export const useGenerateMuxUploadUrl = (uid: string) => {
  const { data, isLoading } = useQuery({
    queryKey: [QueryKeys.Integrations, "mux", "uploadUrl", uid],
    queryFn: async () => {
      const data = await integrationServiceRequest<{ url: string }>(
        "/upload-url/video/mux",
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
