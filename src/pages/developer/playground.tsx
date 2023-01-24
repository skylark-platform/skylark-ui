import { GraphiQL } from "graphiql";
import "graphiql/graphiql.min.css";
import { useMemo } from "react";

import { LOCAL_STORAGE, REQUEST_HEADERS } from "src/constants/skylark";
import { useConnectedToSkylark } from "src/hooks/useConnectedToSkylark";

const getEnvironmentFromLocalStorage = () => {
  const uri = localStorage.getItem(LOCAL_STORAGE.betaAuth.uri) || "";
  const token = localStorage.getItem(LOCAL_STORAGE.betaAuth.token) || "";
  return { uri, token };
};

export default function GraphQLQueryEditor() {
  const { connected } = useConnectedToSkylark();
  const { uri, token } = useMemo(getEnvironmentFromLocalStorage, [connected]);

  return (
    <div className="pt-nav h-full w-full">
      {connected && uri && token && (
        <GraphiQL
          isHeadersEditorEnabled={false}
          fetcher={async (graphQLParams) => {
            const data = await fetch(uri, {
              method: "POST",
              headers: {
                Accept: "application/json",
                "Content-Type": "application/json",
                [REQUEST_HEADERS.apiKey]: token,
              },
              body: JSON.stringify(graphQLParams),
              credentials: "same-origin",
            });
            return data.json().catch(() => data.text());
          }}
        />
      )}
    </div>
  );
}
