import { Dispatch, useEffect } from "react";
import { useLocalStorage } from "usehooks-ts";

import { LOCAL_STORAGE } from "src/constants/localStorage";

import { SkylarkCreds } from "./useConnectedToSkylark";

export const useCredsFromLocalStorage = (): [
  SkylarkCreds | null,
  Dispatch<SkylarkCreds | null>,
] => {
  const [creds, setCreds] = useLocalStorage<SkylarkCreds | null>(
    LOCAL_STORAGE.auth.active,
    null,
  );

  useEffect(() => {
    const oldUri = localStorage.getItem(LOCAL_STORAGE.betaAuth.uri);
    const oldToken = localStorage.getItem(LOCAL_STORAGE.betaAuth.token);

    if (!creds) {
      setCreds({ uri: oldUri || "", token: oldToken || "" });

      // TODO remove in future
      // localStorage.removeItem(LOCAL_STORAGE.betaAuth.uri);
      // localStorage.removeItem(LOCAL_STORAGE.betaAuth.token);
    }
  }, [creds, setCreds]);

  return [creds, setCreds];
};
