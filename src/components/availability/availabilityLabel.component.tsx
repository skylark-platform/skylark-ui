import clsx from "clsx";

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
