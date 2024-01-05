import { Menu } from "@headlessui/react";
import clsx from "clsx";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { FiLogOut } from "react-icons/fi";
import { useIsClient } from "usehooks-ts";

import { AccountStatus } from "src/components/account";
import { Button } from "src/components/button";
import { DropdownMenu } from "src/components/dropdown/dropdown.component";
import { AddAuthTokenModal } from "src/components/modals";
import { Hamburger } from "src/components/navigation/hamburger";
import { NavigationLinks } from "src/components/navigation/links";
import { UserAvatar } from "src/components/user";
import { useSkylarkCreds } from "src/hooks/localStorage/useCreds";
import { useAccountStatus } from "src/hooks/useAccountStatus";
import { formatUriAsCustomerIdentifer } from "src/lib/utils";

import Logo from "public/images/skylark.png";

export const Navigation = () => {
  const isClient = useIsClient();

  const [open, setOpen] = useState(false);

  const { isConnected } = useAccountStatus();

  const [isAuthModalOpen, setAuthModalOpen] = useState(false);

  const [creds] = useSkylarkCreds();
  const customerIdentifier = isClient
    ? formatUriAsCustomerIdentifer(creds?.uri || "")
    : "";

  const handleModalOpenState = (open: boolean) => {
    setAuthModalOpen(open);
  };

  return (
    <>
      <div className="h-nav fixed left-0 right-0 top-0 z-50 flex flex-row items-center justify-start bg-nav-bar px-4 py-2 font-sans text-base-content md:flex-row md:justify-start md:px-6 lg:px-10">
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
            placement="bottom-end"
          >
            <Menu.Button
              aria-label="User Settings Dropdown"
              className="flex w-full items-center justify-center space-x-3 text-base focus:outline-none focus-visible:ring-2 group-hover:text-base-content ui-open:text-base-content md:space-x-4 md:text-sm"
            >
              <span className="hidden font-semibold md:inline capitalize">
                {customerIdentifier}
              </span>
              <UserAvatar name={customerIdentifier || "S"} src="" />
            </Menu.Button>
          </DropdownMenu>
          <label className="swap swap-rotate">
            {/* this hidden checkbox controls the state */}
            <input
              type="checkbox"
              className="theme-controller"
              value="synthwave"
            />

            {/* sun icon */}
            <svg
              className="swap-on fill-current w-10 h-10"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
            >
              <path d="M5.64,17l-.71.71a1,1,0,0,0,0,1.41,1,1,0,0,0,1.41,0l.71-.71A1,1,0,0,0,5.64,17ZM5,12a1,1,0,0,0-1-1H3a1,1,0,0,0,0,2H4A1,1,0,0,0,5,12Zm7-7a1,1,0,0,0,1-1V3a1,1,0,0,0-2,0V4A1,1,0,0,0,12,5ZM5.64,7.05a1,1,0,0,0,.7.29,1,1,0,0,0,.71-.29,1,1,0,0,0,0-1.41l-.71-.71A1,1,0,0,0,4.93,6.34Zm12,.29a1,1,0,0,0,.7-.29l.71-.71a1,1,0,1,0-1.41-1.41L17,5.64a1,1,0,0,0,0,1.41A1,1,0,0,0,17.66,7.34ZM21,11H20a1,1,0,0,0,0,2h1a1,1,0,0,0,0-2Zm-9,8a1,1,0,0,0-1,1v1a1,1,0,0,0,2,0V20A1,1,0,0,0,12,19ZM18.36,17A1,1,0,0,0,17,18.36l.71.71a1,1,0,0,0,1.41,0,1,1,0,0,0,0-1.41ZM12,6.5A5.5,5.5,0,1,0,17.5,12,5.51,5.51,0,0,0,12,6.5Zm0,9A3.5,3.5,0,1,1,15.5,12,3.5,3.5,0,0,1,12,15.5Z" />
            </svg>

            {/* moon icon */}
            <svg
              className="swap-off fill-current w-10 h-10"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
            >
              <path d="M21.64,13a1,1,0,0,0-1.05-.14,8.05,8.05,0,0,1-3.37.73A8.15,8.15,0,0,1,9.08,5.49a8.59,8.59,0,0,1,.25-2A1,1,0,0,0,8,2.36,10.14,10.14,0,1,0,22,14.05,1,1,0,0,0,21.64,13Zm-9.5,6.69A8.14,8.14,0,0,1,7.08,5.22v.27A10.15,10.15,0,0,0,17.22,15.63a9.79,9.79,0,0,0,2.1-.22A8.11,8.11,0,0,1,12.14,19.73Z" />
            </svg>
          </label>
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
