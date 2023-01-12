// This is meant only for the beta to set a localStorage variable containing a customers API Key.
// They supply the key, and we add it to localStorage
import {
  ApolloClient,
  InMemoryCache,
  NormalizedCacheObject,
  ServerError,
  useApolloClient,
  useQuery,
} from "@apollo/client";
import { Dialog, Transition } from "@headlessui/react";
import clsx from "clsx";
import React, { Fragment, useEffect, useState } from "react";
import { useDebounce } from "use-debounce";

import { Button } from "src/components/button";
import { TextInput } from "src/components/textInput";
import {
  LOCAL_STORAGE,
  SAAS_API_ENDPOINT,
  SAAS_API_KEY,
} from "src/constants/skylark";
import { GET_SKYLARK_OBJECT_TYPES } from "src/lib/graphql/skylark/queries";

interface AddAuthTokenModalProps {
  isOpen: boolean;
  setIsOpen: (b: boolean) => void;
}

// TODO create custom hook useConnectedToSkylark:
//   - Checks that the URI and token is set in localStorage
//   - Has a value connected that can be read to test whether Skylark is configured
//   - Potentially feedback whether the URI exists but the token is incorrect (401)

// Then display this component on a load when the client does not have any values in localStorage
// Optionally, read URI and token from UI URL

// If on localhost or vercel.app preview domain, fallback to SAAS variables

export const AddAuthTokenModal = ({
  isOpen,
  setIsOpen,
}: AddAuthTokenModalProps) => {
  const skylarkClient = useApolloClient();

  const [uri, setUri] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [debouncedUri] = useDebounce(uri, 750);
  const [debouncedToken] = useDebounce(token, 750);

  const [validatorClient, setValidatorClient] =
    useState<ApolloClient<NormalizedCacheObject> | null>(null);

  const { data, error, loading } = useQuery(GET_SKYLARK_OBJECT_TYPES, {
    skip: !debouncedUri,
    client: validatorClient as ApolloClient<NormalizedCacheObject>,
  });

  const unauthenticated =
    error?.networkError?.name === "ServerError" &&
    (error.networkError as ServerError).statusCode === 401;
  const invalidUri = !data && (!error || !unauthenticated);
  const invalidToken = !debouncedToken || (error && unauthenticated);

  // Show loading state before the debounced values have been updated
  const requestLoading =
    loading || uri !== debouncedUri || token !== debouncedToken;

  useEffect(() => {
    // const validateUriAndClient = async () => {
    const validatingRequestClient = new ApolloClient({
      uri: debouncedUri || "",
      cache: new InMemoryCache(),
      headers: {
        "x-api-key": debouncedToken || "",
      },
    });
    setValidatorClient(validatingRequestClient);
  }, [debouncedUri, debouncedToken]);

  const updateLocalStorage = async () => {
    localStorage.setItem(LOCAL_STORAGE.betaAuth.uri, SAAS_API_ENDPOINT);
    localStorage.setItem(LOCAL_STORAGE.betaAuth.token, SAAS_API_KEY);

    await skylarkClient.refetchQueries({
      // we could use "active" but for the Beta we play it safe
      // https://www.apollographql.com/docs/react/data/refetching/#refetching-all-queries
      include: "all",
    });
    setIsOpen(false);
  };

  return (
    <Dialog
      open={isOpen}
      onClose={() => setIsOpen(false)}
      className="font-body relative z-50"
    >
      <div className="fixed inset-0 bg-black/40" aria-hidden="true" />

      <div className="fixed inset-0 flex items-center justify-center p-2 text-sm">
        {/* The actual dialog panel  */}
        <Dialog.Panel className="mx-auto max-w-lg rounded bg-white p-6 md:p-10">
          <Dialog.Title className="mb-2 font-heading text-2xl md:mb-4 md:text-3xl">
            Connect to Skylark
          </Dialog.Title>

          <Dialog.Description className="">
            Enter your GraphQL URI and Access Token below to connect to your
            Skylark instance.
          </Dialog.Description>

          <div className="my-6 flex flex-col gap-4 md:my-10">
            <TextInput
              value={uri || ""}
              onChange={setUri}
              label="Skylark URI"
              className={clsx(
                debouncedUri && "outline",
                requestLoading && "outline-warning",
                !requestLoading &&
                  debouncedUri &&
                  (invalidUri ? "outline-error" : "outline-success"),
              )}
            />

            <TextInput
              value={token || ""}
              onChange={setToken}
              label="Access Token"
              className={clsx(
                debouncedUri && "outline",
                requestLoading && "outline-warning",
                !requestLoading &&
                  debouncedUri &&
                  (invalidToken ? "outline-error" : "outline-success"),
              )}
            />
          </div>

          {/* <p>{SAAS_API_ENDPOINT}</p>
          <p>{SAAS_API_KEY}</p> */}

          <div className="flex w-full flex-row justify-end">
            <Button variant="ghost" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              disabled={invalidUri || invalidToken || !data}
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
