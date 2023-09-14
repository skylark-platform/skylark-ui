import { useQuery } from "@tanstack/react-query";
import request from "graphql-request";
import { useEffect, useState } from "react";
import { useReadLocalStorage } from "usehooks-ts";

import { LOCAL_STORAGE } from "src/constants/localStorage";
import {
  REQUEST_HEADERS,
  SAAS_API_ENDPOINT,
  SAAS_API_KEY,
} from "src/constants/skylark";
import { GQLSkylarkObjectTypesResponse } from "src/interfaces/graphql/introspection";
import { GET_SKYLARK_OBJECT_TYPES } from "src/lib/graphql/skylark/queries";

import { useSkylarkCreds } from "./localStorage/useCreds";

export interface SkylarkCreds {
  uri: string;
  token: string;
}

/**
 * 
 * @returns   if (withDevelopmentDefault) {
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
 */

export const useConnectedToSkylark = () => {
  const [overrideCreds, setOverrideCreds] = useState<SkylarkCreds | null>(null);

  const [localStorageCreds] = useSkylarkCreds();

  const currentCreds: SkylarkCreds = overrideCreds ||
    localStorageCreds || {
      uri: "",
      token: "",
    };

  const { data, error, isError, isLoading, isSuccess, refetch } = useQuery<
    GQLSkylarkObjectTypesResponse,
    { response?: { errors?: { errorType?: string; message?: string }[] } }
  >({
    queryKey: [
      "credentialValidator",
      GET_SKYLARK_OBJECT_TYPES,
      currentCreds.uri,
      currentCreds.token,
      REQUEST_HEADERS.apiKey,
    ],
    queryFn: async () => {
      return request(
        currentCreds.uri || "",
        GET_SKYLARK_OBJECT_TYPES,
        {},
        {
          [REQUEST_HEADERS.apiKey]: currentCreds.token || "",
          [REQUEST_HEADERS.bypassCache]: "1",
        },
      );
    },
    enabled: Boolean(currentCreds.uri && currentCreds.token),
    retry: false,
    cacheTime: 0,
  });

  useEffect(() => {
    // Reset if storage changes in another tab

    const refresh = () => {
      refetch();
      setOverrideCreds(null);
    };

    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener("storage", refresh);
    };
  }, [refetch]);

  const unauthenticated =
    error?.response?.errors?.[0]?.errorType === "UnauthorizedException";
  const invalidUri =
    !currentCreds?.uri || (!data && isError && !unauthenticated);
  const invalidToken = invalidUri || (error && unauthenticated) || false;

  const isConnected =
    currentCreds === null ||
    !!(!invalidUri && !invalidToken && (isLoading || isSuccess));

  return {
    isLoading,
    isConnected,
    invalidUri,
    invalidToken,
    currentCreds,
    setCreds: setOverrideCreds,
  };
};
