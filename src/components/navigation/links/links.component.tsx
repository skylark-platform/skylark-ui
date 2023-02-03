import { Menu, Transition } from "@headlessui/react";
import clsx from "clsx";
import NextLink from "next/link";
import { useRouter } from "next/router";
import { Fragment } from "react";
import { GrGraphQl } from "react-icons/gr";
import { TbBooks, TbTerminal2 } from "react-icons/tb";

import { FileText } from "src/components/icons";
import { HREFS } from "src/constants/skylark";

interface LinkProps {
  text: string;
  href: string;
  Icon?: JSX.Element;
  className?: string;
  onClick?: () => void;
}

const navigationItems = [
  {
    text: "Content Library",
    href: "/",
    Icon: <TbBooks className="text-xl" />,
  },
  // {
  //   text: "Relationships",
  //   href: "/relationships",
  //   Icon: <TbLink className="text-xl" />,
  // },
  {
    text: "Developer",
    Icon: <TbTerminal2 className="text-xl" />,
    links: [
      {
        text: "API Documentation",
        href: HREFS.apiDocs,
        Icon: <FileText className="h-5" />,
      },
      {
        text: "GraphQL Editor",
        href: "/developer/graphql-editor",
        Icon: <GrGraphQl className="text-xl" />,
      },
    ],
  },
];

const Link = ({ href, Icon, text, className, onClick }: LinkProps) => {
  if (href.startsWith("http")) {
    return (
      <a
        href={href}
        className={className}
        onClick={onClick}
        rel="nofollow noreferrer"
        target="_blank"
      >
        {Icon}
        {text}
      </a>
    );
  }
  return (
    <NextLink href={href} className={className} onClick={onClick}>
      {Icon}
      {text}
    </NextLink>
  );
};

export const NavigationLinks = () => {
  const { asPath } = useRouter();

  return (
    <ul className="flex h-full flex-col items-start justify-center font-bold md:ml-4 md:flex-grow md:flex-row md:items-center md:justify-start md:text-sm lg:ml-6">
      {navigationItems.map(({ text, href, Icon, links }) => {
        const subhrefs = links?.map((l) => l.href);
        const isActiveLink = href === asPath || subhrefs?.includes(asPath);
        return (
          <li
            key={`${text}-${href}`}
            className={clsx(
              "group flex items-center py-6 text-black md:h-full md:py-0 md:px-4 lg:px-6",
              !isActiveLink &&
                "[&>a]:text-black/50 [&>div>button]:text-black/50",
            )}
          >
            {links ? (
              <Menu as="div" className="relative inline-block w-full text-left">
                <Menu.Button className="flex w-full items-center justify-center gap-1 focus:outline-none focus-visible:ring-2 group-hover:text-black ui-open:text-black">
                  {Icon}
                  {text}
                </Menu.Button>
                <Transition
                  as={Fragment}
                  enter="transition ease-out duration-100"
                  enterFrom="transform opacity-0 scale-95"
                  enterTo="transform opacity-100 scale-100"
                  leave="transition ease-in duration-75"
                  leaveFrom="transform opacity-100 scale-100"
                  leaveTo="transform opacity-0 scale-95"
                >
                  <Menu.Items className="absolute -left-4 z-50 mx-auto mt-2 w-56 divide-y divide-manatee-100 rounded-sm bg-white shadow-lg focus:outline-none">
                    {links.map((subLink) => (
                      <Menu.Item key={subLink.href} as="div">
                        {({ active, close }) => (
                          <Link
                            onClick={close}
                            className={clsx(
                              active
                                ? "ui-active:bg-manatee-200 ui-active:text-gray-900"
                                : "text-gray-900",
                              "flex w-full items-center gap-1 rounded-sm px-4 py-2 ui-selected:bg-red-300 md:py-3",
                            )}
                            href={subLink.href}
                            Icon={subLink.Icon}
                            text={subLink.text}
                          />
                        )}
                      </Menu.Item>
                    ))}
                  </Menu.Items>
                </Transition>
              </Menu>
            ) : (
              <Link
                className="flex flex-row items-center gap-1 group-hover:text-black"
                href={href}
                Icon={Icon}
                text={text}
              />
            )}
          </li>
        );
      })}
    </ul>
  );
};
