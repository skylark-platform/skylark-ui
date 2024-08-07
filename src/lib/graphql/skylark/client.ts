import { QueryClient } from "@tanstack/react-query";
import {
  GraphQLClient,
  RequestDocument,
  Variables,
  request,
} from "graphql-request";

import { LOCAL_STORAGE } from "src/constants/localStorage";
import { SAAS_API_ENDPOINT, REQUEST_HEADERS } from "src/constants/skylark";
import { SkylarkCreds } from "src/hooks/useConnectedToSkylark";

interface SkylarkRequestOpts {
  useCache?: boolean;
  noDraftHeader?: boolean;
}

export const createSkylarkClient = (uri: string, token: string) =>
  new GraphQLClient(uri, {
    headers: {
      [REQUEST_HEADERS.apiKey]: token,
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
  type: "query" | "mutation",
  query: RequestDocument | string,
  variables?: Variables,
  opts?: SkylarkRequestOpts,
  argHeaders?: HeadersInit,
) => {
  // get the authentication token from local storage if it exists
  const localStorageCreds = localStorage.getItem(LOCAL_STORAGE.auth.active);
  const { uri, token }: SkylarkCreds = localStorageCreds
    ? JSON.parse(localStorageCreds)
    : { uri: "", token: "" };

  const tokenToSend = uri ? token || "" : "";

  const headers: HeadersInit = {
    [REQUEST_HEADERS.apiKey]: tokenToSend,
    "x-api-v2": "true",
    ...argHeaders,
  };

  const bypassCache =
    typeof opts?.useCache === "undefined"
      ? type !== "mutation"
      : !opts.useCache;

  if (bypassCache) {
    headers[REQUEST_HEADERS.bypassCache as keyof HeadersInit] = "1";
  }

  if (type === "query" && !opts?.noDraftHeader) {
    headers[REQUEST_HEADERS.draft as keyof HeadersInit] = "true";
  }

  return request<T>(uri || SAAS_API_ENDPOINT, query, variables, headers);
};
