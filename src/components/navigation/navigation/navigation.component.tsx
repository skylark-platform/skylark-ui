import { Menu } from "@headlessui/react";
import { sentenceCase } from "change-case";
import clsx from "clsx";
import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import { FiGithub, FiKey, FiLogOut } from "react-icons/fi";
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
import { useUserAccount } from "src/hooks/useUserAccount";
import { formatUriAsCustomerIdentifer } from "src/lib/utils";

import Logo from "public/images/skylark.png";

export const Navigation = () => {
  const isClient = useIsClient();

  const { permissions, role } = useUserAccount();

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

  const dropdownOptions = useMemo(() => {
    const options = [
      {
        id: "change-skylark",
        text: "Change Skylark Account",
        onClick: () => setAuthModalOpen(true),
        Icon: <FiLogOut className="text-xl" />,
      },
      {
        id: "skylark-ui-github",
        text: "GitHub",
        href: "https://github.com/skylark-platform/skylark-ui",
        Icon: <FiGithub className="text-xl" />,
      },
    ];

    if (permissions?.includes("KEY_MANAGEMENT")) {
      options.splice(1, 0, {
        id: "manage-api-key",
        text: "Manage API Keys",
        href: "/settings/api-keys",
        Icon: <FiKey className="text-xl" />,
      });
    }

    return options;
  }, [permissions]);

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
          <DropdownMenu options={dropdownOptions} placement="bottom-end">
            <Menu.Button
              aria-label="User Settings Dropdown"
              className="flex w-full items-center justify-center text-base focus:outline-none focus-visible:ring-2 group-hover:text-black ui-open:text-black md:text-sm"
            >
              {role && (
                <span className="hidden font-normal text-manatee-500 md:inline mr-1 capitalize">{`${role.replaceAll("_", " ").toLocaleLowerCase()} -`}</span>
              )}
              <span
                className={clsx(
                  "hidden font-semibold md:inline capitalize",
                  "pr-3 md:pr-4",
                )}
              >
                {customerIdentifier}
              </span>
              <UserAvatar name={role || customerIdentifier || "S"} src="" />
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
