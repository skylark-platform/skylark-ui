import { Dialog } from "@headlessui/react";
import { AnimatePresence, m } from "framer-motion";
import { DocumentNode, print, getOperationAST } from "graphql";
import dynamic from "next/dynamic";
import { useEffect, useMemo, useState } from "react";
import { FiCopy } from "react-icons/fi";
import { GrGraphQl } from "react-icons/gr";
import { v4 as uuidv4 } from "uuid";

import { Button } from "src/components/button";
import { FiX, Spinner } from "src/components/icons";
import {
  Tabs,
  convertStringArrToTabs,
} from "src/components/tabs/tabs.component";
import { Tooltip } from "src/components/tooltip/tooltip.component";
import { LOCAL_STORAGE } from "src/constants/localStorage";
import { SEGMENT_KEYS } from "src/constants/segment";
import { HREFS } from "src/constants/skylark";
import { segment } from "src/lib/analytics/segment";

interface GraphiQLTabStateTab {
  hash: null;
  headers: string | null;
  id: string;
  operationName: string;
  query: string;
  response: null;
  title: string;
  variables: string;
}

interface GraphiQLTabState {
  tabs?: GraphiQLTabStateTab[];
  activeTabIndex?: number;
}

interface GraphiQLQueriesStateQuery {
  headers: string | null;
  operationName: string | null;
  query: string;
  variables: string | null;
}

interface GraphiQLQueriesState {
  queries?: GraphiQLQueriesStateQuery[];
}

const getGraphiQLLocalStorageObject = <T,>(
  key: "tabState" | "queries",
): T | null => {
  try {
    const valueJSON = localStorage.getItem(LOCAL_STORAGE.graphiql[key]);
    if (!valueJSON) {
      return null;
    }

    const value: T = JSON.parse(valueJSON);
    return value;
  } catch (err) {
    return null;
  }
};

const setGraphiQLLocalStorageObject = (
  key: "tabState" | "queries",
  object: object,
) => {
  localStorage.setItem(LOCAL_STORAGE.graphiql[key], JSON.stringify(object));
};

const updateGraphiQLLocalStorage = (
  query: DocumentNode,
  formattedQuery: string,
  variables: object = {},
  headers?: HeadersInit,
) => {
  const operation = getOperationAST(query as DocumentNode);
  const operationName = operation && operation.name?.value;

  const newTab: GraphiQLTabStateTab = {
    id: uuidv4(),
    hash: null,
    operationName: operationName || "",
    query: formattedQuery,
    response: null,
    title: operationName || "",
    variables: JSON.stringify(variables),
    headers: headers ? JSON.stringify(headers) : null,
  };

  localStorage.setItem(LOCAL_STORAGE.graphiql.query, formattedQuery);
  localStorage.setItem(
    LOCAL_STORAGE.graphiql.variables,
    JSON.stringify(variables),
  );

  if (headers) {
    localStorage.setItem(
      LOCAL_STORAGE.graphiql.headers,
      JSON.stringify(headers),
    );
  }

  const tabState = getGraphiQLLocalStorageObject<GraphiQLTabState>("tabState");
  if (tabState) {
    const newTabs: GraphiQLTabState["tabs"] = [
      ...(tabState?.tabs || []),
      newTab,
    ];
    const updatedTabState: GraphiQLTabState = {
      tabs: newTabs,
      activeTabIndex: newTabs.length - 1,
    };
    setGraphiQLLocalStorageObject("tabState", updatedTabState);
  } else {
    const newTabState: GraphiQLTabState = {
      tabs: [newTab],
      activeTabIndex: 0,
    };
    setGraphiQLLocalStorageObject("tabState", newTabState);
  }

  const newQuery: GraphiQLQueriesStateQuery = {
    query: formattedQuery,
    variables: JSON.stringify(variables),
    headers: headers ? JSON.stringify(headers) : "",
    operationName: operationName || "",
  };

  const queriesState =
    getGraphiQLLocalStorageObject<GraphiQLQueriesState>("queries");
  if (queriesState) {
    const updatedQueries: GraphiQLQueriesState = {
      queries: [...(queriesState?.queries || []), newQuery],
    };
    setGraphiQLLocalStorageObject("queries", updatedQueries);
  } else {
    const newQueries: GraphiQLQueriesState = { queries: [newQuery] };
    setGraphiQLLocalStorageObject("queries", newQueries);
  }
};

const DynamicSyntaxHighlighter = dynamic(
  () => import("./lightweightSyntaxHighlighter.component"),
  {
    loading: () => (
      <div className="flex w-full justify-center">
        <Spinner className="mt-10 h-10 w-10 animate-spin" />
      </div>
    ),
  },
);

const modalVariants = {
  background: {
    hidden: { opacity: 0 },
    show: { opacity: 1 },
  },
  modal: {
    hidden: { opacity: 0, y: 100 },
    show: { opacity: 1, y: 0 },
  },
};

interface GraphQLQueryModalProps {
  label: string;
  query: DocumentNode | null;
  buttonClassName?: string;
  variables?: object;
  headers?: HeadersInit;
}

