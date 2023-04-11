import {
  Root,
  Indicator,
  CheckboxProps as RadixCheckboxProps,
} from "@radix-ui/react-checkbox";
import clsx from "clsx";
import { GoCheck } from "react-icons/go";

interface CheckboxProps extends RadixCheckboxProps {
  label?: string;
}

export const Checkbox = ({
  className,
  label,
  name,
  "aria-label": ariaLabel,
  ...props
}: CheckboxProps) => {
  const htmlFor = label
    ? `checkbox-${name}`.replaceAll(" ", "-").toLowerCase()
    : "";

  return (
    <div className="group flex items-center">
      <Root
        id={htmlFor}
        aria-label={ariaLabel}
        className={clsx(
          "peer flex h-5 w-5 min-w-5 items-center justify-center rounded-sm group-hover:cursor-pointer",
          "border-2 radix-state-checked:border-brand-primary radix-state-checked:bg-brand-primary radix-state-unchecked:bg-manatee-200",
          "text-white focus:outline-none focus-visible:ring focus-visible:ring-brand-primary focus-visible:ring-opacity-75",
          className,
        )}
        {...props}
      >
        <Indicator>
          <GoCheck />
        </Indicator>
      </Root>
      {label && (
        <label
          className={clsx(
            "select-none overflow-hidden pl-2 font-medium group-hover:cursor-pointer peer-radix-state-checked:text-black peer-radix-state-unchecked:text-manatee-500",
            className,
          )}
          htmlFor={htmlFor}
        >
          {label}
        </label>
      )}
    </div>
  );
};