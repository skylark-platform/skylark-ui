import { useMutation, useQueryClient } from "@tanstack/react-query";
import { RequestDocument } from "graphql-request";

import { createGetAvailabilityObjectDimensionsKeyPrefix } from "src/hooks/availability/useAvailabilityObjectDimensions";
import { createGetAvailabilityObjectSegmentsKeyPrefix } from "src/hooks/availability/useAvailabilityObjectSegments";
import { createGetObjectKeyPrefix } from "src/hooks/objects/get/useGetObject";
import { useSkylarkObjectOperations } from "src/hooks/useSkylarkObjectTypes";
import {
  GQLSkylarkErrorResponse,
  GQLSkylarkGetObjectResponse,
  ModifiedAvailabilityDimensions,
  ModifiedAudienceSegments,
  SkylarkAvailabilityField,
} from "src/interfaces/skylark";
import { skylarkRequest } from "src/lib/graphql/skylark/client";
import { createUpdateAvailabilityDimensionsMutation } from "src/lib/graphql/skylark/dynamicMutations/objects";

interface MutationArgs {
  uid: string;
  modifiedAvailabilityDimensions: ModifiedAvailabilityDimensions | null;
  modifiedAudienceSegments: ModifiedAudienceSegments | null;
}

export const useUpdateObjectAvailabilityDimensionsAndSegments = ({
  objectType,
  onSuccess,
  onError,
}: {
  objectType: string;
  onSuccess: () => void;
  onError: (e: GQLSkylarkErrorResponse) => void;
}) => {
  const queryClient = useQueryClient();
  const { objectOperations } = useSkylarkObjectOperations(objectType);

  const { mutate, isPending } = useMutation({
    mutationFn: ({
      uid,
      modifiedAvailabilityDimensions,
      modifiedAudienceSegments,
    }: MutationArgs) => {
      const updateAvailabilityObjectDimensionsMutation =
        createUpdateAvailabilityDimensionsMutation(
          objectOperations,
          modifiedAvailabilityDimensions,
          modifiedAudienceSegments,
        );

      return skylarkRequest<{
        updateAvailabilityDimensionsAndSegments: {
          uid: string;
          dimension_breakdown: string;
        };
      }>(
        "mutation",
        updateAvailabilityObjectDimensionsMutation as RequestDocument,
        { uid },
      );
    },
    onSuccess: async (data, { uid }) => {
      await queryClient.refetchQueries({
        queryKey: createGetAvailabilityObjectDimensionsKeyPrefix({
          uid,
          objectType,
        }),
      });
      await queryClient.refetchQueries({
        queryKey: createGetAvailabilityObjectSegmentsKeyPrefix({
          uid,
          objectType,
        }),
      });

      await queryClient.setQueryData<GQLSkylarkGetObjectResponse>(
        createGetObjectKeyPrefix({ objectType, uid, language: null }),
        (oldData) => {
          if (oldData) {
            return {
              getObject: {
                ...oldData.getObject,
                [SkylarkAvailabilityField.DimensionBreakdown]:
                  data.updateAvailabilityDimensionsAndSegments
                    .dimension_breakdown,
              },
            };
          }
        },
      );

      onSuccess();
    },
    onError,
  });

  return {
    updateObjectAvailabilityDimensionsAndSegments: mutate,
    isUpdatingObjectAvailabilityDimensionsAndSegments: isPending,
  };
};
