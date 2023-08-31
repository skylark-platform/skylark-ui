import clsx from "clsx";
import { CgSpinner } from "react-icons/cg";

import { useAccountStatus } from "src/hooks/useAccountStatus";
import {
  BackgroundTaskType,
  GQLSkylarkBackgroundTask,
} from "src/interfaces/skylark";

const getBackgroundTaskTypeText = (tasks: GQLSkylarkBackgroundTask[]) => {
  const genericBackgroundTaskText = "Running Background Tasks";

  const types = [...new Set(tasks.map(({ task_type }) => task_type))];

  // TODO instead of using the only type, allow for any in the switch to end in the same result

  if (types.length === 1) {
    const [type] = types;

    switch (type) {
      case BackgroundTaskType.AVAILABILITY_UPDATE_OBJECT_PROCESSING:
      case BackgroundTaskType.AVAILABILITY_DELETE_OBJECT_PROCESSING:
      case BackgroundTaskType.POST_AVAILABILITY_UPDATE:
      case BackgroundTaskType.POST_AVAILABILITY_DELETE:
        return "Applying Availability Rules";
      case BackgroundTaskType.POST_CREATE:
      case BackgroundTaskType.POST_UPDATE:
      default:
        return "Running Background Tasks";
    }
  }

  return genericBackgroundTaskText;
};

const StatusText = ({
  children,
  loading,
  danger,
}: {
  children: string;
  loading?: boolean;
  danger?: boolean;
}) => (
  <div
    className={clsx(
      "hidden items-center justify-center sm:flex",
      danger && "text-error",
    )}
  >
    {loading && (
      <CgSpinner
        className={clsx(
          "mr-1 animate-spin-fast text-base md:text-lg",
          danger ? "text-error" : "text-warning",
        )}
      />
    )}
    <p className="text-center text-sm font-semibold">{children}</p>
  </div>
);

const BackgroundStatusText = ({
  tasks,
}: {
  tasks: GQLSkylarkBackgroundTask[];
}) => <StatusText loading>{getBackgroundTaskTypeText(tasks)}</StatusText>;

export const AccountStatus = () => {
  const { backgroundTasks, activationStatus } = useAccountStatus(true);

  if (activationStatus?.update_in_progress) {
    return <StatusText loading danger>{`Updating Schema Version`}</StatusText>;
  }

  if (backgroundTasks?.hasQueued) {
    return <BackgroundStatusText tasks={backgroundTasks.queued} />;
  }

  if (backgroundTasks?.hasInProgress) {
    return <BackgroundStatusText tasks={backgroundTasks.inProgress} />;
  }

  // Easy demo text
  // return (
  //   <StatusText danger loading>
  //     {"Updating Schema to Version 7"} // can't do the number as it is the active, not the one we're updating to
  //   </StatusText>
  // );

  return <></>;
};

/**
 * For stand up
 * - Go through text for all scenarios
 * - is the type switch fine, can it be separated more etc
 * - Colors for all scenarios
 * - Can we display the version number we're updating to
 * - not showing any failures (as can't do anything to action them)
 */
