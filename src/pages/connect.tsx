import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/router";
import { useEffect } from "react";

import { useSkylarkCreds } from "src/hooks/localStorage/useCreds";

const decodeToken = (token: string | string[] | undefined) => {
  if (!token || Array.isArray(token)) {
    return;
  }

  const decodedString = atob(token);
  const splitStr = decodedString.split("__");

  if (splitStr.length !== 2) {
    return;
  }

  return {
    uri: splitStr[0],
    apiKey: splitStr[1],
  };
};

export default function BetaConnect() {
  const { query, push: navigateTo } = useRouter();
  const queryClient = useQueryClient();

  const [, saveCreds] = useSkylarkCreds();

  useEffect(() => {
    const uriAndApiKeyFromToken = decodeToken(query.token);

    const uri = uriAndApiKeyFromToken?.uri || query.uri;
    const apiKey = uriAndApiKeyFromToken?.apiKey || query.apikey;

    console.log({ uri, apiKey, uriAndApiKeyFromToken });

    if (uri && apiKey) {
      saveCreds({
        uri: uri as string,
        token: apiKey as string,
      });

      queryClient.clear();

      const redirectUrl =
        query.redirect && typeof query.redirect === "string"
          ? query.redirect
          : "/";

      // storage events are not picked up in the same tab, so dispatch it for the current one
      window.dispatchEvent(new Event("storage"));
      navigateTo(redirectUrl);
    }
  }, [query, navigateTo, queryClient, saveCreds]);

  return (
    <div className="flex h-screen w-screen flex-col items-center justify-center space-y-2">
      <h1 className="mb-4 font-heading text-3xl">Skylark Auto Connect</h1>
      {!query.uri || !query.apikey ? (
        <>
          <p>
            Enter your Skylark URI and API Key into the URL to auto connect.
          </p>
          <p>
            {"Format: "}
            <code>
              {"?uri=${skylark_graphql_url}&apikey=${skylark_api_key}"}
            </code>
          </p>
        </>
      ) : (
        <>
          <p>URI and API Key found in URL.</p>
          <p>Adding to Local Storage and redirecting to Content Library.</p>
        </>
      )}
    </div>
  );
}
