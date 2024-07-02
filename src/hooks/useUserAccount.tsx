import { useQuery } from "@tanstack/react-query";

import { QueryKeys } from "src/enums/graphql";
import {
  GQLSkylarkErrorResponse,
  GQLSkylarkUserAndAccountResponse,
} from "src/interfaces/skylark";
import {
  SkylarkAccount,
  SkylarkUser,
} from "src/interfaces/skylark/environment";
import { skylarkRequest } from "src/lib/graphql/skylark/client";
import { GET_USER_AND_ACCOUNT } from "src/lib/graphql/skylark/queries";

type UseUserAccount = {
  accountId?: SkylarkAccount["accountId"];
  skylarkVersion?: SkylarkAccount["skylarkVersion"];
  defaultLanguage?: SkylarkAccount["defaultLanguage"];
  permissions?: SkylarkUser["permissions"];
  role?: SkylarkUser["role"];
};

const select = (data: GQLSkylarkUserAndAccountResponse): UseUserAccount => ({
  accountId: data?.getAccount.account_id || data.getUser.account,
  skylarkVersion: data?.getAccount.skylark_version,
  defaultLanguage: data?.getAccount.config?.default_language,
  permissions: data.getUser.permissions,
  role: data.getUser.role,
});

export const useUserAccount = () => {
  const { data, isLoading, isFetched } = useQuery<
    GQLSkylarkUserAndAccountResponse,
    GQLSkylarkErrorResponse<GQLSkylarkUserAndAccountResponse>,
    UseUserAccount
  >({
    queryKey: [QueryKeys.Account, GET_USER_AND_ACCOUNT],
    queryFn: async () => skylarkRequest("query", GET_USER_AND_ACCOUNT),
    select,
  });

  return {
    ...data,
    isLoading,
    isFetched,
  };
};
