import { useQuery } from "@tanstack/react-query";

import {
  IntegrationObjectInfo,
  IntegrationUploadType,
  IntegrationUploaderPlaybackPolicy,
  IntegrationUploaderProvider,
  createIntegrationServiceObj,
} from "src/components/integrations";
import { QueryKeys } from "src/enums/graphql";
import { IntegrationGenericUploadUrlResponseBody } from "src/interfaces/skylark/integrations";
import { integrationServiceRequest } from "src/lib/integrationService/client";

export const createIntegrationUploadQueryKeyBase = (
  type: IntegrationUploadType,
  provider: IntegrationUploaderProvider,
) => [QueryKeys.Integrations, QueryKeys.IntegrationsUploadUrl, type, provider];

export const useGenerateIntegrationUploadUrl = <
  ResponseBody = IntegrationGenericUploadUrlResponseBody,
>(
  type: IntegrationUploadType,
  provider: IntegrationUploaderProvider,
  {
    uid,
    objectType,
    relationshipName,
    playbackPolicy,
  }: IntegrationObjectInfo & {
    playbackPolicy?: IntegrationUploaderPlaybackPolicy;
  },
) => {
  const { data, isLoading, isError } = useQuery({
    queryKey: [
      ...createIntegrationUploadQueryKeyBase(type, provider),
      uid,
      objectType,
      relationshipName,
      playbackPolicy,
    ],
    queryFn: async () => {
      const body = createIntegrationServiceObj(
        {
          uid,
          objectType,
          relationshipName,
        },
        playbackPolicy,
      );

      const data = await integrationServiceRequest<ResponseBody>(
        `/upload-url/${type}/${provider}`,
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
