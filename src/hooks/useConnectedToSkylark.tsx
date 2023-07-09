import { useQuery } from "@tanstack/react-query";
import request from "graphql-request";
import { useEffect, useState } from "react";

import { LOCAL_STORAGE } from "src/constants/localStorage";
import {
  REQUEST_HEADERS,
  SAAS_API_ENDPOINT,
  SAAS_API_KEY,
} from "src/constants/skylark";
import { GQLSkylarkObjectTypesResponse } from "src/interfaces/graphql/introspection";
import { GET_SKYLARK_OBJECT_TYPES } from "src/lib/graphql/skylark/queries";

export interface SkylarkCreds {
  uri: string | null;
  token: string | null;
}

export const getSkylarkCredsFromLocalStorage = (
  withDevelopmentDefault?: boolean,
): SkylarkCreds => {
  if (typeof window === "undefined") {
    return {
      uri: null,
      token: null,
    };
  }

  let fallbackUri = null;
  let fallbackToken = null;

  if (withDevelopmentDefault) {
    const { origin } = window.location;
    // Timesaving in development to connect to sl-develop-10 when available unless in Storybook.
    const useDevelopmentDefaults =
      (origin.includes("http://localhost") &&
        !origin.includes("http://localhost:6006")) ||
      origin.includes("vercel.app");

    if (useDevelopmentDefaults) {
      fallbackUri = SAAS_API_ENDPOINT || null;
      fallbackToken = SAAS_API_KEY || null;
    }
  }

  const uri = localStorage.getItem(LOCAL_STORAGE.betaAuth.uri) || fallbackUri;
  const token =
    localStorage.getItem(LOCAL_STORAGE.betaAuth.token) || fallbackToken;

  return {
    uri,
    token,
  };
};

export const useConnectedToSkylark = () => {
  const [currentCreds, setCreds] = useState<SkylarkCreds>(
    getSkylarkCredsFromLocalStorage,
  );

  const { data, error, isError, isLoading, isSuccess, refetch } = useQuery<
    GQLSkylarkObjectTypesResponse,
    { response?: { errors?: { errorType?: string; message?: string }[] } }
  >({
    queryKey: [
      "credentialValidator",
      GET_SKYLARK_OBJECT_TYPES,
      currentCreds.uri,
      currentCreds.token,
    ],
    queryFn: currentCreds.uri
      ? async () => {
          const token =
            currentCreds.token ||
            localStorage.getItem(LOCAL_STORAGE.betaAuth.token) ||
            "";
          return request(
            currentCreds.uri ||
              localStorage.getItem(LOCAL_STORAGE.betaAuth.uri) ||
              "",
            GET_SKYLARK_OBJECT_TYPES,
            {},
            {
              [REQUEST_HEADERS.apiKey]: token,
              [REQUEST_HEADERS.bypassCache]: "1",
            },
          );
        }
      : undefined,
    enabled: !!currentCreds.uri,
    retry: false,
    cacheTime: 0,
  });

  useEffect(() => {
    const refresh = () => {
      refetch();
      setCreds(getSkylarkCredsFromLocalStorage());
    };
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener("storage", refresh);
    };
  }, [refetch]);

  const unauthenticated =
    error?.response?.errors?.[0]?.errorType === "UnauthorizedException";
  const invalidUri =
    !currentCreds.uri || (!data && isError && !unauthenticated);
  const invalidToken = invalidUri || (error && unauthenticated) || false;

  const isConnected =
    // Window check to prevent https://nextjs.org/docs/messages/react-hydration-error
    typeof window === "undefined" ||
    !!(!invalidUri && !invalidToken && (isLoading || isSuccess));

  return {
    isLoading,
    isConnected,
    invalidUri,
    invalidToken,
    currentCreds,
    setCreds,
  };
};
