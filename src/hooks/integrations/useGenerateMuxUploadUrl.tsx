import { useMutation, useQuery } from "@tanstack/react-query";

import { GQLSkylarkErrorResponse } from "src/interfaces/skylark";
import { integrationServiceRequest } from "src/lib/integrationService/client";

const integrationServiceMuxToken =
  process.env.NEXT_PUBLIC_INTEGRATION_SERVICE_MUX_TOKEN ||
  "b9fda8e2-4a4c-4f1e-a6a8-26cc8d36a823";

// export const useGenerateMuxUploadUrl = ({
//   onSuccess,
//   onError,
// }: {
//   onSuccess: () => void;
//   onError: (e: GQLSkylarkErrorResponse) => void;
// }) => {
//   const { mutate, isPending } = useMutation({
//     mutationFn: () => {
//       return integrationServiceRequest(
//         "/upload_url/video/mux",
//         integrationServiceMuxToken,
//       );
//     },
//     onSuccess,
//     onError,
//   });

//   return {
//     generateMuxUploadUrl: mutate,
//     isGenerating: isPending,
//   };
// };

export const useGenerateMuxUploadUrl = (uid: string) => {
  const { data, isLoading } = useQuery({
    queryKey: ["integrations", "mux", "uploadUrl", uid],
    queryFn: async () => {
      const request = await integrationServiceRequest(
        "/upload-url/video/mux",
        integrationServiceMuxToken,
        uid,
      );

      const response = (await request.json()) as { url: string };
      console.log({ response });
      return response.url;
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
