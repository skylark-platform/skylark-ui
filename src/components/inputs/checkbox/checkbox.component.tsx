import {
  Root,
  Indicator,
  CheckboxProps as RadixCheckboxProps,
} from "@radix-ui/react-checkbox";
import clsx from "clsx";
import { FiCheck, FiX } from "react-icons/fi";

interface CheckboxProps extends RadixCheckboxProps {
  label?: string;
  onOnlyClick?: () => void;
}

export const Checkbox = ({
  className,
  label,
  name,
  onOnlyClick,
  "aria-label": ariaLabel,
  ...props
}: CheckboxProps) => {
  const { checked } = props;

  const htmlFor = label
    ? `checkbox-${name}`.replaceAll(" ", "-").toLowerCase()
    : "";

  return (
    <div className="group/checkbox flex items-center">
      <Root
        id={htmlFor}
        aria-label={ariaLabel}
        className={clsx(
          "peer flex h-5 w-5 min-w-5 items-center justify-center rounded-sm group-hover/checkbox:cursor-pointer",
          "border-2",
          props.disabled
            ? "radix-state-checked:border-manatee-300 radix-state-checked:bg-manatee-300 radix-state-checked:text-manatee-500 radix-state-indeterminate:border-manatee-300 radix-state-indeterminate:bg-manatee-300 radix-state-unchecked:bg-manatee-300 radix-state-unchecked:border-manatee-300"
            : "radix-state-checked:border-brand-primary radix-state-checked:bg-brand-primary radix-state-indeterminate:border-error radix-state-indeterminate:bg-error radix-state-unchecked:bg-manatee-200",
          "text-white focus:outline-none focus-visible:ring focus-visible:ring-brand-primary focus-visible:ring-opacity-75",
          className,
        )}
        {...props}
      >
        <Indicator>
          {checked === "indeterminate" && <FiX className="text-lg" />}
          {checked === true && <FiCheck className="text-lg" />}
        </Indicator>
      </Root>
      {label && (
        <div className="group/checkbox-only relative flex w-full justify-between peer-radix-state-checked:text-black peer-radix-state-unchecked:text-manatee-500">
          <label
            className={clsx(
              "select-none overflow-hidden pl-2 font-medium group-hover/checkbox:cursor-pointer",
              className,
            )}
            htmlFor={htmlFor}
          >
            {label}
          </label>
          {onOnlyClick && (
            <button
              onClick={onOnlyClick}
              className="invisible absolute right-0 top-1/2 block -translate-y-1/2 rounded-full bg-manatee-50 px-2 text-manatee-600 opacity-0 transition-all hover:bg-manatee-100 hover:text-manatee-900 group-hover/checkbox-only:visible group-hover/checkbox-only:opacity-100"
            >
              Only
            </button>
          )}
        </div>
      )}
    </div>
  );
};
