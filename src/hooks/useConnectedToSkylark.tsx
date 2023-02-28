import {
  ApolloClient,
  NormalizedCacheObject,
  useQuery,
  ServerError,
} from "@apollo/client";
import { useEffect, useState } from "react";

import { LOCAL_STORAGE } from "src/constants/skylark";
import { GET_SKYLARK_OBJECT_TYPES } from "src/lib/graphql/skylark/queries";

export const useConnectedToSkylark = () => {
  const [validatorClient, setValidatorClient] = useState<
    ApolloClient<NormalizedCacheObject> | undefined
  >(undefined);

  const { data, error, loading, refetch } = useQuery(GET_SKYLARK_OBJECT_TYPES, {
    client: validatorClient,
    fetchPolicy: "no-cache",
  });

  const [currentCreds, setCreds] = useState<{
    uri: string | null;
    token: string | null;
  }>({
    uri: null,
    token: null,
  });

  useEffect(() => {
    const refresh = () => {
      refetch({});
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
    error?.networkError?.name === "ServerError" &&
    (error.networkError as ServerError).statusCode === 401;
  const invalidUri = !data && (!error || !unauthenticated);
  const invalidToken = invalidUri || (error && unauthenticated) || false;

  const connected = !invalidUri && !invalidToken && data;

  useEffect(() => {
    if (connected) {
      setCreds({
        uri: localStorage.getItem(LOCAL_STORAGE.betaAuth.uri),
        token: localStorage.getItem(LOCAL_STORAGE.betaAuth.token),
      });
    }
  }, [connected]);

  return {
    loading,
    connected,
    invalidUri,
    invalidToken,
    currentCreds,
    setValidatorClient,
  };
};
