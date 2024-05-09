import {
  QueryClient,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import { useCallback } from "react";

import { QueryKeys } from "src/enums/graphql";
import {
  GQLSkylarkCreateAPIKeyResponse,
  GQLSkylarkErrorResponse,
  SkylarkGraphQLAPIKey,
} from "src/interfaces/skylark";
import { skylarkRequest } from "src/lib/graphql/skylark/client";
import {
  CREATE_API_KEY,
  UPDATE_API_KEY,
} from "src/lib/graphql/skylark/mutations";

type ApiKeyInput = Omit<SkylarkGraphQLAPIKey, "api_key">;

const transformDate = (date: SkylarkGraphQLAPIKey["expires"]) =>
  !date || date?.endsWith("Z") ? date : `${date}Z`;

export const useCreateOrUpdateApiKey = ({
  onSuccess,
  onError,
}: {
  onSuccess: (apiKey: SkylarkGraphQLAPIKey) => void;
  onError: (e: GQLSkylarkErrorResponse) => void;
}) => {
  const queryClient = useQueryClient();

  const { mutate, isPending } = useMutation({
    mutationFn: ({
      type,
      apiKey,
    }: {
      type: "create" | "update";
      apiKey: ApiKeyInput;
    }) => {
      return skylarkRequest<GQLSkylarkCreateAPIKeyResponse>(
        "mutation",
        type === "create" ? CREATE_API_KEY : UPDATE_API_KEY,
        type === "create"
          ? { apiKey }
          : {
              name: apiKey.name,
              apiKey: {
                active: apiKey.active,
                expires: apiKey.expires,
                permissions: apiKey.permissions,
              },
            },
      );
    },
    onSuccess: async (data, { apiKey }) => {
      onSuccess({ ...apiKey, ...data.createApiKey });
      queryClient.refetchQueries({ queryKey: [QueryKeys.ApiKeys] });
    },
    onError,
  });

  const createApiKey = useCallback(
    (apiKey: Omit<ApiKeyInput, "active">) =>
      mutate({
        type: "create",
        apiKey: {
          ...apiKey,
          active: true,
          expires: transformDate(apiKey.expires),
        },
      }),
    [mutate],
  );
  const updateApiKey = useCallback(
    (apiKey: ApiKeyInput) => {
      return mutate({
        type: "update",
        apiKey: {
          ...apiKey,
          expires: transformDate(apiKey.expires),
        },
      });
    },
    [mutate],
  );

  return {
    createApiKey,
    updateApiKey,
    isPending,
  };
};