const DisplayGraphQLQueryModalBody = ({
  label,
  query,
  variables,
  headers,
}: GraphQLQueryModalProps) => {
  const [activeTab, setTab] = useState("Query");

  const formattedQuery = useMemo(() => (query ? print(query) : ""), [query]);

  const copyActiveTab = () => {
    const value =
      activeTab === "Query" ? formattedQuery : JSON.stringify(variables || {});
    if (value) {
      navigator.clipboard.writeText(value);
    }
  };

  const openQueryInGraphQLEditor = () => {
    query &&
      updateGraphiQLLocalStorage(query, formattedQuery, variables, headers);
  };

  useEffect(() => {
    segment.track(SEGMENT_KEYS.modals.graphqlQueryModal.open, {
      label,
      query,
      variables,
      headers,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Dialog.Panel className="relative mx-auto flex h-full w-full flex-col overflow-y-hidden rounded bg-white sm:w-11/12 md:w-5/6 lg:w-3/4 xl:w-2/3 2xl:w-1/2">
      <div className="sticky top-0 bg-white pt-8 text-black shadow">
        <button
          className="absolute right-4 top-4 sm:right-8 sm:top-9"
          onClick={close}
        >
          <FiX className="text-lg" />
        </button>

        <div className="mb-2 px-4 md:mb-4 md:px-8">
          <Dialog.Title className="mb-2 font-heading text-xl sm:text-2xl md:mb-4 md:text-3xl">
            Query for {label}
          </Dialog.Title>

          <Dialog.Description className="mb-2">
            The Skylark UI uses dynamic GraphQL Queries generated at runtime to
            match your Skylark Schema exactly. This enables developers to copy
            the query into their application with minimal changes.
          </Dialog.Description>

          <a
            className="link text-brand-primary"
            onClick={openQueryInGraphQLEditor}
            target="_blank"
            href={HREFS.relative.graphqlEditor}
            rel="noreferrer"
          >
            Open Query in GraphQL Editor
          </a>
        </div>

        <Tabs
          tabs={convertStringArrToTabs(["Query", "Variables", "Headers"])}
          selectedTab={activeTab}
          onChange={({ name }) => setTab(name)}
          className="px-4 md:px-8"
        />

        <div className="absolute right-0 z-50 w-auto">
          <div className="mr-4 mt-3 sm:mr-8 sm:mt-6">
            <button
              data-testid="copy-active-tab-to-clipboard"
              className="rounded border bg-manatee-100 p-2 shadow transition-colors hover:bg-brand-primary hover:stroke-white sm:p-3"
              onClick={copyActiveTab}
            >
              <FiCopy className="text-lg md:text-xl" />
            </button>
          </div>
        </div>
      </div>

      <div className="flex-grow overflow-y-scroll">
        {activeTab === "Query" && (
          <DynamicSyntaxHighlighter
            language={"graphql"}
            value={formattedQuery}
          />
        )}
        {activeTab === "Variables" && (
          <DynamicSyntaxHighlighter
            language={"json"}
            value={JSON.stringify(variables || {}, null, 4)}
          />
        )}
        {activeTab === "Headers" && (
          <DynamicSyntaxHighlighter
            language={"json"}
            value={JSON.stringify(headers || {}, null, 4)}
          />
        )}
      </div>
    </Dialog.Panel>
  );
};

export const DisplayGraphQLQueryModal = ({
  close,
  ...props
}: { close: () => void } & GraphQLQueryModalProps) => {
  return (
    <Dialog
      static
      open={true}
      onClose={close}
      className="font-body relative z-50"
    >
      <m.div
        className="fixed inset-0 bg-black/40"
        aria-hidden="true"
        data-testid="dialog-background"
        variants={modalVariants.background}
        initial="hidden"
        animate="show"
        exit="hidden"
        transition={{ duration: 0.1 }}
      />

      <m.div
        initial="hidden"
        animate="show"
        variants={modalVariants.background}
        exit="hidden"
        transition={{ duration: 0.5, type: "spring" }}
        id="graphql-query-modal"
        className="fixed inset-0 flex h-full items-center justify-center overflow-y-hidden py-4 text-sm sm:py-10 md:py-20"
      >
        <DisplayGraphQLQueryModalBody {...props} />
      </m.div>
    </Dialog>
  );
};

export const DisplayGraphQLQuery = (props: GraphQLQueryModalProps) => {
  const [isOpen, setOpen] = useState(false);

  return (
    <>
      <Tooltip
        tooltip={<span>{`View the GraphQL Query for ${props.label}.`}</span>}
      >
        <Button
          variant="ghost"
          Icon={
            <GrGraphQl
              className="text-base md:text-xl"
              data-testid="graphql-query-modal-button"
            />
          }
          onClick={() => setOpen(true)}
          disabled={!props.query}
          className={props.buttonClassName}
        />
      </Tooltip>
      <AnimatePresence>
        {isOpen && (
          <DisplayGraphQLQueryModal
            key="graphql-query-modal"
            {...props}
            close={() => setOpen(false)}
          />
        )}
      </AnimatePresence>
    </>
  );
};
