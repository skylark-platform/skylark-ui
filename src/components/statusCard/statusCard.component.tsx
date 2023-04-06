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

const getSVGColor = (status: statusType) => {
  switch (status) {
    case statusType.success:
      return "stroke-success";
    case statusType.pending:
      return "stroke-manatee-500";
    case statusType.error:
      return "stroke-error";
    default:
      return "";
  }
};

const getIcon = (status: statusType) => {
  switch (status) {
    case statusType.success:
      return <CheckCircle className={getSVGColor(status)} />;
    case statusType.pending:
      return <Circle className={getSVGColor(status)} />;
    case statusType.error:
      return <AlertCircle className={getSVGColor(status)} />;
    case statusType.inProgress:
      return (
        <Spinner
          className={clsx(getSVGColor(status), "chromatic-ignore animate-spin")}
        />
      );
    default:
      break;
  }
};

export const StatusCard = ({ title, description, status }: Props) => {
  const combinedClassName = clsx(
    "flex flex-row rounded border border-t-4 border-solid bg-white p-4 px-6 w-full",
    status === statusType.success && "border-t-success",
    status === statusType.inProgress && "border-t-warning",
    status === statusType.error && "border-t-error",
    status === statusType.pending && "border-t-manatee-500",
  );

  return (
    <div data-testid="status-card" className={combinedClassName}>
      <div className="w-4/5">
        <h4 className="font-heading font-bold md:text-lg">{title}</h4>
        <p className="my-0.5 text-sm font-light">{description}</p>
      </div>
      <div className="flex w-1/5 items-center justify-center">
        {getIcon(status)}
      </div>
    </div>
  );
};
