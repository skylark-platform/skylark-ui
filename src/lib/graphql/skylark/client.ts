import { ApolloClient, InMemoryCache } from "@apollo/client";

import {
  SAAS_API_KEY,
  SAAS_ACCOUNT_ID,
  SAAS_API_ENDPOINT,
} from "src/constants/skylark";

export const createSkylarkClient = () =>
  new ApolloClient({
    uri: SAAS_API_ENDPOINT,
    cache: new InMemoryCache(),
    headers: {
      "x-api-key": SAAS_API_KEY,
      "x-account-id": SAAS_ACCOUNT_ID,
    },
  });

export type SkylarkClient = ReturnType<typeof createSkylarkClient>;
