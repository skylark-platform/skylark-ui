import { QueryClient } from "@tanstack/react-query";
import { GraphQLClient, RequestDocument, request } from "graphql-request";

import { LOCAL_STORAGE } from "src/constants/localStorage";
import { SAAS_API_ENDPOINT, REQUEST_HEADERS } from "src/constants/skylark";

interface SkylarkRequestOpts {
  useCache?: boolean;
}

export const createSkylarkClient = (uri: string, token: string) =>
  new GraphQLClient(uri, {
    headers: {
      [REQUEST_HEADERS.apiKey]: token,
      [REQUEST_HEADERS.betaApiKey]: token,
    },
  });

export const createSkylarkReactQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        retry: 1,
      },
    },
  });

export const skylarkRequest = <T>(
  query: RequestDocument | string,
  variables?: object,
  opts?: SkylarkRequestOpts,
) => {
  // get the authentication token from local storage if it exists
  const uri = localStorage.getItem(LOCAL_STORAGE.betaAuth.uri);
  const token = localStorage.getItem(LOCAL_STORAGE.betaAuth.token);

  // return the headers to the context so httpLink can read them
  // In Beta, only set the token when we have a URI so that it fires a failing request when the URI is invalid/missing
  const tokenToSend = uri ? token || "" : "";

  const headers: HeadersInit = {
    [REQUEST_HEADERS.apiKey]: tokenToSend,
    [REQUEST_HEADERS.betaApiKey]: tokenToSend,
  };

  if (!opts?.useCache) {
    headers[REQUEST_HEADERS.bypassCache] = "1";
  }

  return request<T>(uri || SAAS_API_ENDPOINT, query, variables, headers);
};
