import { useQueryClient } from "@tanstack/react-query";
import clsx from "clsx";
import { usePlausible } from "next-plausible";
import React, { useEffect, useState } from "react";
import { useDebouncedCallback } from "use-debounce";

import { Button } from "src/components/button";
import { CopyToClipboard } from "src/components/copyToClipboard/copyToClipboard.component";
import { TextInput } from "src/components/inputs/textInput";
import { Modal } from "src/components/modals/base/modal";
import { QueryKeys } from "src/enums/graphql";
import { useSkylarkCreds } from "src/hooks/localStorage/useCreds";
import {
  SkylarkCreds,
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

  const { accountId } = useUserAccount();

  const [credsFromLocalStorage, saveCreds] = useSkylarkCreds();

  const [{ uri: inputUri, token: inputToken }, setInputCreds] =
    useState<SkylarkCreds>({ uri: "", token: "" });

  const [{ uri: debouncedUri, token: debouncedToken }, setDebouncedCreds] =
    useState<SkylarkCreds>({ uri: "", token: "" });

  const debouncedSetCreds = useDebouncedCallback((creds: SkylarkCreds) => {
    setDebouncedCreds(creds);
    if (creds.uri) {
      setCreds(creds);
    } else {
      setCreds(null);
    }
  }, 750);

  if (!isOpen && !isLoading && !isConnected) {
    setIsOpen(true);
  }

  useEffect(() => {
    if (credsFromLocalStorage) {
      setInputCreds(credsFromLocalStorage);
      setDebouncedCreds(credsFromLocalStorage);
    }
  }, [credsFromLocalStorage]);

  // Show loading state before the debounced values have been updated
  const requestLoading =
    (debouncedUri && debouncedToken && isLoading) ||
    inputUri !== debouncedUri ||
    inputToken !== debouncedToken;

  const updateLocalStorage = async () => {
    if (debouncedUri && debouncedToken) {
      plausible("connectedToSkylark", { props: { skylark_url: debouncedUri } });
      saveCreds({
        uri: debouncedUri,
        token: debouncedToken,
      });
      setCreds(null);

      queryClient.clear();
      await queryClient.invalidateQueries();
      await queryClient.refetchQueries({
        queryKey: [QueryKeys.Account],
        type: "all",
      });

      setIsOpen(false);
    }
  };

  const closeModal = () => {
    setIsOpen(false);
  };

  return (
    <Modal
      title="Connect to Skylark"
      description="Enter your GraphQL URI and API Key below to connect to your Skylark account."
      isOpen={isOpen}
      size="small"
      closeModal={closeModal}
    >
      {accountId && (
        <div className="mt-2 flex items-center">
          <p>
            Currently connected to:{" "}
            <code className="rounded-sm bg-manatee-200 p-1">{accountId}</code>
          </p>
          <CopyToClipboard value={accountId} />
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
              (invalidToken || debouncedToken === ""
                ? "border-error"
                : "border-success"),
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
    </Modal>
  );
};
