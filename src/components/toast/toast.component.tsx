import clsx from "clsx";
import {
  ToastContainer as ReactToastifyContainer,
  ToastContentProps,
  TypeOptions,
} from "react-toastify";

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
    className={"fixed right-0 top-20 z-[100000000] w-full p-2 md:w-80 lg:w-96"}
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
        "min-h-16 h-full rounded-lg p-3 font-sans text-white",
        (type === "default" || !type) && "bg-brand-primary",
        type === "info" && "bg-info text-info-content",
        type === "success" && "bg-success text-success-content",
        type === "warning" && "bg-warning text-warning-content",
        type === "error" && "bg-error text-error-content",
      )}
    >
      <p className="mb-1 text-base">{title}</p>
      {message && <p className="text-xs font-light">{message}</p>}
    </div>
  );
};
