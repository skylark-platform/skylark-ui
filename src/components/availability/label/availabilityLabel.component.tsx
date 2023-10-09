import clsx from "clsx";
import { ComponentProps, ElementType } from "react";

import { AvailabilityIcon } from "src/components/availability/icon/availabilityIcon.component";
import { Pill } from "src/components/pill";
import { AvailabilityStatus } from "src/interfaces/skylark";

interface AvailabilityLabelProps {
  status: AvailabilityStatus | null;
  className?: string;
}

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
      <AvailabilityIcon
        status={status}
        className="mr-1.5 text-base md:text-xl"
      />
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
