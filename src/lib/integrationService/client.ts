import { LOCAL_STORAGE } from "src/constants/localStorage";
import { REQUEST_HEADERS, SAAS_API_ENDPOINT } from "src/constants/skylark";
import { SkylarkCreds } from "src/hooks/useConnectedToSkylark";

// hook.skylarkplatform.com/upload_url/video/mux

export const integrationServiceRequest = <T>(
  endpoint: string,
  integrationToken: string,
  uid: string,
  headers?: HeadersInit,
) => {
  // get the authentication token from local storage if it exists
  const localStorageCreds = localStorage.getItem(LOCAL_STORAGE.auth.active);
  const { uri, token }: SkylarkCreds = localStorageCreds
    ? JSON.parse(localStorageCreds)
    : { uri: "", token: "" };

  const tokenToSend = uri ? token || "" : "";

  // hook.skylarkplatform.com
  // https://hook.sl-f-sl-2946.development.skylarkplatform.com/upload-url/video/mux/b9fda8e2-4a4c-4f1e-a6a8-26cc8d36a823

  const integrationServiceUrl = `https://hook.sl-f-sl-2946.development.skylarkplatform.com${endpoint}/${integrationToken}/${uid}`;

  return fetch(integrationServiceUrl, { headers });
};
