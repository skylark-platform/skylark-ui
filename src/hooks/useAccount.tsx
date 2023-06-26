import { useQuery } from "@tanstack/react-query";

import { QueryKeys } from "src/enums/graphql";
import {
  GQLSkylarkErrorResponse,
  GQLSkylarkAccountResponse,
} from "src/interfaces/skylark";
import { SkylarkAccount } from "src/interfaces/skylark/environment";
import { skylarkRequest } from "src/lib/graphql/skylark/client";
import { GET_ACCOUNT } from "src/lib/graphql/skylark/queries";

const select = (data: GQLSkylarkAccountResponse): SkylarkAccount => ({
  accountId: data?.getAccount.account_id,
  skylarkVersion: data?.getAccount.skylark_version,
  defaultLanguage: data?.getAccount.config?.default_language,
});

export const useAccount = () => {
  const { data: account, isLoading } = useQuery<
    GQLSkylarkAccountResponse,
    GQLSkylarkErrorResponse<GQLSkylarkAccountResponse>,
    SkylarkAccount
  >({
    queryKey: [QueryKeys.Account, GET_ACCOUNT],
    queryFn: async () => skylarkRequest(GET_ACCOUNT),
    select,
  });

  return {
    account,
    isLoading,
  };
};
