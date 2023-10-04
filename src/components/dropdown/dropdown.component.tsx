import {
  useFloating,
  offset,
  flip,
  size,
  autoUpdate,
} from "@floating-ui/react";
import { Menu, Transition, Portal } from "@headlessui/react";
import clsx from "clsx";
import { Fragment, ReactNode } from "react";

import { Link } from "src/components/navigation/links";

export interface DropdownMenuOption {
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
  renderInPortal?: boolean;
}

export const DropdownMenuButton = Menu.Button;

const DropdownMenuPortalWrapper = ({
  usePortal,
  children,
}: {
  usePortal: boolean;
  children: ReactNode;
}): JSX.Element => {
  if (usePortal) {
    return <Portal>{children}</Portal>;
  }

  return <>{children}</>;
};

export const DropdownMenu = ({
  children,
  options,
  align,
  mobileAlign,
  renderInPortal,
}: DropdownMenuProps) => {
  const { refs, floatingStyles } = useFloating({
    placement: "bottom-start",
    middleware: [
      offset(5),
      flip({ padding: 10 }),
      size({
        apply({ rects, elements, availableHeight }) {
          Object.assign(elements.floating.style, {
            maxHeight: `${availableHeight}px`,
            minWidth: `${rects.reference.width}px`,
          });
        },
        padding: 10,
      }),
    ],
    whileElementsMounted: autoUpdate,
  });

  return (
    <Menu
      as="div"
      className="relative inline-block text-left text-sm font-bold"
    >
      {({ open }) => (
        <>
          {children}
          <Transition
            // as={Fragment}
            as="div"
            className="z-[10000]"
            enter="transition ease-out duration-75"
            enterFrom="transform opacity-0 scale-95"
            enterTo="transform opacity-100 scale-100"
            leave="transition ease-in duration-75"
            leaveFrom="transform opacity-100 scale-100"
            leaveTo="transform opacity-0 scale-95"
            // TODO move to button
            ref={refs.setReference}
          >
            {open && (
              <DropdownMenuPortalWrapper usePortal={!!renderInPortal}>
                <Menu.Items
                  className={clsx(
                    "absolute z-50 mx-auto mt-2 w-60 select-none divide-y divide-manatee-100 rounded-sm bg-white shadow-lg ring-1 ring-manatee-700 ring-opacity-5 focus:outline-none",
                    align === "left" && "-left-4 origin-top-left",
                    align === "right" && "-right-4 origin-top-right",
                    mobileAlign === "center" &&
                      "max-md:left-1/2 max-md:origin-center max-md:-translate-x-1/2",
                  )}
                  ref={refs.setFloating}
                  style={floatingStyles}
                  static
                >
                  {options.map((option) => (
                    <Menu.Item key={option.id} as="div">
                      {({ close }) => {
                        const className = clsx(
                          "flex w-full items-center space-x-1 md:space-x-1.5 rounded-sm pl-3 pr-2 py-2 md:py-3",
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
                            <span className="text-left">{option.text}</span>
                          </button>
                        );
                      }}
                    </Menu.Item>
                  ))}
                </Menu.Items>
              </DropdownMenuPortalWrapper>
            )}
          </Transition>
        </>
      )}
    </Menu>
  );
};
