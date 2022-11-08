import clsx from "clsx";
import Image from "next/image";
import Link from "next/link";

import Logo from "../../../../public/images/skylark.png";
import { UserAvatar } from "../../user";
import { QuickSearch } from "../search/search.component";

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

const dummyUser = {
  name: "Joe Bloggs",
};

export const NavigationBar = () => {
  const activeHref = apps[0].href;

  return (
    <div className="flex h-14 w-full items-center justify-between bg-nav-bar px-8 font-sans text-sm text-black lg:h-16 lg:px-14 fixed">
      <div className="flex h-full items-center gap-8 font-bold md:gap-12">
        <div className="flex">
          <Image src={Logo} alt="Skylark Logo" width="30" height="30" />
          <p className="ml-3 hidden font-heading text-xl md:block lg:ml-4">
            Skylark
          </p>
        </div>
        {apps.map(({ text, href }) => (
          // Use legacyBehaviour so we can style the a tag
          <Link key={href} href={href} legacyBehavior>
            <a
              className={clsx(
                "flex h-full items-center",
                href !== activeHref && "opacity-50 hover:opacity-100",
              )}
            >
              {text}
            </a>
          </Link>
        ))}
      </div>
      <div className="flex items-center font-semibold">
        <QuickSearch onSearch={console.log} />
        <div className="ml-2 flex items-center md:ml-6">
          <p className="mr-3 hidden md:block lg:mr-4">{dummyUser.name}</p>
          <UserAvatar name={dummyUser.name} src="" />
        </div>
      </div>
    </div>
  );
};
