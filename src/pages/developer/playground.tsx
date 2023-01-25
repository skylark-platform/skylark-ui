import { useExplorerPlugin } from "@graphiql/plugin-explorer";
import "@graphiql/plugin-explorer/dist/style.css";
import { GraphiQL } from "graphiql";
import "graphiql/graphiql.min.css";
import { GraphQLSchema } from "graphql";
import { useEffect, useMemo, useState } from "react";

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
  const [schema, setSchema] = useState<GraphQLSchema | undefined>();

  const { uri, token } = useMemo(() => {
    return connected
      ? getEnvironmentFromLocalStorage()
      : { uri: "", token: "" };
  }, [connected]);

  const explorerPlugin = useExplorerPlugin({
    query,
    onEdit: setQuery,
  });

  useEffect(() => {
    // Default to light theme https://github.com/graphql/graphiql/issues/2924
    const storedTheme = localStorage.getItem("graphiql:theme");
    if (!storedTheme) {
      localStorage.setItem("graphiql:theme", "light");
    }
  });

  return (
    <div className="pt-nav h-full w-full">
      {connected && uri && token && (
        <GraphiQL
          defaultQuery={query}
          schema={schema}
          query={query}
          headers={JSON.stringify({ "x-time-travel": "" })}
          onEditQuery={setQuery}
          isHeadersEditorEnabled={true}
          plugins={[explorerPlugin]}
          onSchemaChange={setSchema}
          fetcher={async (graphQLParams, opts) => {
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
          }}
        >
          <GraphiQL.Logo>GraphQL Playground</GraphiQL.Logo>
        </GraphiQL>
      )}
    </div>
  );
}
