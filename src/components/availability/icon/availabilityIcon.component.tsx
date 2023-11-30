import clsx from "clsx";
import dayjs from "dayjs";
import {
  LuCalendarCheck,
  LuCalendarClock,
  LuCalendarOff,
  LuCalendarX,
} from "react-icons/lu";

import { Tooltip } from "src/components/tooltip/tooltip.component";
import {
  AvailabilityStatus,
  ParsedSkylarkObjectAvailability,
} from "src/interfaces/skylark";
import { formatReadableDateTime } from "src/lib/skylark/availability";

interface AvailabilityIconProps {
  availability: ParsedSkylarkObjectAvailability;
  className?: string;
  withTooltipDescription?: boolean;
}

const getStatusTextClassName = (status: AvailabilityStatus | null) =>
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
  availability,
  className: propClassName,
  withTooltipDescription,
}: AvailabilityIconProps) => {
  const { status } = availability;

  const textClassName = getStatusTextClassName(status);
  const className = clsx(textClassName, propClassName);

  const description = generateDescription(
    status || AvailabilityStatus.Unavailable,
  );

  const start = availability.active.sort((a, b) =>
    dayjs(a.start).isBefore(b.start) ? -1 : 1,
  );

  const end = availability.active.sort((a, b) =>
    dayjs(a.end).isBefore(b.end) ? -1 : 1,
  );

  // const formatted = formatReadableDateTime(end[0].end);

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
          {status === AvailabilityStatus.Active && (
            <>
              <p className="mt-2">
                Since {formatReadableDateTime(start?.[0]?.start)}
              </p>
              <p className="">Until {formatReadableDateTime(end?.[0]?.end)}</p>
            </>
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
