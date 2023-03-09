import { useQuery } from "@tanstack/react-query";
import request from "graphql-request";
import { useEffect, useState } from "react";

import { LOCAL_STORAGE, REQUEST_HEADERS } from "src/constants/skylark";
import { GQLSkylarkObjectTypesResponse } from "src/interfaces/graphql/introspection";
import { SKYLARK_SCHEMA_INTROSPECTION_QUERY } from "src/lib/graphql/skylark/queries";

export const useConnectedToSkylark = () => {
  const [currentCreds, setCreds] = useState<{
    uri: string | null;
    token: string | null;
  }>({
    uri: null,
    token: null,
  });

  const { data, error, isError, isLoading, isSuccess, refetch } = useQuery<
    GQLSkylarkObjectTypesResponse,
    { response?: { errors?: { errorType?: string; message?: string }[] } }
  >({
    queryKey: [
      "credentialValidator",
      SKYLARK_SCHEMA_INTROSPECTION_QUERY,
      currentCreds.uri,
      currentCreds.token,
      REQUEST_HEADERS.apiKey,
    ],
    queryFn: currentCreds.uri
      ? async () =>
          request(
            currentCreds.uri ||
              localStorage.getItem(LOCAL_STORAGE.betaAuth.uri) ||
              "",
            SKYLARK_SCHEMA_INTROSPECTION_QUERY,
            {},
            {
              [REQUEST_HEADERS.apiKey]:
                currentCreds.token ||
                localStorage.getItem(LOCAL_STORAGE.betaAuth.token) ||
                "",
            },
          )
      : undefined,
    enabled: !!currentCreds.uri,
    retry: false,
    cacheTime: 0,
  });

  useEffect(() => {
    const refresh = () => {
      refetch();
      setCreds({
        uri: localStorage.getItem(LOCAL_STORAGE.betaAuth.uri),
        token: localStorage.getItem(LOCAL_STORAGE.betaAuth.token),
      });
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

  const isConnected = !!(
    !invalidUri &&
    !invalidToken &&
    (isLoading || isSuccess)
  );

  useEffect(() => {
    setCreds({
      uri: localStorage.getItem(LOCAL_STORAGE.betaAuth.uri),
      token: localStorage.getItem(LOCAL_STORAGE.betaAuth.token),
    });
  }, []);

  return {
    isLoading,
    isConnected,
    invalidUri,
    invalidToken,
    currentCreds,
    setCreds,
  };
};
