import { LOCAL_STORAGE } from "src/constants/localStorage";
import { SkylarkCreds } from "src/hooks/useConnectedToSkylark";

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
  const hookDomain =
    uri.split("skylarkplatform.com")?.[0]?.split("api.")?.[1] || "";
  const integrationServiceUrl = `https://hook.${hookDomain}skylarkplatform.com`;

  const url = new URL(endpoint, integrationServiceUrl);

  const response = await fetch(url, {
    headers: {
      ...headers,
      "Content-Type": "application/json",
      "x-skylark-api-url": uri,
      "x-skylark-api-key": tokenToSend,
    },
    method: method || "GET",
    body: body ? JSON.stringify(body) : undefined,
  });

  return response.json() as Promise<T>;
};
