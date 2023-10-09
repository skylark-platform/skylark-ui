import clsx from "clsx";
import {
  LuCalendarCheck,
  LuCalendarClock,
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

export const AvailabilityIcon = ({
  status,
  className: propClassName,
  withTooltipDescription,
}: AvailabilityIconProps) => {
  const textClassName = getStatusTextClassName(status);
  const className = clsx(textClassName, propClassName);

  const ariaLabel = `Object's Availability is ${
    status || AvailabilityStatus.Unavailable
  }`;

  const Icon = (
    <>
      {status === AvailabilityStatus.Active && (
        <LuCalendarCheck className={className} aria-label={ariaLabel} />
      )}
      {status === AvailabilityStatus.Future && (
        <LuCalendarClock className={className} aria-label={ariaLabel} />
      )}
      {(status === AvailabilityStatus.Unavailable || status === null) && (
        <LuCalendarOff className={className} aria-label={ariaLabel} />
      )}
      {status === AvailabilityStatus.Expired && (
        <LuCalendarX className={className} aria-label={ariaLabel} />
      )}
    </>
  );

  return withTooltipDescription ? (
    <Tooltip
      tooltip={
        <div className="text-center">
          <p>{ariaLabel}</p>
          <p>
            The Dimensions in your account may mean that this is not active for
            certain users
          </p>
        </div>
      }
    >
      <div>{Icon}</div>
    </Tooltip>
  ) : (
    Icon
  );
};
