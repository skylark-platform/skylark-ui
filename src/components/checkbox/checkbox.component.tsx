import { Root, Indicator, CheckboxProps } from "@radix-ui/react-checkbox";
import clsx from "clsx";
import { GoCheck } from "react-icons/go";

export const Checkbox = ({ className, ...props }: CheckboxProps) => (
  <Root
    className={clsx(
      "flex h-5 w-5 items-center justify-center rounded-sm",
      "border-2 radix-state-checked:border-brand-primary radix-state-checked:bg-brand-primary radix-state-unchecked:bg-white",
      "text-white focus:outline-none focus-visible:ring focus-visible:ring-brand-primary focus-visible:ring-opacity-75",
      className,
    )}
    {...props}
  >
    <Indicator>
      <GoCheck />
    </Indicator>
  </Root>
);
