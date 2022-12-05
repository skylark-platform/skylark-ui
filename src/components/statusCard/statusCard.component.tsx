import clsx from "clsx";
import Image from "next/image";

import { CheckCircle } from "src/components/icons/checkCircle.component";

export enum statusType {
  "success",
  "inProgress",
  "error",
  "pending",
}
export interface Props {
  title: string;
  description: string;
  status: statusType;
}

export const StatusCard = ({ title, description, status }: Props) => {
  const combinedClassName = clsx(
    "mb-2 flex h-28 w-2/5 flex-row rounded border border-t-4 border-solid bg-white p-5",
    status === statusType.success && "border-t-success",
    status === statusType.inProgress && "border-t-in-progress",
    status === statusType.error && "border-t-error-2",
    status === statusType.pending && "border-t-pending",
  );
  return (
    <div className={combinedClassName}>
      <div className="w-4/5">
        <h4 className="font-bold">{title}</h4>
        <div>
          <p className="text-sm font-light">{description}</p>
        </div>
      </div>
      <div className="flex w-1/5 items-center justify-center">
        <CheckCircle className={`stroke-${status}`} />
      </div>
    </div>
  );
};
