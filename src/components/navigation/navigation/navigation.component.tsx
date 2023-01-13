import clsx from "clsx";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

import { AddAuthTokenModal } from "src/components/betaReleaseAuthModal";
import { Button } from "src/components/button";
import { Hamburger } from "src/components/navigation/hamburger";
import { NavigationLinks } from "src/components/navigation/links";
import { UserAvatar } from "src/components/user";
import { useConnectedToSkylark } from "src/hooks/useConnectedToSkylark";

import Logo from "public/images/skylark.png";

const dummyUser = {
  name: "Joe Bloggs",
};

export const Navigation = () => {
  const [open, setOpen] = useState(false);

  const { connected, loading } = useConnectedToSkylark();

  // Convert to custom hook which checks localStorage on first load / periodically
  const [isAuthModalOpen, setAuthModalOpen] = useState(false);

  return (
    <>
      <div className="fixed top-0 left-0 right-0 z-40 flex h-14 flex-row items-center justify-start bg-nav-bar py-2 px-4 font-sans text-black md:h-14 md:flex-row md:justify-start lg:h-16 lg:px-14">
        <Link legacyBehavior href="/">
          <a className="z-50 flex items-center justify-start">
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
        </nav>

        <div className="z-50 flex flex-grow flex-row items-center justify-end gap-2 md:flex-grow-0 md:gap-10">
          <Button
            variant="outline"
            success={connected}
            onClick={() => setAuthModalOpen(true)}
          >
            {connected ? "Connected" : "Connect to Skylark"}
          </Button>
          <div className="hidden items-center text-sm md:flex">
            <p className="mr-3 hidden font-semibold md:inline lg:mr-4">
              {dummyUser.name}
            </p>
            <UserAvatar name={dummyUser.name} src="" />
          </div>
        </div>

        <Hamburger
          onClick={() => setOpen(!open)}
          className="ml-4 justify-self-end md:hidden"
        />
      </div>
      {/* This should be removed after beta when we implement real authentication */}
      <AddAuthTokenModal
        isOpen={isAuthModalOpen || (!connected && !loading)}
        setIsOpen={setAuthModalOpen}
      />
    </>
  );
};
