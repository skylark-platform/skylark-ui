import {
  ApolloClient,
  createHttpLink,
  defaultDataIdFromObject,
  InMemoryCache,
  StoreObject,
} from "@apollo/client";
import { setContext } from "@apollo/client/link/context";
import { offsetLimitPagination } from "@apollo/client/utilities";

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

export const skylarkClientCache = () =>
  new InMemoryCache({
    dataIdFromObject: createApolloClientDataIdFromSkylarkObject,
    typePolicies: {
      Query: {
        fields: {
          search: {
            keyArgs: ["query"],
            merge(existing, incoming) {
              if (!incoming) return existing;
              if (!existing) return incoming; // existing will be empty the first time

              const { objects, ...rest } = incoming;

              const result = rest;
              result.objects = [...existing.objects, ...objects]; // Merge existing items with the items from incoming

              return result;
            },
          },
        },
      },
    },
  });

export const createSkylarkClient = () =>
  new ApolloClient({
    link: authLink.concat(httpLink),
    cache: skylarkClientCache(),
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
