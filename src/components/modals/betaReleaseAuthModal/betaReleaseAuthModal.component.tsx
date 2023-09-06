import { Dialog } from "@headlessui/react";
import { useQueryClient } from "@tanstack/react-query";
import clsx from "clsx";
import { usePlausible } from "next-plausible";
import React, { useEffect, useState } from "react";
import { useDebouncedCallback } from "use-debounce";

import { Button } from "src/components/button";
import { CopyToClipboard } from "src/components/copyToClipboard/copyToClipboard.component";
import { FiX } from "src/components/icons";
import { TextInput } from "src/components/inputs/textInput";
import { LOCAL_STORAGE } from "src/constants/localStorage";
import { QueryKeys } from "src/enums/graphql";
import {
  SkylarkCreds,
  getSkylarkCredsFromLocalStorage,
  useConnectedToSkylark,
} from "src/hooks/useConnectedToSkylark";
import { useUserAccount } from "src/hooks/useUserAccount";

interface AddAuthTokenModalProps {
  isOpen: boolean;
  setIsOpen: (b: boolean) => void;
}

export const AddAuthTokenModal = ({
  isOpen,
  setIsOpen,
}: AddAuthTokenModalProps) => {
  const queryClient = useQueryClient();
  const plausible = usePlausible();

  const { isConnected, isLoading, invalidUri, invalidToken, setCreds } =
    useConnectedToSkylark();

  const { account } = useUserAccount();

  const [{ uri: inputUri, token: inputToken }, setInputCreds] =
    useState<SkylarkCreds>(() => getSkylarkCredsFromLocalStorage(true));

  const [{ uri: debouncedUri, token: debouncedToken }, setDebouncedCreds] =
    useState<SkylarkCreds>(() => getSkylarkCredsFromLocalStorage(true));

  const debouncedSetCreds = useDebouncedCallback((creds: SkylarkCreds) => {
    setDebouncedCreds(creds);
    if (creds.uri) {
      setCreds(creds);
    } else {
      setCreds({ uri: null, token: null });
    }
  }, 750);

  if (
    (!isOpen && !isLoading && !isConnected) ||
    (!isOpen && (!debouncedUri || !debouncedToken))
  ) {
    setIsOpen(true);
  }

  useEffect(() => {
    const updateInputsFromLocalStorage = () => {
      const creds = getSkylarkCredsFromLocalStorage(true);
      setInputCreds(creds);
      setDebouncedCreds(creds);
    };

    window.addEventListener("storage", updateInputsFromLocalStorage);
    return () => {
      window.removeEventListener("storage", updateInputsFromLocalStorage);
    };
  }, []);

  // Show loading state before the debounced values have been updated
  const requestLoading =
    (debouncedUri && debouncedToken && isLoading) ||
    inputUri !== debouncedUri ||
    inputToken !== debouncedToken;

  const updateLocalStorage = async () => {
    if (debouncedUri && debouncedToken) {
      plausible("connectedToSkylark", { props: { skylark_url: debouncedUri } });
      localStorage.setItem(LOCAL_STORAGE.betaAuth.uri, debouncedUri);
      localStorage.setItem(LOCAL_STORAGE.betaAuth.token, debouncedToken);
      // storage events are not picked up in the same tab, so dispatch it for the current one
      window.dispatchEvent(new Event("storage"));

      queryClient.resetQueries({ queryKey: [] });
      await queryClient.refetchQueries({
        queryKey: [QueryKeys.Schema],
        type: "active",
      });
      await queryClient.refetchQueries({
        queryKey: [QueryKeys.AccountStatus],
      });

      setIsOpen(false);
    }
  };

  const closeModal = () => {
    setIsOpen(false);
  };

  return (
    <Dialog
      open={isOpen}
      onClose={closeModal}
      className="font-body relative z-50"
    >
      <div
        className="fixed inset-0 bg-black/40"
        aria-hidden="true"
        data-testid="dialog-background"
      />

      <div className="fixed inset-0 flex items-center justify-center p-2 text-sm">
        <Dialog.Panel className="relative mx-auto max-w-lg rounded bg-white p-6 md:p-10">
          <button
            aria-label="close"
            className="absolute right-4 top-4 sm:right-8 sm:top-9"
            onClick={closeModal}
            tabIndex={-1}
          >
            <FiX className="text-lg" />
          </button>

          <Dialog.Title className="mb-2 font-heading text-2xl md:mb-4 md:text-3xl">
            Connect to Skylark
          </Dialog.Title>
          <Dialog.Description>
            Enter your GraphQL URI and API Key below to connect to your Skylark
            account.
          </Dialog.Description>
          {account?.accountId && (
            <div className="mt-2 flex items-center">
              <p>
                Currently connected to:{" "}
                <code className="rounded-sm bg-manatee-200 p-1">
                  {account?.accountId}
                </code>
              </p>
              <CopyToClipboard value={account?.accountId} />
            </div>
          )}
          <div className="my-4 flex flex-col space-y-2 md:my-10">
            <TextInput
              value={inputUri || ""}
              onChange={(uri) => {
                setInputCreds((prev) => ({ ...prev, uri }));
                debouncedSetCreds({ token: inputToken, uri });
              }}
              label="GraphQL URL"
              className={clsx(
                "pr-9",
                debouncedUri && "border-2 outline-none",
                requestLoading && "border-warning",
                !requestLoading &&
                  debouncedUri &&
                  (invalidUri ? "border-error" : "border-success"),
              )}
              withCopy
            />

            <TextInput
              value={inputToken || ""}
              onChange={(token) => {
                setInputCreds((prev) => ({ ...prev, token }));
                debouncedSetCreds({ uri: inputUri, token });
              }}
              label="API Key"
              tabIndex={-1}
              className={clsx(
                "pr-9",
                debouncedUri && "border-2 outline-none",
                requestLoading && "border-warning",
                !requestLoading &&
                  debouncedUri &&
                  (invalidToken ? "border-error" : "border-success"),
              )}
              withCopy
            />
          </div>
          <div className="flex w-full flex-row justify-end">
            <Button
              variant="primary"
              disabled={!isConnected || !debouncedUri || !debouncedToken}
              onClick={() => updateLocalStorage()}
              loading={requestLoading}
              type="button"
            >
              {requestLoading ? "Validating" : "Connect"}
            </Button>
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
};
