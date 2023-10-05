import {
  useFloating,
  offset,
  flip,
  size,
  autoUpdate,
  Placement,
  useTransitionStyles,
} from "@floating-ui/react";
import { Menu, Portal } from "@headlessui/react";
import clsx from "clsx";
import { ReactNode } from "react";

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
  placement: Placement;
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

const MenuItems = ({
  placement,
  children,
  renderInPortal,
  options,
  open,
}: DropdownMenuProps & { open: boolean }) => {
  const { refs, floatingStyles, context } = useFloating({
    open,
    placement,
    middleware: [
      offset({ alignmentAxis: -10 }),
      flip(),
      size({
        apply({ rects, elements, availableHeight }) {
          Object.assign(elements.floating.style, {
            maxHeight: `${availableHeight}px`,
            minWidth: `${rects.reference.width}px`,
          });
        },
        padding: 0,
      }),
    ],
    whileElementsMounted: autoUpdate,
  });

  const { isMounted, styles: transitionStyles } = useTransitionStyles(context, {
    duration: 75,
    initial: {
      opacity: 0,
      transform: "scale(0.95)",
    },
  });

  return (
    <>
      <div ref={refs.setReference}>{children}</div>
      {isMounted && (
        <DropdownMenuPortalWrapper usePortal={!!renderInPortal}>
          <div
            ref={refs.setFloating}
            style={{ ...floatingStyles }}
            className="z-50"
          >
            <Menu.Items
              className={clsx(
                "mx-auto mt-2 w-60 select-none divide-y divide-manatee-100 rounded-sm bg-white text-sm font-bold shadow-lg ring-1 ring-manatee-700 ring-opacity-5 focus:outline-none",
              )}
              style={{ ...transitionStyles }}
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
          </div>
        </DropdownMenuPortalWrapper>
      )}
    </>
  );
};

export const DropdownMenu = (props: DropdownMenuProps) => {
  return (
    <Menu
      as="div"
      className="relative inline-block text-left text-sm font-bold"
    >
      {({ open }) => <MenuItems {...props} open={open} />}
    </Menu>
  );
};
