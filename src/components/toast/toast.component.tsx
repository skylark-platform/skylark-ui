import clsx from "clsx";
import {
  ToastContainer as ReactToastifyContainer,
  ToastContentProps,
  TypeOptions,
} from "react-toastify";

import { Cross } from "src/components/icons";

export interface ToastProps extends Partial<ToastContentProps> {
  title: string;
  message?: string;
  type?: TypeOptions;
}

export const ToastContainer = () => (
  <ReactToastifyContainer
    position="top-right"
    autoClose={false}
    hideProgressBar={true}
    theme="colored"
    closeButton={false}
    bodyClassName="p-0 bg-none"
    toastClassName="p-0 my-2 md:my-4 min-h-6 rounded-lg bg-none"
    className={"fixed right-0 top-20 z-[200] w-full pr-8 md:w-80 lg:w-96"}
    icon={false}
  />
);

export const Toast = ({
  toastProps,
  title,
  message,
  type: propType,
}: ToastProps) => {
  const type = propType || toastProps?.type;

  return (
    <div
      className={clsx(
        "min-h-16 relative h-full rounded-lg px-6 py-4 font-sans text-white",
        (type === "default" || !type) && "bg-brand-primary",
        type === "info" && "bg-info text-info-content",
        type === "success" && "bg-success text-success-content",
        type === "warning" && "bg-warning text-warning-content",
        type === "error" && "bg-error text-error-content",
      )}
    >
      <div className="flex flex-row">
        <h4 className="flex-grow pr-2 text-base font-medium md:text-base">
          {title}
        </h4>
        <button onClick={() => toastProps?.deleteToast()}>
          <Cross />
        </button>
      </div>
      {message && (
        <p className="mt-2 text-xs font-light md:text-sm">{message}</p>
      )}
    </div>
  );
};
