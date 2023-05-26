import clsx from "clsx";

import { Pill } from "src/components/pill";
import { AvailabilityStatus } from "src/interfaces/skylark";

interface AvailabilityLabelProps {
  status: AvailabilityStatus | null;
  className?: string;
}

export const AvailabilityLabel = ({
  status,
  className,
}: AvailabilityLabelProps) => (
  <span
    className={clsx(
      "font-medium uppercase",
      className,
      status === AvailabilityStatus.Active && "text-success",
      status === AvailabilityStatus.Future && "text-warning",
      (status === AvailabilityStatus.Unavailable || status === null) &&
        "text-manatee-400",
      status === AvailabilityStatus.Expired && "text-error",
    )}
  >
    {status || AvailabilityStatus.Unavailable}
  </span>
);

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
