import { Disclosure, DisclosureProps } from "@headlessui/react";
import clsx from "clsx";
import { ReactNode } from "react";
import { FiChevronDown } from "react-icons/fi";

type AccordionProps<TTag extends React.ElementType> = DisclosureProps<TTag> & {
  isSuccess?: boolean;
  isError?: boolean;
  isWarning?: boolean;
  buttonText: string;
};

export const Accordion = <TTag extends React.ElementType>({
  isSuccess,
  isError,
  isWarning,
  buttonText,
  children,
  ...props
}: AccordionProps<TTag>) => (
  <Disclosure {...props}>
    <Disclosure.Button
      className={clsx(
        "px-4 mt-4 flex justify-between items-center text-left py-2 w-full border rounded",
        isSuccess && "bg-success/10 border-success",
        isError && "bg-error/10 border-error",
        isWarning && "bg-warning/10 border-warning",
        !isSuccess &&
          !isError &&
          !isWarning &&
          "bg-manatee-100 border-manatee-300",
      )}
    >
      <span>{buttonText}</span>
      <FiChevronDown className="text-xl" />
    </Disclosure.Button>
    <Disclosure.Panel
      className={clsx(
        "text-gray-500 p-4 rounded-b-lg",
        isSuccess && "bg-success/5",
        isError && "bg-error/5",
        isWarning && "bg-warning/5",
        !isSuccess && !isError && !isWarning && "bg-manatee-50",
      )}
    >
      {children}
    </Disclosure.Panel>
  </Disclosure>
);
