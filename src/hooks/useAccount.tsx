import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";

import { QueryKeys } from "src/enums/graphql";
import {
  GQLSkylarkErrorResponse,
  GQLSkylarkAccountResponse,
} from "src/interfaces/skylark";
import { SkylarkAccount } from "src/interfaces/skylark/environment";
import { skylarkRequest } from "src/lib/graphql/skylark/client";
import { GET_ACCOUNT } from "src/lib/graphql/skylark/queries";

export const useAccount = () => {
  const { data, ...rest } = useQuery<
    GQLSkylarkAccountResponse,
    GQLSkylarkErrorResponse<GQLSkylarkAccountResponse>
  >({
    queryKey: [QueryKeys.Account, GET_ACCOUNT],
    queryFn: async () => skylarkRequest(GET_ACCOUNT),
  });

  const account = useMemo((): SkylarkAccount | undefined => {
    if (!data?.getAccount) {
      return;
    }
    return {
      accountId: data?.getAccount.account_id,
      skylarkVersion: data?.getAccount.skylark_version,
      defaultLanguage: data?.getAccount.config?.defaultLanguage,
    };
  }, [data]);

  return {
    ...rest,
    account,
  };
};
