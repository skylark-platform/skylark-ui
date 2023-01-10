import {
  ApolloClient,
  defaultDataIdFromObject,
  InMemoryCache,
  StoreObject,
} from "@apollo/client";

import { SAAS_API_KEY, SAAS_API_ENDPOINT } from "src/constants/skylark";

export const createApolloClientDataIdFromSkylarkObject = (
  responseObject: Readonly<StoreObject>,
) => {
  if (Object.prototype.hasOwnProperty.call(responseObject, "uid")) {
    return `${responseObject.__typename}:${responseObject.uid}`;
  }
  return defaultDataIdFromObject(responseObject);
};

export const createSkylarkClient = () =>
  new ApolloClient({
    uri: SAAS_API_ENDPOINT,
    cache: new InMemoryCache({
      dataIdFromObject: createApolloClientDataIdFromSkylarkObject,
    }),
    headers: {
      "x-api-key": SAAS_API_KEY,
    },
  });

export type SkylarkClient = ReturnType<typeof createSkylarkClient>;
