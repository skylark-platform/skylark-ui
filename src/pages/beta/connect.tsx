import { useRouter } from "next/router";
import { useEffect } from "react";

import { LOCAL_STORAGE } from "src/constants/skylark";

export default function BetaConnect() {
  const { query, push: navigateTo } = useRouter();

  useEffect(() => {
    if (query.uri && query.apikey) {
      localStorage.setItem(LOCAL_STORAGE.betaAuth.uri, query.uri as string);
      localStorage.setItem(
        LOCAL_STORAGE.betaAuth.token,
        query.apikey as string,
      );
      // storage events are not picked up in the same tab, so dispatch it for the current one
      window.dispatchEvent(new Event("storage"));
      navigateTo("/");
    }
  }, [query, navigateTo]);

  return (
    <div className="flex h-screen w-screen flex-col items-center justify-center gap-4">
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
