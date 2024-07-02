import { useQuery } from "@tanstack/react-query";
import request from "graphql-request";
import { useEffect, useMemo, useState } from "react";

import { REQUEST_HEADERS } from "src/constants/skylark";
import { GQLSkylarkObjectTypesResponse } from "src/interfaces/graphql/introspection";
import { GET_SKYLARK_OBJECT_TYPES } from "src/lib/graphql/skylark/queries";

import { useSkylarkCreds } from "./localStorage/useCreds";

export interface SkylarkCreds {
  uri: string;
  token: string;
}

export const useConnectedToSkylark = () => {
  const [overrideCreds, setOverrideCreds] = useState<SkylarkCreds | null>(null);

  const [localStorageCreds] = useSkylarkCreds();

  const currentCreds: SkylarkCreds = useMemo(
    () =>
      overrideCreds ||
      localStorageCreds || {
        uri: "",
        token: "",
      },
    [localStorageCreds, overrideCreds],
  );

  const hasCreds = Boolean(currentCreds.uri && currentCreds.token);

  const { data, error, isError, isLoading, isSuccess, refetch } = useQuery<
    GQLSkylarkObjectTypesResponse,
    { response?: { errors?: { errorType?: string; message?: string }[] } }
  >({
    queryKey: ["credentialValidator", currentCreds.uri, currentCreds.token],
    queryFn: () => {
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
    enabled: hasCreds,
    retry: false,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    staleTime: 5000,
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
    error,
    isError,
    setCreds: setOverrideCreds,
  };
};
