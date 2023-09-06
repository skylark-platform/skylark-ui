import { Fragment, Ref, forwardRef } from "react";
import { FiChevronDown } from "react-icons/fi";

import { Button, ButtonProps } from "src/components/button";
import {
  DropdownMenu,
  DropdownMenuButton,
  DropdownMenuOption,
} from "src/components/dropdown/dropdown.component";

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
          className="rounded-r-none pr-0 md:pr-0"
          ref={buttonRef}
        >
          {children}
        </Button>
        <DropdownMenu options={options} align="right">
          <DropdownMenuButton as={Fragment}>
            <Button
              {...buttonProps}
              Icon={<FiChevronDown className="text-lg" />}
              className="rounded-l-none border-l border-l-white/40 px-2"
              animated={false}
            />
          </DropdownMenuButton>
        </DropdownMenu>
      </div>
    );
  },
);
ButtonWithDropdown.displayName = "ButtonWithDropdown";
