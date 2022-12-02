import clsx from "clsx";
import Link from "next/link";
import { TbBooks, TbLink } from "react-icons/tb";

const apps = [
  {
    text: "Library",
    href: "/",
    Icon: <TbBooks className="text-xl" />,
  },
  // {
  //   text: "Import",
  //   href: "/import",
  // },
  {
    text: "Relationships",
    href: "/connect",
    Icon: <TbLink className="text-xl" />,
  },
];

export const NavigationLinks = () => {
  const activeHref = apps[0].href;

  return (
    <ul className="flex h-full flex-col items-center justify-center font-bold md:ml-4 md:flex-grow md:flex-row md:justify-start md:text-sm lg:ml-6">
      {apps.map(({ text, href, Icon }) => (
        <li
          key={href}
          className={clsx(
            "flex items-center py-6 md:h-full md:py-0 md:px-4 lg:px-6",
            href !== activeHref && "opacity-50 hover:opacity-100",
          )}
        >
          <Link key={href} href={href} legacyBehavior>
            <a className="flex flex-row items-center gap-1">
              {Icon}
              {text}
            </a>
          </Link>
        </li>
      ))}
    </ul>
  );
};
