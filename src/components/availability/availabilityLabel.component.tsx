import clsx from "clsx";

import { Pill } from "src/components/pill";
import { AvailabilityStatus } from "src/interfaces/skylark";

interface AvailabilityLabelProps {
  status: AvailabilityStatus;
}

export const AvailabilityLabel = ({ status }: AvailabilityLabelProps) => (
  <span
    className={clsx(
      "font-medium uppercase",
      status === AvailabilityStatus.Active && "text-success",
      status === AvailabilityStatus.Future && "text-warning",
      status === AvailabilityStatus.Unavailable && "text-manatee-400",
      status === AvailabilityStatus.Expired && "text-error",
    )}
  >
    {status}
  </span>
);

export const AvailabilityLabelPill = ({ status }: AvailabilityLabelProps) => (
  <Pill
    className={clsx(
      "uppercase",
      status === AvailabilityStatus.Active && "bg-success",
      status === AvailabilityStatus.Future && "bg-warning",
      status === AvailabilityStatus.Unavailable && "bg-manatee-400",
      status === AvailabilityStatus.Expired && "bg-error",
    )}
    label={status}
  />
);
