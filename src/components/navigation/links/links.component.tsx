import { Menu } from "@headlessui/react";
import clsx from "clsx";
import NextLink from "next/link";
import { useRouter } from "next/router";
import { FiFileText, FiLayout, FiTool } from "react-icons/fi";
import { GrGraphQl } from "react-icons/gr";
import { TbTerminal2 } from "react-icons/tb";

import { DropdownMenu } from "src/components/dropdown/dropdown.component";
import { SEGMENT_KEYS } from "src/constants/segment";
import { HREFS } from "src/constants/skylark";
import { segment } from "src/lib/analytics/segment";

interface LinkProps {
  text: string;
  href: string;
  Icon?: JSX.Element;
  className?: string;
  newTab?: boolean;
  onClick?: () => void;
}

const navigationItems = [
  {
    text: "Content Library",
    href: "/",
    Icon: (
      <FiLayout style={{ transform: "rotateY(180deg)" }} className="text-xl" />
    ),
    shouldMarkAsActive: (path: string) => path.startsWith("/object"),
  },
  // {
  //   text: "Relationships",
  //   href: "/relationships",
  //   Icon: <TbLink className="text-xl" />,
  // },
  {
    text: "Content Model",
    href: HREFS.relative.contentModel,
    Icon: <FiTool className="text-xl" />,
    permissions: ["CONTENT_MODEL_EDIT"], // TODO filter links when permissions have loaded
  },
  {
    text: "Developer",
    Icon: <TbTerminal2 className="text-xl" />,
    links: [
      {
        id: "api-docs",
        text: "API Documentation",
        href: HREFS.apiDocs.root,
        Icon: <FiFileText className="text-xl" />,
        onClick: () => {
          segment.track(SEGMENT_KEYS.externalLink.apiDocs.home);
        },
      },
      {
        id: "graphql-ide",
        text: "GraphQL Editor",
        href: HREFS.relative.graphqlEditor,
        Icon: <GrGraphQl className="text-xl" />,
      },
    ],
  },
];

export const Link = ({
  href,
  Icon,
  text,
  className,
  newTab,
  onClick,
}: LinkProps) => {
  if (href.startsWith("http") || newTab) {
    return (
      <a
        href={href}
        className={className}
        onClick={onClick}
        rel="nofollow noreferrer"
        target="_blank"
      >
        {Icon}
        <span>{text}</span>
      </a>
    );
  }
  return (
    <NextLink href={href} className={className} onClick={onClick}>
      {Icon}
      <span>{text}</span>
    </NextLink>
  );
};

export const NavigationLinks = () => {
  const { pathname } = useRouter();

  return (
    <ul className="flex h-full select-none flex-col items-center justify-center text-base font-bold md:ml-4 md:flex-grow md:flex-row md:items-center md:justify-start md:text-sm lg:ml-6">
      {navigationItems.map(
        ({ text, href, Icon, links, shouldMarkAsActive }) => {
          const subhrefs = links?.map((l) => l.href);
          const isActiveLink =
            href === pathname ||
            subhrefs?.includes(pathname) ||
            shouldMarkAsActive?.(pathname) ||
            false;
          return (
            <li
              key={`${text}-${href}`}
              className={clsx(
                "group flex items-center py-6 text-black md:h-full md:px-4 md:py-0 lg:px-6",
                !isActiveLink &&
                  "[&>a]:text-black/50 [&>div>div>button]:text-black/50",
              )}
            >
              {links ? (
                <DropdownMenu options={links} placement="bottom-start">
                  <Menu.Button className="flex w-full items-center justify-center space-x-1 text-base focus:outline-none focus-visible:ring-2 group-hover:text-black ui-open:text-black md:text-sm">
                    {Icon}
                    <span>{text}</span>
                  </Menu.Button>
                </DropdownMenu>
              ) : (
                <Link
                  className="flex flex-row items-center space-x-1 group-hover:text-black"
                  href={href}
                  Icon={Icon}
                  text={text}
                />
              )}
            </li>
          );
        },
      )}
    </ul>
  );
};
