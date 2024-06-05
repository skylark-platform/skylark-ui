import { explorerPlugin } from "@graphiql/plugin-explorer";
import "@graphiql/plugin-explorer/dist/style.css";
import {
  FetcherParams,
  FetcherOpts,
  FetcherReturnType,
} from "@graphiql/toolkit";
import dayjs from "dayjs";
import { GraphiQL } from "graphiql";
import "graphiql/graphiql.min.css";
import { useMemo, useState } from "react";

import { HREFS, REQUEST_HEADERS } from "src/constants/skylark";
import { wrapQueryName } from "src/lib/graphql/skylark/dynamicQueries";

import { skylarkHeadersPlugin } from "./plugins/skylarkHeadersPlugin.component";
import { skylarkQueriesPlugin } from "./plugins/skylarkQueriesPlugin.component";

const GRAPHIQL_INTROSPECTION_NAME = wrapQueryName(
  "GRAPHIQL_INTROSPECTION_QUERY",
);

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
# view the documentation: ${HREFS.apiDocs.root}
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

const explorer = explorerPlugin({ showAttribution: true });

const skylarkSettingsPlugin = skylarkHeadersPlugin();

const skylarkQueryPlugin = skylarkQueriesPlugin();

const createGraphQLFetcher =
  (
    uri: string,
    token: string,
    setRequestTimeElapsed: (ms: number | null) => void,
  ) =>
  (graphQLParams: FetcherParams, opts?: FetcherOpts): FetcherReturnType => {
    const before = dayjs();
    let after: dayjs.Dayjs | null = null;

    setRequestTimeElapsed(null);

    return fetch(uri, {
      method: "post",
      headers: {
        [REQUEST_HEADERS.apiKey]: token,
        ...opts?.headers,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(graphQLParams),
      credentials: "omit",
    })
      .then((response) => {
        after = dayjs();
        return response.json();
      })
      .then((json) => {
        if (
          after &&
          graphQLParams.operationName !== GRAPHIQL_INTROSPECTION_NAME &&
          json?.data
        ) {
          const timeElapsed = after.diff(before, "millisecond");
          setRequestTimeElapsed(timeElapsed);
        }
        return json;
      });
  };

export const GraphiQLEditor = ({
  uri,
  token,
  defaultQuery,
}: GraphiQLEditorProps) => {
  const [responseTime, setResponseTime] = useState<number | null>(null);

  const fetcher = useMemo(
    () => createGraphQLFetcher(uri, token, setResponseTime),
    [token, uri],
  );

  return (
    <GraphiQL
      defaultQuery={defaultQuery}
      plugins={[explorer, skylarkSettingsPlugin, skylarkQueryPlugin]}
      // storage={}
      fetcher={fetcher}
      shouldPersistHeaders={true}
      showPersistHeadersSettings={false}
      introspectionQueryName={GRAPHIQL_INTROSPECTION_NAME}
      defaultEditorToolsVisibility="headers"
      visiblePlugin={skylarkSettingsPlugin}
    >
      <GraphiQL.Logo>Query Editor</GraphiQL.Logo>

      <GraphiQL.Footer>
        <div className="h-14 flex items-center mx-4">
          {responseTime !== null && (
            <p className="text-sm text-manatee-600">{responseTime}ms</p>
          )}
        </div>
      </GraphiQL.Footer>
    </GraphiQL>
  );
};
