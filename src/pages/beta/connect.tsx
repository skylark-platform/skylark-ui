import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/router";
import { useEffect } from "react";

import { useSkylarkCreds } from "src/hooks/localStorage/useCreds";

export default function BetaConnect() {
  const { query, push: navigateTo } = useRouter();
  const queryClient = useQueryClient();

  const [, saveCreds] = useSkylarkCreds();

  useEffect(() => {
    if (query.uri && query.apikey) {
      saveCreds({
        uri: query.uri as string,
        token: query.apikey as string,
      });

      queryClient.clear();

      // storage events are not picked up in the same tab, so dispatch it for the current one
      window.dispatchEvent(new Event("storage"));
      navigateTo("/");
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
