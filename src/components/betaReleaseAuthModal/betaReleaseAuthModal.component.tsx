import { useApolloClient } from "@apollo/client";
import { Dialog } from "@headlessui/react";
import clsx from "clsx";
import React, { useEffect, useState } from "react";
import { useDebounce } from "use-debounce";

import { Button } from "src/components/button";
import { TextInput } from "src/components/textInput";
import {
  LOCAL_STORAGE,
  SAAS_API_ENDPOINT,
  SAAS_API_KEY,
} from "src/constants/skylark";
import { useConnectedToSkylark } from "src/hooks/useConnectedToSkylark";
import { createBasicSkylarkClient } from "src/lib/graphql/skylark/client";

interface AddAuthTokenModalProps {
  isOpen: boolean;
  setIsOpen: (b: boolean) => void;
}

export const AddAuthTokenModal = ({
  isOpen,
  setIsOpen,
}: AddAuthTokenModalProps) => {
  const skylarkClient = useApolloClient();

  const { connected, loading, invalidUri, invalidToken, setValidatorClient } =
    useConnectedToSkylark();

  const [inputUri, setInputUri] = useState<string | null>(null);
  const [inputToken, setInputToken] = useState<string | null>(null);
  const [debouncedUri] = useDebounce(inputUri, 750);
  const [debouncedToken] = useDebounce(inputToken, 750);

  useEffect(() => {
    const { origin } = window.location;
    // Timesaving in development to connect to sl-develop-10 when available unless in Storybook.
    const useDevelopmentDefaults =
      (origin.includes("http://localhost") &&
        !origin.includes("http://localhost:6006")) ||
      origin.includes("vercel.app");
    const developmentUri = useDevelopmentDefaults ? SAAS_API_ENDPOINT : null;
    const developmentToken = useDevelopmentDefaults ? SAAS_API_KEY : null;

    setInputUri(
      localStorage.getItem(LOCAL_STORAGE.betaAuth.uri) || developmentUri,
    );
    setInputToken(
      localStorage.getItem(LOCAL_STORAGE.betaAuth.token) || developmentToken,
    );
  }, []);

  useEffect(() => {
    if (debouncedUri) {
      const validatingRequestClient = createBasicSkylarkClient(
        debouncedUri,
        debouncedToken || "",
      );
      setValidatorClient(validatingRequestClient);
      return;
    }
    setValidatorClient(undefined);
  }, [debouncedUri, debouncedToken, setValidatorClient]);

  // Show loading state before the debounced values have been updated
  const requestLoading =
    loading || inputUri !== debouncedUri || inputToken !== debouncedToken;

  const updateLocalStorage = async () => {
    if (debouncedUri && debouncedToken) {
      localStorage.setItem(LOCAL_STORAGE.betaAuth.uri, debouncedUri);
      localStorage.setItem(LOCAL_STORAGE.betaAuth.token, debouncedToken);

      await skylarkClient.refetchQueries({
        include: "all",
      });
      setIsOpen(false);
    }
  };

  return (
    <Dialog
      open={isOpen}
      onClose={() => setIsOpen(false)}
      className="font-body relative z-50"
    >
      <div
        className="fixed inset-0 bg-black/40"
        aria-hidden="true"
        data-testid="dialog-background"
      />

      <div className="fixed inset-0 flex items-center justify-center p-2 text-sm">
        <Dialog.Panel className="mx-auto max-w-lg rounded bg-white p-6 md:p-10">
          <Dialog.Title className="mb-2 font-heading text-2xl md:mb-4 md:text-3xl">
            Connect to Skylark
          </Dialog.Title>

          <Dialog.Description>
            Enter your GraphQL URI and API Key below to connect to your Skylark
            instance.
          </Dialog.Description>

          <div className="my-6 flex flex-col gap-4 md:my-10">
            <TextInput
              value={inputUri || ""}
              onChange={setInputUri}
              label="GraphQL URL"
              tabIndex={-1}
              className={clsx(
                debouncedUri && "border-2 outline-none",
                requestLoading && "border-warning",
                !requestLoading &&
                  debouncedUri &&
                  (invalidUri ? "border-error" : "border-success"),
              )}
            />

            <TextInput
              value={inputToken || ""}
              onChange={setInputToken}
              label="API Key"
              tabIndex={-1}
              className={clsx(
                debouncedUri && "border-2 outline-none",
                requestLoading && "border-warning",
                !requestLoading &&
                  debouncedUri &&
                  (invalidToken ? "border-error" : "border-success"),
              )}
            />
          </div>

          <div className="flex w-full flex-row justify-end">
            <Button
              variant="primary"
              disabled={!connected || !debouncedUri || !debouncedToken}
              onClick={() => updateLocalStorage()}
              loading={requestLoading}
            >
              {requestLoading ? "Validating" : "Connect"}
            </Button>
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
};
