import { useQuery } from "@tanstack/react-query";
import request from "graphql-request";
import { useEffect, useState } from "react";

import { LOCAL_STORAGE, REQUEST_HEADERS } from "src/constants/skylark";
import { GQLSkylarkObjectTypesResponse } from "src/interfaces/graphql/introspection";
import { GET_SKYLARK_OBJECT_TYPES } from "src/lib/graphql/skylark/queries";

export const useConnectedToSkylark = () => {
  const [currentCreds, setCreds] = useState<{
    uri: string | null;
    token: string | null;
  }>({
    uri: null,
    token: null,
  });

  const {
    data,
    error,
    isError,
    isLoading: loading,
    refetch,
  } = useQuery<
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
    queryFn: currentCreds.uri
      ? async () =>
          request(
            currentCreds.uri || "",
            GET_SKYLARK_OBJECT_TYPES,
            {},
            {
              [REQUEST_HEADERS.apiKey]: currentCreds.token || "",
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

  const connected = !invalidUri && !invalidToken && data;

  useEffect(() => {
    setCreds({
      uri: localStorage.getItem(LOCAL_STORAGE.betaAuth.uri),
      token: localStorage.getItem(LOCAL_STORAGE.betaAuth.token),
    });
  }, []);

  return {
    loading,
    connected,
    invalidUri,
    invalidToken,
    currentCreds,
    setCreds,
  };
};
