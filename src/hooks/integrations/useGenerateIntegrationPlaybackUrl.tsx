import { useQuery } from "@tanstack/react-query";

import {
  IntegrationUploaderPlaybackPolicy,
  IntegrationUploaderProvider,
} from "src/components/integrations";
import { QueryKeys } from "src/enums/graphql";
import { integrationServiceRequest } from "src/lib/integrationService/client";

export const useGenerateIntegrationPlaybackUrl = (
  provider: IntegrationUploaderProvider | null,
  playbackPolicy: IntegrationUploaderPlaybackPolicy,
  hlsId: string | null,
) => {
  const { data, isLoading, isError } = useQuery({
    queryKey: [
      QueryKeys.Integrations,
      QueryKeys.IntegrationsPlaybackUrl,
      provider,
      hlsId,
    ],
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
    retry: false,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
  });

  return {
    signedPlaybackUrl: data?.playback_url,
    isLoading,
    isError,
  };
};
