import { useQuery } from "@tanstack/react-query";

import {
  IntegrationObjectInfo,
  IntegrationUploaderPlaybackPolicy,
  createIntegrationServiceObj,
} from "src/components/integrations";
import { QueryKeys } from "src/enums/graphql";
import { IntegrationGenericUploadUrlResponseBody } from "src/interfaces/skylark/integrations";
import { integrationServiceRequest } from "src/lib/integrationService/client";

export const useGenerateMuxUploadUrl = ({
  uid,
  objectType,
  relationshipName,
  playbackPolicy,
}: IntegrationObjectInfo & {
  playbackPolicy: IntegrationUploaderPlaybackPolicy;
}) => {
  const { data, isLoading, isError, error } = useQuery({
    queryKey: [
      QueryKeys.Integrations,
      "mux",
      "uploadUrl",
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

      const data =
        await integrationServiceRequest<IntegrationGenericUploadUrlResponseBody>(
          "/upload-url/video/mux",
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
