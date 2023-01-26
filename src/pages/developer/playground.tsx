import { useExplorerPlugin } from "@graphiql/plugin-explorer";
import "@graphiql/plugin-explorer/dist/style.css";
import { Fetcher } from "@graphiql/toolkit";
import { GraphiQL } from "graphiql";
import "graphiql/graphiql.min.css";
import { DocumentNode, GraphQLSchema } from "graphql";
import { useEffect, useMemo, useRef, useState } from "react";

import { LOCAL_STORAGE, REQUEST_HEADERS } from "src/constants/skylark";
import { useConnectedToSkylark } from "src/hooks/useConnectedToSkylark";

const DEFAULT_QUERY = `# Welcome to Skylark's GraphQL Playground
#
# Skylark uses GraphiQL as an in-browser tool for writing, validating, and
# testing GraphQL queries against your Skylark instance.
#
# Type queries into this side of the screen, and you will see intelligent
# typeaheads aware of the current GraphQL type schema and live syntax and
# validation errors highlighted within the text.
#
# GraphQL queries typically start with a "{" character. Lines that start
# with a # are ignored.
#
# An example GraphQL query might look like:
#
#     {
#       search(query: "my search query") {
#         objects {
#           uid
#           external_id
#         }
#       }
#     }
#
# For information on Skylark's queries and mutations,
# view the documentation: https://docs.skylarkplatform.com/
#
# Keyboard shortcuts:
#
#   Prettify query:  Shift-Ctrl-P (or press the prettify button)
#
#  Merge fragments:  Shift-Ctrl-M (or press the merge button)
#
#        Run Query:  Ctrl-Enter (or press the play button)
#
#    Auto Complete:  Ctrl-Space (or just start typing)
#
`;

const getEnvironmentFromLocalStorage = () => {
  const uri = localStorage.getItem(LOCAL_STORAGE.betaAuth.uri) || "";
  const token = localStorage.getItem(LOCAL_STORAGE.betaAuth.token) || "";
  return { uri, token };
};

export default function GraphQLQueryEditor() {
  const { connected } = useConnectedToSkylark();
  const [query, setQuery] = useState(DEFAULT_QUERY);
  const [{ uri, token }, setEnvironment] = useState({ uri: "", token: "" });

  useEffect(() => {
    // Default to light theme https://github.com/graphql/graphiql/issues/2924
    const storedTheme = localStorage.getItem("graphiql:theme");
    if (!storedTheme) {
      localStorage.setItem("graphiql:theme", "light");
    }

    const refresh = () => {
      setEnvironment(getEnvironmentFromLocalStorage());
    };
    refresh();
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener("storage", refresh);
    };
  }, []);

  const fetcher: Fetcher = useMemo(
    () => async (graphQLParams, opts) => {
      const data = await fetch(uri, {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          [REQUEST_HEADERS.apiKey]: token,
          ...opts?.headers,
        },
        body: JSON.stringify(graphQLParams),
        credentials: "same-origin",
      });
      return data.json().catch(() => data.text());
    },
    [token, uri],
  );

  const explorerPlugin = useExplorerPlugin({
    query,
    onEdit: setQuery,
  });

  return (
    <div className="pt-nav h-full w-full">
      {connected && uri && token && (
        <GraphiQL
          query={query}
          onEditQuery={setQuery}
          plugins={[explorerPlugin]}
          fetcher={fetcher}
        >
          <GraphiQL.Logo>GraphQL Playground</GraphiQL.Logo>
        </GraphiQL>
      )}
    </div>
  );
}
