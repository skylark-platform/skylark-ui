import {
  Description,
  Dialog,
  DialogPanel,
  DialogTitle,
} from "@headlessui/react";
import clsx from "clsx";
import { MutableRefObject, ReactNode } from "react";
import { FiX } from "react-icons/fi";

interface ModalProps {
  title: string | null;
  description?: string;
  children: ReactNode;
  size: "small" | "medium" | "large";
  withoutBodyPadding?: boolean;
  isOpen: boolean;
  growHeight?: boolean;
  closeModal: () => void;
  initialFocus?: MutableRefObject<HTMLElement | null> | undefined;
}

export const ModalTitle = ({
  withoutBodyPadding,
  children,
}: {
  withoutBodyPadding?: ModalProps["withoutBodyPadding"];
  children: ReactNode;
}) => (
  <DialogTitle
    className={clsx(
      "mb-2 font-heading text-2xl md:mb-4 md:text-3xl",
      withoutBodyPadding && "px-6 md:px-10",
    )}
  >
    {children}
  </DialogTitle>
);

export const ModalDescription = ({
  withoutBodyPadding,
  children,
}: {
  withoutBodyPadding?: ModalProps["withoutBodyPadding"];
  children: ReactNode;
}) => (
  <Description className={clsx(withoutBodyPadding && "px-6 md:px-10")}>
    {children}
  </Description>
);

export const Modal = ({
  isOpen,
  title,
  description,
  children,
  size,
  closeModal,
  growHeight,
  withoutBodyPadding,
  ...props
}: ModalProps) => {
  return (
    <Dialog
      open={isOpen}
      onClose={closeModal}
      className="font-body relative z-50"
      {...props}
    >
      <div
        className="fixed inset-0 bg-black/40"
        aria-hidden="true"
        data-testid="dialog-background"
      />
      <div className="fixed inset-0 flex items-center justify-center p-2 text-sm">
        <DialogPanel
          className={clsx(
            "relative mx-auto flex max-h-[90%] w-full flex-col overflow-y-auto rounded bg-white pb-4 pt-6 md:pb-8 md:pt-10 ",
            size === "small" && "max-w-xl md:w-7/12",
            size === "medium" && "max-w-3xl md:w-4/5",
            size === "large" && "max-w-8xl lg:w-11/12 xl:w-4/5",
            growHeight && "h-full",
            !withoutBodyPadding && "px-6 md:px-10",
          )}
        >
          <button
            aria-label="close"
            className="absolute right-4 top-4 text-manatee-700 transition-colors hover:text-black sm:right-6 sm:top-6 md:right-6 md:top-8"
            onClick={closeModal}
            tabIndex={-1}
          >
            <FiX className={clsx(size === "small" ? "text-2xl" : "text-3xl")} />
          </button>

          {title && (
            <ModalTitle withoutBodyPadding={withoutBodyPadding}>
              {title}
            </ModalTitle>
          )}
          {description && (
            <ModalDescription withoutBodyPadding={withoutBodyPadding}>
              {description}
            </ModalDescription>
          )}
          {children}
        </DialogPanel>
      </div>
    </Dialog>
  );
};
