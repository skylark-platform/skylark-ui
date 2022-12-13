import clsx from "clsx";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

import { Hamburger } from "src/components/navigation/hamburger";
import { NavigationLinks } from "src/components/navigation/links";
import { QuickSearch } from "src/components/navigation/search/search.component";
import { UserAvatar } from "src/components/user";

import Logo from "public/images/skylark-christmas.png";

const dummyUser = {
  name: "Joe Bloggs",
};

export const Navigation = () => {
  const [open, setOpen] = useState(false);

  return (
    <>
      <div className="md:hidden">
        <Hamburger onClick={() => setOpen(!open)} />
      </div>
      <div className="fixed top-0 left-0 right-0 z-40 flex h-16 flex-col items-center justify-center bg-nav-bar py-2 px-8 font-sans text-black md:h-14 md:flex-row md:justify-start lg:h-16 lg:px-14">
        <Link legacyBehavior href="/">
          <a className="absolute top-5 left-5 z-50 flex md:relative md:top-0 md:left-0">
            <Image src={Logo} alt="Skylark Logo" width="30" height="30" />
            <p className="ml-3 font-heading text-xl md:block lg:ml-4">
              Skylark
            </p>
          </a>
        </Link>
        <nav
          className={clsx(
            `fixed inset-0 flex-grow flex-col items-center justify-center bg-nav-bar py-20 md:relative md:flex md:flex-row md:py-0`,
            open ? "flex" : "hidden",
          )}
        >
          <NavigationLinks />
          <QuickSearch onSearch={console.log} />
        </nav>

        <div className="absolute right-16 top-0 mt-4 mr-2 flex items-center text-sm md:relative md:top-0 md:right-0 md:mt-0 md:ml-6">
          <p className="mr-3 hidden font-semibold md:inline lg:mr-4">
            {dummyUser.name}
          </p>
          <UserAvatar name={dummyUser.name} src="" />
        </div>
      </div>
    </>
  );
};
