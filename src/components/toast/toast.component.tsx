import clsx from "clsx";
import { JSX } from "react";
import {
  ToastContainer as ReactToastifyContainer,
  ToastContentProps,
  TypeOptions,
} from "react-toastify";

import { GQLSkylarkErrorResponse } from "src/interfaces/skylark";

export interface ToastProps extends Partial<ToastContentProps> {
  title: string;
  message?: string | string[] | JSX.Element;
  messageClassName?: string;
  type?: TypeOptions;
}

const contextClassNames = {
  default: "bg-manatee-200 text-info-content",
  info: "bg-brand-primary text-info-content",
  success: "bg-success text-success-content",
  warning: "bg-warning text-warning-content",
  error: "bg-error text-error-content",
};

export const ToastContainer = () => (
  <ReactToastifyContainer
    position="top-right"
    autoClose={4000}
    pauseOnHover
    theme="colored"
    closeButton={true}
    bodyClassName="p-0 bg-none"
    toastClassName={(props) => {
      return clsx(
        contextClassNames[props?.type || "default"],
        "relative flex px-6 py-4 min-h-10 mt-2 justify-between overflow-hidden cursor-pointer min-h-16 h-full rounded font-sans text-white",
      );
    }}
    className={"fixed right-0 top-0 z-[200] w-full pr-8 md:w-80 lg:w-96"}
    progressClassName="bg-brand-primary"
    icon={false}
  />
);

const ToastMessage = ({
  message,
  className,
}: {
  message: ToastProps["message"];
  className: ToastProps["messageClassName"];
}): JSX.Element => {
  if (typeof message === "string") {
    return <p className={clsx("mt-2", className)}>{message}</p>;
  }

  if (
    Array.isArray(message) &&
    message.every((msg): msg is string => typeof msg === "string")
  ) {
    return (
      <>
        {message.map((msg) => (
          <p key={msg} className={clsx("mt-2", className)}>
            {msg}
          </p>
        ))}
      </>
    );
  }

  return message || <></>;
};

export const Toast = ({ title, message, messageClassName }: ToastProps) => {
  return (
    <div data-testid="toast">
      <div className="flex flex-row">
        <h4 className="flex-grow pr-2 text-base font-medium md:text-base">
          {title}
        </h4>
      </div>
      {message && (
        <div className="mt-1 text-xs font-light md:text-sm">
          <ToastMessage message={message} className={messageClassName} />
        </div>
      )}
    </div>
  );
};

export const GraphQLRequestErrorToast = ({
  title,
  error,
}: {
  title: ToastProps["title"];
  error: GQLSkylarkErrorResponse;
}) => {
  const formattedError = error?.response?.errors?.map(
    ({ message }) => `- ${message}`,
  ) || [error.toString()];
  return <Toast title={title} message={[`Reason(s):`, ...formattedError]} />;
};
