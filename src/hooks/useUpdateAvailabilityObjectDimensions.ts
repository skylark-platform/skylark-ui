import { useMutation, useQueryClient } from "@tanstack/react-query";
import { RequestDocument } from "graphql-request";

import {
  BuiltInSkylarkObjectType,
  GQLSkylarkUpdateObjectContentResponse,
  ParsedSkylarkObjectContent,
  ParsedSkylarkObjectContentObject,
  SkylarkObjectType,
} from "src/interfaces/skylark";
import { skylarkRequest } from "src/lib/graphql/skylark/client";
import { createUpdateObjectContentMutation } from "src/lib/graphql/skylark/dynamicMutations";
import { parseObjectContent } from "src/lib/skylark/parsers";

import { createGetAvailabilityObjectDimensionsKeyPrefix } from "./availability/useAvailabilityObjectDimensions";
import { createGetObjectKeyPrefix } from "./useGetObject";
import {
  useAllObjectsMeta,
  useSkylarkObjectOperations,
} from "./useSkylarkObjectTypes";

export const useUpdateAvailabilityObjectDimensions = ({
  uid,
  originalAvailabilityDimensions,
  updatedAvailabilityDimensions,
  onSuccess,
}: {
  uid: string;
  originalAvailabilityDimensions: Record<string, string[]>;
  updatedAvailabilityDimensions: Record<string, string[]>;
  onSuccess: () => void;
}) => {
  const queryClient = useQueryClient();
  const { objectOperations } = useSkylarkObjectOperations(
    BuiltInSkylarkObjectType.Availability,
  );
  const { objects } = useAllObjectsMeta(false);

  // const { mutate, ...rest } = useMutation({
  //   mutationFn: ({ uid }: { uid: string }) => {
  //     return skylarkRequest<GQLSkylarkUpdateObjectContentResponse>(
  //       updateObjectContentMutation as RequestDocument,
  //       { uid },
  //     );
  //   },
  //   onSuccess: (data, { uid }) => {
  //     queryClient.invalidateQueries({
  //       queryKey: createGetAvailabilityObjectDimensionsKeyPrefix({ uid }),
  //     });

  //     onSuccess();
  //   },
  // });

  // const updateObjectContent = () => mutate({ uid });

  // return {
  //   updateObjectContent,
  //   ...rest,
  // };
};
