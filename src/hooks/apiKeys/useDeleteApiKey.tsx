import { useMutation, useQueryClient } from "@tanstack/react-query";

import { QueryKeys } from "src/enums/graphql";
import {
  GQLSkylarkCreateAPIKeyResponse,
  GQLSkylarkErrorResponse,
} from "src/interfaces/skylark";
import { skylarkRequest } from "src/lib/graphql/skylark/client";
import { DELETE_API_KEY } from "src/lib/graphql/skylark/mutations";

export const useDeleteApiKey = ({
  onSuccess,
  onError,
}: {
  onSuccess: (name: string) => void;
  onError: (e: GQLSkylarkErrorResponse) => void;
}) => {
  const queryClient = useQueryClient();

  const { mutate, isPending } = useMutation({
    mutationFn: (name: string) => {
      return skylarkRequest<GQLSkylarkCreateAPIKeyResponse>(
        "mutation",
        DELETE_API_KEY,
        { name },
      );
    },
    onSuccess: async (_, name) => {
      onSuccess(name);
      queryClient.refetchQueries({ queryKey: [QueryKeys.ApiKeys] });
    },
    onError,
  });

  return {
    deleteApiKey: mutate,
    isPending,
  };
};
