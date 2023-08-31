import { useQuery } from "@tanstack/react-query";
import request from "graphql-request";
import { useCallback, useEffect, useState } from "react";

import { LOCAL_STORAGE } from "src/constants/localStorage";
import {
  REQUEST_HEADERS,
  SAAS_API_ENDPOINT,
  SAAS_API_KEY,
} from "src/constants/skylark";
import { QueryKeys } from "src/enums/graphql";
import { GQLSkylarkObjectTypesResponse } from "src/interfaces/graphql/introspection";
import {
  GQLSkylarkActivationStatusResponse,
  GQLSkylarkBackgroundTask,
  GQLSkylarkErrorResponse,
  GQLSkylarkStatusResponse,
} from "src/interfaces/skylark";
import { AccountStatus } from "src/interfaces/skylark/environment";
import { skylarkRequest } from "src/lib/graphql/skylark/client";
import { GET_ACCOUNT_STATUS } from "src/lib/graphql/skylark/queries";

export const useAccountStatus = (poll?: boolean) => {
  const { data, error, isLoading, isError } = useQuery<
    GQLSkylarkStatusResponse,
    GQLSkylarkErrorResponse,
    AccountStatus
  >({
    queryKey: [QueryKeys.AccountStatus, GET_ACCOUNT_STATUS],
    queryFn: async () =>
      skylarkRequest("query", GET_ACCOUNT_STATUS, { backgroundTaskLimit: 50 }),
    select: useCallback(
      (data: GQLSkylarkStatusResponse): AccountStatus => ({
        activationStatus: data.getActivationStatus,
        backgroundTasks: {
          queued: data.queuedBackgroundTasks.objects,
          inProgress: data.queuedBackgroundTasks.objects,
          failed: data.failedBackgroundTasks.objects,
          hasQueued: data.queuedBackgroundTasks.objects.length > 0,
          hasInProgress: data.inProgressBackgroundTasks.objects.length > 0,
          hasFailed: data.failedBackgroundTasks.objects.length > 0,
        },
      }),
      [],
    ),
    refetchInterval: poll ? 10000 : false,
  });

  const isUnauthenticated =
    error?.response?.errors?.[0]?.errorType === "UnauthorizedException";

  return {
    isLoading,
    isConnected: !isError && !isUnauthenticated,
    ...data,
  };
};
