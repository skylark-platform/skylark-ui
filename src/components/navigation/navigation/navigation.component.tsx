import { Menu } from "@headlessui/react";
import clsx from "clsx";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { FiGithub, FiKey, FiLogOut } from "react-icons/fi";
import { useIsClient } from "usehooks-ts";

import { AccountStatus } from "src/components/account";
import { Button } from "src/components/button";
import {
  DropdownMenu,
  DropdownMenuOption,
} from "src/components/dropdown/dropdown.component";
import { Hamburger } from "src/components/navigation/hamburger";
import { NavigationLinks } from "src/components/navigation/links";
import { UserAvatar } from "src/components/user";
import { SEGMENT_KEYS } from "src/constants/segment";
import { useSkylarkCreds } from "src/hooks/localStorage/useCreds";
import { useAccountStatus } from "src/hooks/useAccountStatus";
import { useUserAccount } from "src/hooks/useUserAccount";
import { segment } from "src/lib/analytics/segment";
import { formatUriAsCustomerIdentifer } from "src/lib/utils";

import Logo from "public/images/skylark.png";

const AccountStatusAuthButton = ({
  openAuthModal,
}: {
  openAuthModal: () => void;
}) => {
  const { isConnected } = useAccountStatus({});

  return isConnected ? (
    <AccountStatus />
  ) : (
    <Button variant="outline" onClick={openAuthModal}>
      Connect to Skylark
    </Button>
  );
};

export const Navigation = ({
  openAuthModal,
}: {
  openAuthModal: () => void;
}) => {
  const isClient = useIsClient();

  const { permissions, role, defaultLanguage, accountId } = useUserAccount();

  const [open, setOpen] = useState(false);

  const [creds] = useSkylarkCreds();
  const customerIdentifier = isClient
    ? formatUriAsCustomerIdentifer(creds?.uri || "")
    : "";

  const dropdownOptions: DropdownMenuOption[] = useMemo(() => {
    const options: DropdownMenuOption[] = [
      {
        id: "change-skylark",
        text: "Change Skylark Account",
        onClick: openAuthModal,
        Icon: <FiLogOut className="text-xl" />,
      },
      {
        id: "skylark-ui-github",
        text: "GitHub",
        onClick: () => {
          segment.track(SEGMENT_KEYS.externalLink.github.ui);
        },
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
  }, [openAuthModal, permissions]);

  useEffect(() => {
    if (creds?.uri && role) {
      segment.identify({
        skylark: creds?.uri,
        role,
        accountId,
      });
    }
  }, [accountId, creds?.uri, role]);

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
          <AccountStatusAuthButton openAuthModal={openAuthModal} />
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
    </>
  );
};
