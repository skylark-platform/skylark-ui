import clsx from "clsx";
import Link from "next/link";

const apps = [
  {
    text: "Import",
    href: "/import",
  },
  {
    text: "Relationship",
    href: "/relationship",
  },
  {
    text: "Content",
    href: "/content",
  },
];

export const NavigationLinks = () => {
  const activeHref = apps[0].href;

  return (
    <ul className="flex h-full flex-col items-center justify-center font-bold md:ml-4 md:flex-grow md:flex-row md:justify-start md:text-sm lg:ml-6">
      {apps.map(({ text, href }) => (
        <li
          key={href}
          className={clsx(
            "flex items-center py-6 md:h-full md:py-0 md:px-4 lg:px-6",
            href !== activeHref && "opacity-50 hover:opacity-100",
          )}
        >
          <Link key={href} href={href}>
            {text}
          </Link>
        </li>
      ))}
    </ul>
  );
};
