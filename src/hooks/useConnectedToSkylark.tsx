import {
  ApolloClient,
  NormalizedCacheObject,
  useQuery,
  ServerError,
} from "@apollo/client";
import { useEffect, useState } from "react";

import { GET_SKYLARK_OBJECT_TYPES } from "src/lib/graphql/skylark/queries";

export const useConnectedToSkylark = () => {
  const [validatorClient, setValidatorClient] = useState<
    ApolloClient<NormalizedCacheObject> | undefined
  >(undefined);

  const { data, error, loading, refetch } = useQuery(GET_SKYLARK_OBJECT_TYPES, {
    client: validatorClient,
    fetchPolicy: "no-cache",
  });

  useEffect(() => {
    const refresh = () => refetch({});
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

  return {
    loading,
    connected: !invalidUri && !invalidToken && data,
    invalidUri,
    invalidToken,
    setValidatorClient,
  };
};
