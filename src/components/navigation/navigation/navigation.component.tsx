import { Menu } from "@headlessui/react";
import clsx from "clsx";
import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { FiLogOut } from "react-icons/fi";
import { sentenceCase } from "sentence-case";
import { useIsClient, useLocalStorage, useReadLocalStorage } from "usehooks-ts";

import { AccountStatus } from "src/components/account";
import { Button } from "src/components/button";
import { DropdownMenu } from "src/components/dropdown/dropdown.component";
import { AddAuthTokenModal } from "src/components/modals";
import { Hamburger } from "src/components/navigation/hamburger";
import { NavigationLinks } from "src/components/navigation/links";
import { UserAvatar } from "src/components/user";
import { useSkylarkCreds } from "src/hooks/localStorage/useCreds";
import { useAccountStatus } from "src/hooks/useAccountStatus";

import Logo from "public/images/skylark.png";

const getCustomerIdentifier = (uri: string | null) => {
  if (!uri) {
    return "";
  }

  const isIo = uri.includes("skylarkplatform.io");
  const isCom = uri.includes("skylarkplatform.com");
  const isValid = isIo || isCom;

  if (!isValid) {
    return "";
  }

  const isIntEnvironment = uri.includes(".api.int.development.");
  if (isIntEnvironment) {
    const identifier = uri.split("/")[2].split(".api.int.development.")[0];
    return `${sentenceCase(identifier)} (int)`;
  }

  const isProductionEnvironment = uri.includes(
    ".api.skylarkplatform.com/graphql",
  );
  if (isProductionEnvironment) {
    const identifier = uri.split("/")[2].split(".api.skylarkplatform.com")[0];
    return sentenceCase(identifier);
  }

  const path = uri.split(
    isCom ? "skylarkplatform.com" : "skylarkplatform.io",
  )[1];
  const splitPath = path.split("/").filter((p) => p);
  if (splitPath[0] !== "graphql") {
    return sentenceCase(splitPath[0]);
  }

  return sentenceCase(uri.split(".")[1]);
};

export const Navigation = () => {
  const isClient = useIsClient();

  const [open, setOpen] = useState(false);

  const { isConnected } = useAccountStatus();

  const [isAuthModalOpen, setAuthModalOpen] = useState(false);

  const [creds] = useSkylarkCreds();
  const customerIdentifier = isClient
    ? getCustomerIdentifier(creds?.uri || "")
    : "";

  const handleModalOpenState = (open: boolean) => {
    setAuthModalOpen(open);
  };

  return (
    <>
      <div className="h-nav fixed left-0 right-0 top-0 z-50 flex flex-row items-center justify-start bg-nav-bar px-4 py-2 font-sans text-black md:flex-row md:justify-start md:px-6 lg:px-10">
        <Link legacyBehavior href="/">
          <a className="z-[60] flex items-center justify-start">
            <Image src={Logo} alt="Skylark Logo" width="30" height="30" />
            <p className="ml-3 font-heading text-xl md:block lg:ml-4">
              Skylark
            </p>
          </a>
        </Link>
        <nav
          className={clsx(
            `fixed inset-0 z-50 flex-grow flex-col items-center justify-center bg-nav-bar py-20 md:relative md:flex md:flex-row md:py-0`,
            open ? "flex" : "hidden",
          )}
        >
          <NavigationLinks />
        </nav>

        <div className="z-50 flex flex-grow flex-row items-center justify-end space-x-1 md:flex-grow-0 md:space-x-5">
          {isConnected ? (
            <AccountStatus />
          ) : (
            <Button variant="outline" onClick={() => setAuthModalOpen(true)}>
              Connect to Skylark
            </Button>
          )}
          <DropdownMenu
            options={[
              {
                id: "change-skylark",
                text: "Change Skylark Account",
                onClick: () => setAuthModalOpen(true),
                Icon: <FiLogOut className="text-xl" />,
              },
            ]}
            align="right"
          >
            <Menu.Button
              aria-label="User Settings Dropdown"
              className="flex w-full items-center justify-center space-x-3 text-base focus:outline-none focus-visible:ring-2 group-hover:text-black ui-open:text-black md:space-x-4 md:text-sm"
            >
              <span className="hidden font-semibold md:inline">
                {customerIdentifier}
              </span>
              <UserAvatar name={customerIdentifier || "S"} src="" />
            </Menu.Button>
          </DropdownMenu>
        </div>

        <Hamburger
          onClick={() => setOpen(!open)}
          className="ml-4 justify-self-end md:hidden"
        />
      </div>
      {/* This should be removed after beta when we implement real authentication */}
      <AddAuthTokenModal
        isOpen={isAuthModalOpen || !isConnected}
        setIsOpen={handleModalOpenState}
      />
    </>
  );
};
