import { useQuery } from "@tanstack/react-query";

import {
  IntegrationObjectInfo,
  IntegrationUploaderPlaybackPolicy,
  IntegrationUploaderProvider,
  createIntegrationServiceObj,
} from "src/components/integrations";
import { QueryKeys } from "src/enums/graphql";
import { IntegrationGenericUploadUrlResponseBody } from "src/interfaces/skylark/integrations";
import { integrationServiceRequest } from "src/lib/integrationService/client";

export const useGenerateIntegrationPlaybackUrl = (
  provider: IntegrationUploaderProvider | null,
  playbackPolicy: IntegrationUploaderPlaybackPolicy,
  hlsId: string | null,
) => {
  const { data, isLoading, isError, error } = useQuery({
    queryKey: [QueryKeys.Integrations, provider, "playbackUrl", hlsId],
    queryFn: async () => {
      const data = await integrationServiceRequest<{ playback_url: string }>(
        `/playback-url/video/${provider}`,
        {
          body: {
            playback_id: hlsId,
          },
          method: "POST",
        },
      );

      return data;
    },
    enabled:
      provider === "mux" && playbackPolicy !== "public" && Boolean(hlsId),
  });

  return {
    signedPlaybackUrl: data?.playback_url,
    isLoading,
    isError,
  };
};
