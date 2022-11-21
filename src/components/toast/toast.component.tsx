import clsx from "clsx";
import {
  ToastContainer as ReactToastifyContainer,
  ToastContentProps,
} from "react-toastify";

export interface ToastProps extends Partial<ToastContentProps> {
  title: string;
  message: string;
}

const contextClass = {
  success: "bg-green-500",
  error: "bg-red-600",
  info: "bg-gray-600",
  warning: "bg-orange-400",
  default: "bg-brand-primary",
  dark: "bg-white-600 font-gray-300",
};

export const ToastContainer = () => (
  <ReactToastifyContainer
    position="top-right"
    autoClose={false}
    hideProgressBar={true}
    theme="colored"
    closeButton={false}
    bodyClassName="p-0 bg-none"
    toastClassName="p-0 min-h-6 rounded-lg bg-none"
    icon={false}
    // toastClassName={
    //   (context) => " bg-blue-600"

    //   // contextClass[context?.type || "default"] +
    //   // " relative flex p-1 min-h-10 rounded-md justify-between overflow-hidden cursor-pointer"
    // }
    // bodyClassName={() => "text-sm font-white  block p-3"}
  />
);

export const Toast = ({ toastProps, title, message }: ToastProps) => (
  <div
    className={clsx(
      "min-h-12 h-full w-full p-3 font-sans text-white",
      toastProps?.type === "default" && "bg-brand-primary",
      toastProps?.type === "info" && "bg-info text-info-content",
      toastProps?.type === "success" && "bg-success text-success-content",
      toastProps?.type === "warning" && "bg-warning text-warning-content",
      toastProps?.type === "error" && "bg-error text-error-content",
    )}
  >
    <p className="mb-1 text-base">{title}</p>
    <p className="text-xs font-light">{message}</p>
  </div>
);
