import { Menu, Transition } from "@headlessui/react";
import clsx from "clsx";
import { Fragment } from "react";

import { Link } from "src/components/navigation/links";

interface DropdownMenuOption {
  id: string;
  text: string;
  Icon?: JSX.Element;
  danger?: boolean;
  href?: string;
  disabled?: boolean;
  onClick?: () => void;
}

interface DropdownMenuProps {
  children: JSX.Element;
  options: DropdownMenuOption[];
  align: "left" | "right";
  mobileAlign?: "center";
}

export const DropdownMenuButton = Menu.Button;

export const DropdownMenu = ({
  children,
  options,
  align,
  mobileAlign,
}: DropdownMenuProps) => {
  return (
    <Menu
      as="div"
      className="relative inline-block text-left text-sm font-bold"
    >
      {children}
      <Transition
        as={Fragment}
        enter="transition ease-out duration-100"
        enterFrom="transform opacity-0 scale-95"
        enterTo="transform opacity-100 scale-100"
        leave="transition ease-in duration-75"
        leaveFrom="transform opacity-100 scale-100"
        leaveTo="transform opacity-0 scale-95"
      >
        <Menu.Items
          className={clsx(
            "absolute z-50 mx-auto mt-2 w-56 select-none divide-y divide-manatee-100 rounded-sm bg-white shadow-lg ring-1 ring-manatee-700 ring-opacity-5 focus:outline-none",
            align === "left" && "-left-4",
            align === "right" && "right-0 origin-top-right",
            mobileAlign === "center" &&
              "max-md:left-1/2 max-md:origin-center max-md:-translate-x-1/2",
          )}
        >
          {options.map((option) => (
            <Menu.Item key={option.id} as="div">
              {({ close }) => {
                const className = clsx(
                  "flex w-full items-center gap-1 rounded-sm px-4 py-2 md:py-3",
                  !option.disabled &&
                    "ui-active:bg-manatee-200 ui-active:text-gray-900",
                  option.disabled && "bg-manatee-100 text-manatee-500",
                  option.danger &&
                    !option.disabled &&
                    "bg-red-100 ui-active:bg-red-300 [&>svg]:text-error",
                );
                return option.href ? (
                  <Link
                    onClick={close}
                    className={className}
                    href={option.href as string}
                    Icon={option.Icon}
                    text={option.text}
                  />
                ) : (
                  <button
                    className={className}
                    onClick={option.onClick}
                    disabled={option.disabled}
                  >
                    {option.Icon}
                    {option.text}
                  </button>
                );
              }}
            </Menu.Item>
          ))}
        </Menu.Items>
      </Transition>
    </Menu>
  );
};
