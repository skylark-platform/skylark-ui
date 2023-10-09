import clsx from "clsx";
import { ComponentProps, ElementType } from "react";
import {
  LuCalendarCheck,
  LuCalendarClock,
  LuCalendarOff,
  LuCalendarX,
} from "react-icons/lu";

import { Pill } from "src/components/pill";
import { AvailabilityStatus } from "src/interfaces/skylark";

interface AvailabilityLabelProps {
  status: AvailabilityStatus | null;
  className?: string;
}

const getStatusTextClassName = (status: AvailabilityLabelProps["status"]) =>
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
}: AvailabilityLabelProps) => {
  const textClassName = getStatusTextClassName(status);
  const className = clsx(textClassName, propClassName);

  const ariaLabel = `Object's Availability is ${
    status || AvailabilityStatus.Unavailable
  }`;

  return (
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
};

export const AvailabilityLabel = ({
  status,
  className,
  as,
  ...props
}: AvailabilityLabelProps &
  (
    | {
        as?: ElementType;
      }
    | ({ as?: "button" } & ComponentProps<"button">)
  )) => {
  const El = as || "div";
  return (
    <El
      {...props}
      className={clsx(
        "flex font-medium uppercase",
        className,
        status === AvailabilityStatus.Active && "text-success",
        status === AvailabilityStatus.Future && "text-warning",
        (status === AvailabilityStatus.Unavailable || status === null) &&
          "text-manatee-400",
        status === AvailabilityStatus.Expired && "text-error",
      )}
    >
      <AvailabilityIcon status={status} className="mr-1 text-base md:text-xl" />
      <span className="mt-px">{status || AvailabilityStatus.Unavailable}</span>
    </El>
  );
};

export const AvailabilityLabelPill = ({
  status,
  className,
}: AvailabilityLabelProps) => (
  <Pill
    className={clsx(
      "uppercase",
      className,
      status === AvailabilityStatus.Active && "bg-success",
      status === AvailabilityStatus.Future && "bg-warning",
      (status === AvailabilityStatus.Unavailable || status === null) &&
        "bg-manatee-400",
      status === AvailabilityStatus.Expired && "bg-error",
    )}
    label={status || AvailabilityStatus.Unavailable}
  />
);
