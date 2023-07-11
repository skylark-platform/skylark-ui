import clsx from "clsx";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

import { Button } from "src/components/button";
import { AddAuthTokenModal } from "src/components/modals";
import { Hamburger } from "src/components/navigation/hamburger";
import { NavigationLinks } from "src/components/navigation/links";
import { UserAvatar } from "src/components/user";
import { useConnectedToSkylark } from "src/hooks/useConnectedToSkylark";

import Logo from "public/images/skylark.png";

const getCustomerIdentifier = (uri: string) => {
  const isIo = uri.includes("skylarkplatform.io");
  const isCom = uri.includes("skylarkplatform.com");
  const isValid = isIo || isCom;

  if (!isValid) {
    return "";
  }

  const isIntEnvironment = uri.includes(".api.int.development.");
  if (isIntEnvironment) {
    const identifier = uri.split("/")[2].split(".api.int.development.")[0];
    return `${identifier} (int)`;
  }

  const path = uri.split(
    isCom ? "skylarkplatform.com" : "skylarkplatform.io",
  )[1];
  const splitPath = path.split("/").filter((p) => p);
  if (splitPath[0] !== "graphql") {
    return splitPath[0];
  }

  return uri.split(".")[1];
};

export const Navigation = () => {
  const [open, setOpen] = useState(false);

  const {
    isConnected,
    isLoading,
    currentCreds: { uri },
  } = useConnectedToSkylark();
  const [isAuthModalOpen, setAuthModalOpen] = useState(false);
  const [customerIdentifier, setCustomerIdentifier] = useState("");

  useEffect(() => {
    if (uri) {
      setCustomerIdentifier(getCustomerIdentifier(uri));
    }
  }, [uri]);

  return (
    <>
      <div className="h-nav fixed left-0 right-0 top-0 z-40 flex flex-row items-center justify-start bg-nav-bar px-4 py-2 font-sans text-black md:flex-row md:justify-start md:px-6 lg:px-10">
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

        <div className="z-50 flex flex-grow flex-row items-center justify-end space-x-1 md:flex-grow-0 md:space-x-5">
          <Button
            variant="outline"
            success={isConnected}
            onClick={() => setAuthModalOpen(true)}
          >
            {isConnected ? "Connected" : "Connect to Skylark"}
          </Button>
          <div className="hidden items-center text-sm md:flex">
            <p className="mr-3 hidden font-semibold md:inline lg:mr-4">
              {customerIdentifier}
            </p>
            <UserAvatar name={customerIdentifier || "S"} src="" />
          </div>
        </div>

        <Hamburger
          onClick={() => setOpen(!open)}
          className="ml-4 justify-self-end md:hidden"
        />
      </div>
      {/* This should be removed after beta when we implement real authentication */}
      <AddAuthTokenModal
        isOpen={isAuthModalOpen || (!isConnected && !isLoading)}
        setIsOpen={setAuthModalOpen}
      />
    </>
  );
};
