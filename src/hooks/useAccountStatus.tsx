import { useQuery, useQueryClient } from "@tanstack/react-query";

import { refetchPanelQueries } from "src/components/panel/panel.lib";
import { QueryKeys } from "src/enums/graphql";
import {
  GQLSkylarkErrorResponse,
  GQLSkylarkStatusResponse,
} from "src/interfaces/skylark";
import {
  AccountStatus,
  ActivationStatus,
} from "src/interfaces/skylark/environment";
import { skylarkRequest } from "src/lib/graphql/skylark/client";
import { GET_ACCOUNT_STATUS } from "src/lib/graphql/skylark/queries";

const parseActivationStatus = (
  getActivationStatus: GQLSkylarkStatusResponse["getActivationStatus"],
) =>
  getActivationStatus
    ? {
        activeVersion: getActivationStatus.active_version,
        updateInProgress: getActivationStatus.update_in_progress,
        updateStartedAt: getActivationStatus.update_started_at,
      }
    : null;

const selectAllData = (data: GQLSkylarkStatusResponse): AccountStatus => ({
  activationStatus: parseActivationStatus(data.getActivationStatus),
  backgroundTasks: {
    queued: data.queuedBackgroundTasks.objects,
    inProgress: data.inProgressBackgroundTasks.objects,
    failed: data.failedBackgroundTasks.objects,
    hasQueued: data.queuedBackgroundTasks.objects.length > 0,
    hasInProgress: data.inProgressBackgroundTasks.objects.length > 0,
    hasFailed: data.failedBackgroundTasks.objects.length > 0,
  },
});

const selectActivationStatus = (
  data: GQLSkylarkStatusResponse,
): ActivationStatus | null => parseActivationStatus(data.getActivationStatus);

function useBackgroundTasksAndActivationStatus<T>(
  select: (data: GQLSkylarkStatusResponse) => T,
  {
    poll,
    backgroundTaskLimit,
  }: { poll?: boolean; backgroundTaskLimit: number },
) {
  const { data, error, isLoading, isError } = useQuery<
    GQLSkylarkStatusResponse,
    GQLSkylarkErrorResponse,
    T
  >({
    queryKey: [
      QueryKeys.AccountStatus,
      GET_ACCOUNT_STATUS,
      backgroundTaskLimit,
    ],
    queryFn: async () =>
      skylarkRequest("query", GET_ACCOUNT_STATUS, { backgroundTaskLimit }),
    select,
    refetchInterval: poll ? 5000 : false,
  });

  return {
    data,
    error,
    isLoading,
    isError,
  };
}

export const useActivationStatus = () => {
  const { data, isLoading } = useBackgroundTasksAndActivationStatus(
    selectActivationStatus,
    {
      backgroundTaskLimit: 0,
    },
  );

  return {
    isLoading,
    activationStatus: data,
  };
};

export const useAccountStatus = ({
  poll,
  refetchQueries,
}: {
  poll?: boolean;
  refetchQueries?: boolean;
}) => {
  const client = useQueryClient();

  const { data, error, isLoading, isError } =
    useBackgroundTasksAndActivationStatus<AccountStatus>(selectAllData, {
      poll,
      backgroundTaskLimit: 100,
    });

  const isUnauthenticated =
    error?.response?.errors?.[0]?.errorType === "UnauthorizedException";

  const userNeedsSelfConfigPermissions = error?.response?.errors?.[0]?.message
    .toLowerCase()
    .startsWith("forbidden: requires self_config permissions");

  const isConnected =
    userNeedsSelfConfigPermissions || (!isError && !isUnauthenticated);

  if (refetchQueries && data?.backgroundTasks.inProgress) {
    data.backgroundTasks.inProgress.map(({ object_uid }) => {
      // Intermediary step before we have webhook notifications
      void refetchPanelQueries(client, object_uid);
      setTimeout(() => void refetchPanelQueries(client, object_uid), 10000);
    });
  }

  return {
    isLoading,
    isConnected,
    userNeedsSelfConfigPermissions,
    ...data,
  };
};
