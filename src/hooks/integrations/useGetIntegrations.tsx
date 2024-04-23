import { useQuery } from "@tanstack/react-query";
import { useCallback } from "react";

import {
  IntegrationUploadType,
  IntegrationUploaderProvider,
  supportedIntegrations,
} from "src/components/integrations";
import { QueryKeys } from "src/enums/graphql";
import { integrationServiceRequest } from "src/lib/integrationService/client";

type GetIntegrationsResponse = Record<
  IntegrationUploadType,
  Record<
    IntegrationUploaderProvider,
    {
      created: string;
      enabled: boolean;
      modified: string;
      token: string;
    }
  >
>;

export const useGetIntegrations = (type: IntegrationUploadType) => {
  const { data, isLoading } = useQuery({
    queryKey: [QueryKeys.Integrations],
    queryFn: async () => {
      const data = await integrationServiceRequest<GetIntegrationsResponse>(
        "/",
        {},
      );
      return data;
    },
    select: useCallback(
      (data: GetIntegrationsResponse) => {
        const integrations = data[type];
        const supported = supportedIntegrations[type];
        const enabledIntegrations: IntegrationUploaderProvider[] =
          Object.entries(integrations)
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
    ),
  });

  return {
    data,
    isLoading,
  };
};
