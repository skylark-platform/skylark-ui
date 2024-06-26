import clsx from "clsx";
import { Fragment, Ref, forwardRef } from "react";
import { FiChevronDown } from "react-icons/fi";

import { Button, ButtonProps } from "src/components/button";
import {
  DropdownMenu,
  DropdownMenuButton,
  DropdownMenuOption,
} from "src/components/dropdown/dropdown.component";
import { hasProperty } from "src/lib/utils";

export interface ButtonWithDropdownProps extends ButtonProps {
  options: DropdownMenuOption[];
}

export const ButtonWithDropdown = forwardRef(
  (
    { options, children, onClick, ...buttonProps }: ButtonWithDropdownProps,
    buttonRef: Ref<HTMLButtonElement>,
  ) => {
    return (
      <div className="flex">
        <Button
          {...buttonProps}
          onClick={onClick}
          className={clsx("rounded-r-none pr-1 md:pr-2", buttonProps.className)}
          ref={buttonRef}
        >
          {children}
        </Button>
        <DropdownMenu options={options} placement="bottom">
          <DropdownMenuButton as={Fragment}>
            <Button
              {...buttonProps}
              aria-label={
                hasProperty(buttonProps, "aria-label")
                  ? `${
                      buttonProps["aria-label"] as string
                    } - see alternate options`
                  : undefined
              }
              Icon={<FiChevronDown className="text-lg" />}
              className="rounded-l-none border-l-2 border-l-white/40 pl-0.5 pr-1 hover:border-l-white/40 md:pl-1 md:pr-2 min-h-8 h-8 md:h-10"
              animated={false}
            />
          </DropdownMenuButton>
        </DropdownMenu>
      </div>
    );
  },
);
ButtonWithDropdown.displayName = "ButtonWithDropdown";
