import clsx from "clsx";

import { AlertCircle } from "src/components/icons";
import { CheckCircle } from "src/components/icons";
import { Circle } from "src/components/icons";
import { Spinner } from "src/components/icons";

export enum statusType {
  success = "success",
  inProgress = "inProgress",
  error = "error",
  pending = "pending",
}
export interface Props {
  title: string;
  description: string;
  status: statusType;
}

const getIcon = (status: statusType) => {
  switch (status) {
    case statusType.success:
      return <CheckCircle status={status} />;
    case statusType.pending:
      return <Circle status={status} />;
    case statusType.error:
      return <AlertCircle status={status} />;
    case statusType.inProgress:
      return <Spinner status={status} />;
    default:
      break;
  }
};

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
        {getIcon(status)}
      </div>
    </div>
  );
};
