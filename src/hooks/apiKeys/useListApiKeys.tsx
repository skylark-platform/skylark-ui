import { useQuery } from "@tanstack/react-query";

import { QueryKeys } from "src/enums/graphql";
import {
  GQLSkylarkErrorResponse,
  GQLSkylarkListAPIKeysResponse,
} from "src/interfaces/skylark";
import { skylarkRequest } from "src/lib/graphql/skylark/client";
import { LIST_API_KEYS } from "src/lib/graphql/skylark/queries";

const select = (data: GQLSkylarkListAPIKeysResponse) => data.listApiKeys;

export const useListApiKeys = () => {
  const { data, error, isLoading, isError } = useQuery<
    GQLSkylarkListAPIKeysResponse,
    GQLSkylarkErrorResponse<GQLSkylarkListAPIKeysResponse>,
    GQLSkylarkListAPIKeysResponse["listApiKeys"]
  >({
    queryKey: [QueryKeys.ApiKeys],
    queryFn: async () => skylarkRequest("query", LIST_API_KEYS),
    select,
  });

  return {
    error,
    data,
    isLoading,
    isError,
  };
};
