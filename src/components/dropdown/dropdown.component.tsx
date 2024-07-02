import {
  useFloating,
  offset,
  flip,
  autoUpdate,
  Placement,
  useTransitionStyles,
  shift,
} from "@floating-ui/react";
import { Menu, Portal } from "@headlessui/react";
import clsx from "clsx";
import { ReactNode } from "react";

import { Link } from "src/components/navigation/links";
import { hasProperty } from "src/lib/utils";

export interface DropdownMenuOption {
  id: string;
  text: string;
  Icon?: JSX.Element;
  danger?: boolean;
  href?: string;
  disabled?: boolean;
  newTab?: boolean;
  onClick?: () => void;
}

export interface DropdownMenuSection {
  id: string;
  label?: string;
  options: DropdownMenuOption[];
}

interface DropdownMenuProps {
  children: JSX.Element;
  options: DropdownMenuSection[] | DropdownMenuOption[];
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
  options: sections,
  open,
}: DropdownMenuProps & { open: boolean }) => {
  const { refs, floatingStyles, context } = useFloating({
    open,
    placement,
    middleware: [offset({ alignmentAxis: -10 }), flip(), shift()],
    whileElementsMounted: autoUpdate,
  });

  const { isMounted, styles: transitionStyles } = useTransitionStyles(context, {
    duration: 75,
    initial: {
      opacity: 0,
      transform: "scale(0.95)",
    },
  });

  const typedSections: DropdownMenuSection[] =
    sections.length > 0 && !hasProperty(sections[0], "options")
      ? [{ id: "options", options: sections as DropdownMenuOption[] }]
      : (sections as DropdownMenuSection[]);

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
                "mx-auto mt-2 w-60 select-none rounded-sm bg-white text-sm font-bold shadow-lg ring-1 ring-manatee-700 ring-opacity-5 focus:outline-none",
                "max-h-96 overflow-y-scroll",
              )}
              style={{ ...transitionStyles }}
              static
            >
              {typedSections.map(({ id, label, options }, index) => (
                <div
                  key={id}
                  className={clsx(
                    index > 0 && "pt-1",
                    index !== typedSections.length - 1 && "pb-0",
                  )}
                  data-testid={`dropdown-section-${id}`}
                >
                  {label && (
                    <p className="mx mx-3 mb-0.5 mt-2 text-xs font-semibold text-manatee-400">
                      {label}
                    </p>
                  )}
                  <div className="divide-y divide-manatee-100">
                    {options.map((option) => (
                      <Menu.Item key={option.id}>
                        {({ close }) => {
                          const className = clsx(
                            "flex w-full items-center space-x-1 md:space-x-1.5 rounded-sm pl-3 pr-2 py-2 md:py-3 md:pr-4",
                            !option.disabled &&
                              (option.onClick || option.href) &&
                              "hover:bg-manatee-200 ui-active:bg-manatee-200 hover:text-gray-900 ui-active:text-gray-900",
                            option.disabled &&
                              "bg-manatee-100 text-manatee-500",
                            option.danger &&
                              !option.disabled &&
                              "bg-red-100 ui-active:bg-red-300 hover:bg-red-300 [&>svg]:text-error",
                            !option.onClick &&
                              !option.href &&
                              "font-normal text-xs",
                          );
                          return option.href ? (
                            <Link
                              onClick={close}
                              className={className}
                              href={option.href as string}
                              Icon={option.Icon}
                              text={option.text}
                              newTab={option.newTab}
                            />
                          ) : (
                            <button
                              className={className}
                              onClick={option.onClick}
                              disabled={option.disabled}
                            >
                              {option.Icon}
                              <span className="whitespace-nowrap text-left">
                                {option.text}
                              </span>
                            </button>
                          );
                        }}
                      </Menu.Item>
                    ))}
                  </div>
                </div>
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
