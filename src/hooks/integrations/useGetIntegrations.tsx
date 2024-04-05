import { useQuery } from "@tanstack/react-query";

import { QueryKeys } from "src/enums/graphql";
import { integrationServiceRequest } from "src/lib/integrationService/client";

interface GetIntegrationsResponse {
  videos: [];
  images: [];
}

export const useGetIntegrations = () => {
  const { data, isLoading, error } = useQuery({
    queryKey: [QueryKeys.Integrations],
    queryFn: async () => {
      const data = await integrationServiceRequest("/video", {});
      return data;
    },
  });

  console.log({ data, error });

  return {
    data,
    isLoading,
  };
};
