import {
  ApolloClient,
  ApolloClientOptions,
  createHttpLink,
  defaultDataIdFromObject,
  InMemoryCache,
  NormalizedCacheObject,
  StoreObject,
} from "@apollo/client";
import { setContext } from "@apollo/client/link/context";

import {
  SAAS_API_KEY,
  SAAS_API_ENDPOINT,
  LOCAL_STORAGE,
} from "src/constants/skylark";

export const createApolloClientDataIdFromSkylarkObject = (
  responseObject: Readonly<StoreObject>,
) => {
  if (Object.prototype.hasOwnProperty.call(responseObject, "uid")) {
    return `${responseObject.__typename}:${responseObject.uid}`;
  }
  return defaultDataIdFromObject(responseObject);
};

const httpLink = createHttpLink();

const authLink = setContext((_, { headers }) => {
  // get the authentication token from local storage if it exists
  const uri = localStorage.getItem(LOCAL_STORAGE.betaAuth.uri);
  const token = localStorage.getItem(LOCAL_STORAGE.betaAuth.token);

  console.log({ uri, token });

  // return the headers to the context so httpLink can read them
  return {
    uri: uri || SAAS_API_ENDPOINT,
    headers: {
      ...headers,
      "x-api-key": uri ? token || "" : "sdfsdf",
    },
  };
});

export const createSkylarkClient = () =>
  new ApolloClient({
    link: authLink.concat(httpLink),
    cache: new InMemoryCache({
      dataIdFromObject: createApolloClientDataIdFromSkylarkObject,
    }),
  });

export type SkylarkClient = ReturnType<typeof createSkylarkClient>;
