import { LOCAL_STORAGE } from "src/constants/localStorage";
import { SkylarkCreds } from "src/hooks/useConnectedToSkylark";

// hook.skylarkplatform.com/upload_url/video/mux

export const integrationServiceRequest = async <T>(
  endpoint: string,
  {
    body,
    headers,
    method,
  }: { body?: object; headers?: HeadersInit; method?: string },
) => {
  // get the authentication token from local storage if it exists
  const localStorageCreds = localStorage.getItem(LOCAL_STORAGE.auth.active);
  const { uri, token }: SkylarkCreds = localStorageCreds
    ? JSON.parse(localStorageCreds)
    : { uri: "", token: "" };

  const tokenToSend = uri ? token || "" : "";

  // hook.skylarkplatform.com
  // https://hook.sl-f-sl-2946.development.skylarkplatform.com/upload-url/video/mux/b9fda8e2-4a4c-4f1e-a6a8-26cc8d36a823

  // const integrationServiceUrl = `https://hook.sl-f-sl-2946.development.skylarkplatform.com${endpoint}/${integrationToken}/${uid}`;

  const bodyWithCreds =
    method === "POST"
      ? {
          skylark_api_url: uri,
          skylark_api_key: tokenToSend,
          ...body,
        }
      : undefined;

  const hookDomain = uri.split("skylarkplatform.com")?.[0]?.split("api.")?.[1];
  const integrationServiceUrl = `https://hook.${hookDomain}skylarkplatform.com`;

  const url = new URL(endpoint, integrationServiceUrl);
  console.log({
    hookDomain,
    integrationServiceUrl,
    bodyWithCreds,
    endpoint,
    url,
    urlToString: url.toString(),
  });

  const response = await fetch(url, {
    headers: {
      ...headers,
      "Content-Type": "application/json",
      "x-skylark-api-url": uri,
      "x-skylark-api-key": tokenToSend,
    },
    method: method || "GET",
    body: JSON.stringify(bodyWithCreds),
  });

  console.log({ response });

  return response.json() as Promise<T>;
};
