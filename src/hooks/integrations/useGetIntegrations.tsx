import { useQuery } from "@tanstack/react-query";
import { useCallback } from "react";

import {
  IntegrationUploadType,
  IntegrationUploaderPlaybackPolicy,
  IntegrationUploaderProvider,
  supportedIntegrations,
} from "src/components/integrations";
import { QueryKeys } from "src/enums/graphql";
import { integrationServiceRequest } from "src/lib/integrationService/client";

interface IntegrationInfo {
  created: string;
  enabled: boolean;
  modified: string;
  token: string;
  custom?: {
    default_playback_policy?: IntegrationUploaderPlaybackPolicy;
    signing_key_id?: string;
  };
}

type GetIntegrationsResponse = Record<
  IntegrationUploadType,
  Record<IntegrationUploaderProvider, IntegrationInfo>
>;

export const useGetIntegrations = (type: IntegrationUploadType) => {
  const select = useCallback(
    (data: GetIntegrationsResponse) => {
      const integrations = data[type];
      const supported = supportedIntegrations[type];
      const enabledIntegrations: IntegrationUploaderProvider[] = Object.entries(
        integrations,
      )
        .filter(
          ([name, { enabled }]) =>
            enabled && supported?.[name as IntegrationUploaderProvider],
        )
        .map(([name]) => name as IntegrationUploaderProvider);

      return {
        integrations,
        enabledIntegrations,
      };
    },
    [type],
  );

  const { data, isLoading } = useQuery<
    GetIntegrationsResponse,
    unknown,
    {
      integrations: Record<IntegrationUploaderProvider, IntegrationInfo>;
      enabledIntegrations: IntegrationUploaderProvider[];
    }
  >({
    queryKey: [QueryKeys.Integrations],
    queryFn: async () => {
      const data = await integrationServiceRequest<GetIntegrationsResponse>(
        "/",
        {},
      );
      return data;
    },
    select,
  });

  return {
    data,
    isLoading,
  };
};
