import { useExplorerPlugin } from "@graphiql/plugin-explorer";
import "@graphiql/plugin-explorer/dist/style.css";
import { Fetcher } from "@graphiql/toolkit";
import { GraphiQL } from "graphiql";
import "graphiql/graphiql.min.css";
import { useMemo, useState } from "react";

import { REQUEST_HEADERS } from "src/constants/skylark";

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

interface GraphiQLPlaygroundProps {
  uri: string;
  token: string;
}

export const GraphiQLPlayground = ({ uri, token }: GraphiQLPlaygroundProps) => {
  // We only update the GraphiQL query when the explorer changes to stop the cursor jumping around
  const [query, setQuery] = useState(DEFAULT_QUERY);
  const [explorerQuery, setExplorerQuery] = useState(query);

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
    explorerQuery,
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
      <GraphiQL.Logo>GraphQL Playground</GraphiQL.Logo>
    </GraphiQL>
  );
};
