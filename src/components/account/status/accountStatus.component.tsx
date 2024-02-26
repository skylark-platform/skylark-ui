import clsx from "clsx";
import { useState } from "react";
import { CgSpinner } from "react-icons/cg";
import { FiCheck } from "react-icons/fi";

import { Button } from "src/components/button";
import { Tooltip } from "src/components/tooltip/tooltip.component";
import { useAccountStatus } from "src/hooks/useAccountStatus";
import {
  BackgroundTaskType,
  GQLSkylarkBackgroundTask,
} from "src/interfaces/skylark";

type GenericTaskType = "availability" | "deletion" | "other";

const stringifyCount = (count: number) => (count >= 50 ? "50+" : `${count}`);

const getGenericBackgroundTaskType = (
  task: GQLSkylarkBackgroundTask,
): GenericTaskType => {
  switch (task.task_type) {
    case BackgroundTaskType.AVAILABILITY_UPDATE_OBJECT_PROCESSING:
    case BackgroundTaskType.AVAILABILITY_DELETE_OBJECT_PROCESSING:
    case BackgroundTaskType.POST_AVAILABILITY_UPDATE:
    case BackgroundTaskType.POST_AVAILABILITY_DELETE:
      return "availability";
    case BackgroundTaskType.BATCH_DELETE:
    case BackgroundTaskType.DELETE_POST_PROCESSING:
      return "deletion";
    case BackgroundTaskType.POST_CREATE:
    case BackgroundTaskType.POST_UPDATE:
    default:
      return "other";
  }
};

const getBackgroundTaskTypeText = (tasks: GQLSkylarkBackgroundTask[]) => {
  const count = stringifyCount(tasks.length);

  const genericBackgroundTaskText = `${count} Background Tasks`;

  const taskTypes: GenericTaskType[] = [
    ...new Set(tasks.map(getGenericBackgroundTaskType)),
  ];

  if (taskTypes.length === 1) {
    const [type] = taskTypes;

    if (type === "availability") {
      return `${count} Availability Rules`;
    }

    if (type === "deletion") {
      return `${count} Deletion Requests`;
    }
  }

  return genericBackgroundTaskText;
};

const StatusText = ({
  children,
  loading,
  danger,
  success,
  onClick,
}: {
  children: string;
  loading?: boolean;
  danger?: boolean;
  success?: boolean;
  onClick?: () => void;
}) => {
  const tooltipMessages = [
    "When objects, availability rules or your data model are modified, Skylark has to do some bookkeeping behind the scenes. This ensures that that your streaming apps remain lightning fast.",
    "While these background tasks are being completed, you might notice a delay of a few minutes before changes are reflected to your end users.",
  ];

  const tooltip =
    tooltipMessages && tooltipMessages.length > 0 ? (
      <div className="flex w-80 flex-col space-y-2">
        {tooltipMessages.map((message, index) => (
          <p key={index} className="w-full">
            {message}
          </p>
        ))}
        {onClick && (
          <Button
            variant="ghost"
            success
            className="self-end"
            onClick={onClick}
          >
            Hide Background Tasks message
          </Button>
        )}
      </div>
    ) : null;

  const message = (
    <div className="relative flex space-x-1">
      {loading && (
        <CgSpinner
          className={clsx(
            "animate-spin-fast text-base text-warning md:text-lg",
          )}
        />
      )}
      {success && (
        <button onClick={onClick} aria-label="Clear Background Task Status">
          <FiCheck className="text-xl text-success" />
        </button>
      )}
      <p className="text-center text-sm font-semibold">{children}</p>
    </div>
  );

  return (
    <div
      className={clsx(
        "hidden items-center justify-start sm:flex",
        danger && "text-error",
      )}
    >
      {tooltip ? <Tooltip tooltip={tooltip}>{message}</Tooltip> : message}
    </div>
  );
};

const BackgroundStatusText = ({
  queued,
  inProgress,
}: {
  queued: GQLSkylarkBackgroundTask[];
  inProgress: GQLSkylarkBackgroundTask[];
}) => {
  const text = getBackgroundTaskTypeText([...queued, ...inProgress]);
  return <StatusText loading>{`Processing ${text}`}</StatusText>;
};

export const AccountStatus = () => {
  const { backgroundTasks, activationStatus, userNeedsSelfConfigPermissions } =
    useAccountStatus(true);

  const [showCompletedText, setShowCompletedText] = useState(false);

  if (activationStatus?.updateInProgress && !userNeedsSelfConfigPermissions) {
    if (!showCompletedText) setShowCompletedText(true);

    return <StatusText loading>{`Data Model Update In Progress`}</StatusText>;
  }

  if (backgroundTasks?.hasQueued || backgroundTasks?.hasInProgress) {
    if (!showCompletedText) setShowCompletedText(true);

    return (
      <BackgroundStatusText
        inProgress={backgroundTasks.inProgress}
        queued={backgroundTasks.queued}
      />
    );
  }

  return showCompletedText ? (
    <StatusText
      success
      onClick={() => setShowCompletedText(false)}
    >{`All Background Tasks Completed`}</StatusText>
  ) : (
    <></>
  );
};
