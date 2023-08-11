import { useQuery } from "@tanstack/react-query";

import { QueryKeys } from "src/enums/graphql";
import {
  GQLSkylarkErrorResponse,
  GQLSkylarkAccountResponse,
  GQLSkylarkUserResponse,
} from "src/interfaces/skylark";
import {
  SkylarkAccount,
  SkylarkUser,
} from "src/interfaces/skylark/environment";
import { skylarkRequest } from "src/lib/graphql/skylark/client";
import { GET_USER_AND_ACCOUNT } from "src/lib/graphql/skylark/queries";

type GQLSkylarkUserAndAccountResponse = GQLSkylarkAccountResponse &
  GQLSkylarkUserResponse;

const select = (
  data: GQLSkylarkUserAndAccountResponse,
): { account: SkylarkAccount; user: SkylarkUser } => ({
  account: {
    accountId: data?.getAccount.account_id,
    skylarkVersion: data?.getAccount.skylark_version,
    defaultLanguage: data?.getAccount.config?.default_language,
  },
  user: data.getUser,
});

export const useUserAccount = () => {
  const { data, isLoading } = useQuery<
    GQLSkylarkUserAndAccountResponse,
    GQLSkylarkErrorResponse<GQLSkylarkUserAndAccountResponse>,
    { account: SkylarkAccount; user: SkylarkUser }
  >({
    queryKey: [QueryKeys.Account, GET_USER_AND_ACCOUNT],
    queryFn: async () => skylarkRequest("query", GET_USER_AND_ACCOUNT),
    select,
  });

  return {
    account: data?.account,
    user: data?.user,
    isLoading,
  };
};
