import clsx from "clsx";
import { ReactNode } from "react";
import {
  LuCalendarCheck,
  LuCalendarClock,
  LuCalendarHeart,
  LuCalendarOff,
  LuCalendarX,
} from "react-icons/lu";

import { Tooltip } from "src/components/tooltip/tooltip.component";
import { AvailabilityStatus } from "src/interfaces/skylark";

interface AvailabilityIconProps {
  status: AvailabilityStatus | null;
  className?: string;
  withTooltipDescription?: boolean;
}

const getStatusTextClassName = (status: AvailabilityIconProps["status"]) =>
  clsx(
    status === AvailabilityStatus.Active && "text-success",
    status === AvailabilityStatus.Future && "text-warning",
    (status === AvailabilityStatus.Unavailable || status === null) &&
      "text-manatee-400",
    status === AvailabilityStatus.Expired && "text-error",
  );

const generateDescription = (status: AvailabilityStatus) => {
  if (status === AvailabilityStatus.Active) {
    return "This object has at least one active Availability assigned.";
  }

  if (status === AvailabilityStatus.Future) {
    return "No active Availability assigned, at least one will be active in the future.";
  }

  if (status === AvailabilityStatus.Expired) {
    return "All Availabilities assigned to this object are expired.";
  }

  return "No Availabilities assigned.";
};

export const AvailabilityIcon = ({
  status,
  className: propClassName,
  withTooltipDescription,
}: AvailabilityIconProps) => {
  const textClassName = getStatusTextClassName(status);
  const className = clsx(textClassName, propClassName);

  const description = generateDescription(
    status || AvailabilityStatus.Unavailable,
  );

  const Icon = (
    <>
      {status === AvailabilityStatus.Active && (
        <LuCalendarCheck className={className} aria-label={description} />
      )}
      {status === AvailabilityStatus.Future && (
        <LuCalendarClock className={className} aria-label={description} />
      )}
      {(status === AvailabilityStatus.Unavailable || status === null) && (
        <LuCalendarOff className={className} aria-label={description} />
      )}
      {status === AvailabilityStatus.Expired && (
        <LuCalendarX className={className} aria-label={description} />
      )}
    </>
  );

  return withTooltipDescription ? (
    <Tooltip
      tooltip={
        <div className="text-center">
          <p>{description}</p>
          {status === AvailabilityStatus.Active && (
            <p>Depending on Dimensions, this object may be visible to users.</p>
          )}
        </div>
      }
    >
      <div>{Icon}</div>
    </Tooltip>
  ) : (
    Icon
  );
};

export const AvailabilityInheritanceIcon = ({
  status,
  className: propClassName,
  tooltip,
}: Omit<AvailabilityIconProps, "withTooltipDescription"> & {
  tooltip?: ReactNode;
}) => {
  const textClassName = getStatusTextClassName(status);
  const className = clsx(textClassName, propClassName);

  const Icon = (
    <LuCalendarHeart
      className={className}
      aria-label="inherited availability"
    />
  );

  return tooltip ? (
    <Tooltip tooltip={tooltip}>
      <div className="ml-1">{Icon}</div>
    </Tooltip>
  ) : (
    Icon
  );
};
