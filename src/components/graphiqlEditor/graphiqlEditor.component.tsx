import { useExplorerPlugin } from "@graphiql/plugin-explorer";
import "@graphiql/plugin-explorer/dist/style.css";
import { Fetcher } from "@graphiql/toolkit";
import { GraphiQL } from "graphiql";
import "graphiql/graphiql.min.css";
import { useMemo, useState } from "react";

import { REQUEST_HEADERS } from "src/constants/skylark";

export const DEFAULT_QUERY = `# Welcome to Skylark's GraphQL Editor
#
# Skylark uses GraphiQL as an in-browser tool for writing, validating, and
# testing GraphQL queries against your Skylark account.
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

interface GraphiQLEditorProps {
  uri: string;
  token: string;
  defaultQuery: string;
}

export const GraphiQLEditor = ({
  uri,
  token,
  defaultQuery,
}: GraphiQLEditorProps) => {
  // We only update the GraphiQL query when the explorer changes to stop the cursor jumping around
  const [query, setQuery] = useState(defaultQuery);
  const [explorerQuery, setExplorerQuery] = useState(query);

  const fetcher: Fetcher = useMemo(
    () => async (graphQLParams, opts) => {
      const data = await fetch(uri, {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          [REQUEST_HEADERS.apiKey]: token,
          [REQUEST_HEADERS.betaApiKey]: token,
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
    query: explorerQuery,
    onEdit: (updatedQuery: string) => {
      setExplorerQuery(updatedQuery);
      setQuery(updatedQuery);
    },
  });

  return (
    <GraphiQL
      query={query}
      onEditQuery={setExplorerQuery}
      plugins={[explorerPlugin]}
      fetcher={fetcher}
    >
      <GraphiQL.Logo>Query Editor</GraphiQL.Logo>
    </GraphiQL>
  );
};
