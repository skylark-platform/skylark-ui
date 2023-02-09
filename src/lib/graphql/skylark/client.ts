import {
  ApolloClient,
  createHttpLink,
  defaultDataIdFromObject,
  InMemoryCache,
  StoreObject,
} from "@apollo/client";
import { setContext } from "@apollo/client/link/context";

import {
  SAAS_API_ENDPOINT,
  LOCAL_STORAGE,
  REQUEST_HEADERS,
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

export const authLink = setContext((_, { headers }) => {
  // get the authentication token from local storage if it exists
  const uri = localStorage.getItem(LOCAL_STORAGE.betaAuth.uri);
  const token = localStorage.getItem(LOCAL_STORAGE.betaAuth.token);

  // return the headers to the context so httpLink can read them
  // In Beta, only set the token when we have a URI so that Apollo Client fires a failing request when the URI is invalid/missing
  // It's hacky. Apollo Client doesn't make a request when the URI is invalid
  return {
    uri: uri || SAAS_API_ENDPOINT,
    headers: {
      ...headers,
      [REQUEST_HEADERS.apiKey]: uri ? token || "" : "",
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

export const createBasicSkylarkClient = (uri: string, token: string) =>
  new ApolloClient({
    uri,
    headers: {
      [REQUEST_HEADERS.apiKey]: token,
    },
    cache: new InMemoryCache({
      dataIdFromObject: createApolloClientDataIdFromSkylarkObject,
    }),
  });

export type SkylarkClient =
  | ReturnType<typeof createSkylarkClient>
  | ApolloClient<object>;
