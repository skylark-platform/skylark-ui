import { GraphiQL } from "graphiql";
import "graphiql/graphiql.min.css";
import { useState, useEffect } from "react";

import { LOCAL_STORAGE, REQUEST_HEADERS } from "src/constants/skylark";

export default function GraphQLQueryEditor() {
  const [environment, setEnvironment] = useState<{
    uri: string;
    token: string;
  } | null>(null);

  useEffect(() => {
    const uri = localStorage.getItem(LOCAL_STORAGE.betaAuth.uri) as string;
    const token = localStorage.getItem(LOCAL_STORAGE.betaAuth.token) as string;
    setEnvironment({ uri, token });
  }, []);

  return (
    <div className="pt-nav h-full w-full">
      {environment && (
        <GraphiQL
          fetcher={async (graphQLParams) => {
            const data = await fetch(environment.uri, {
              method: "POST",
              headers: {
                Accept: "application/json",
                "Content-Type": "application/json",
                [REQUEST_HEADERS.apiKey]: environment.token,
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
