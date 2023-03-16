import { Dialog } from "@headlessui/react";
import { AnimatePresence, m } from "framer-motion";
import { DocumentNode, print, getOperationAST } from "graphql";
import dynamic from "next/dynamic";
import { useMemo, useState } from "react";
import { GrClose, GrCopy, GrGraphQl } from "react-icons/gr";

import { Button } from "src/components/button";
import { Spinner } from "src/components/icons";
import { Tabs } from "src/components/tabs/tabs.component";
import { HREFS, LOCAL_STORAGE } from "src/constants/skylark";

interface GraphiQLTabStateTab {
  hash: null;
  headers: null;
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
) => {
  const operation = getOperationAST(query as DocumentNode);
  const operationName = operation && operation.name?.value;

  const newTab: GraphiQLTabStateTab = {
    id: "dynamically-generated-query",
    hash: null,
    headers: null,
    operationName: operationName || "",
    query: formattedQuery,
    response: null,
    title: operationName || "",
    variables: JSON.stringify(variables),
  };

  localStorage.setItem(LOCAL_STORAGE.graphiql.query, formattedQuery);
  localStorage.setItem(
    LOCAL_STORAGE.graphiql.variables,
    JSON.stringify(variables),
  );

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
    headers: "",
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
}

export const DisplayGraphQLQueryModal = ({
  close,
  label,
  query,
  variables,
}: { close: () => void } & GraphQLQueryModalProps) => {
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
    query && updateGraphiQLLocalStorage(query, formattedQuery, variables);
  };

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
        <Dialog.Panel className="relative mx-auto flex h-full w-full flex-col overflow-y-hidden rounded bg-white sm:w-11/12 md:w-5/6 lg:w-3/4 xl:w-1/2">
          <div className="sticky top-0 bg-white pt-8 text-black shadow">
            <button
              className="absolute top-4 right-4 sm:top-9 sm:right-8"
              onClick={close}
            >
              <GrClose className="text-xl" />
            </button>

            <div className="mb-2 px-4 md:mb-4 md:px-8">
              <Dialog.Title className="mb-2 font-heading text-xl sm:text-2xl md:mb-4 md:text-3xl">
                Query for {label}
              </Dialog.Title>

              <Dialog.Description className="mb-2">
                The Skylark UI uses dynamic GraphQL Queries generated at runtime
                to match your Skylark Schema exactly. This enables developers to
                copy the query into their application with minimal changes.
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
              tabs={["Query", "Variables"]}
              selectedTab={activeTab}
              onChange={setTab}
            />

            <div className="absolute right-0 z-50 w-auto">
              <div className="mr-4 mt-3 sm:mr-8 sm:mt-6">
                <button
                  data-testid="copy-active-tab-to-clipboard"
                  className="rounded border bg-manatee-100 p-2 shadow transition-colors hover:bg-brand-primary hover:stroke-white sm:p-3"
                  onClick={copyActiveTab}
                >
                  <GrCopy className="text-lg md:text-xl" />
                </button>
              </div>
            </div>
          </div>

          <div className="flex-grow overflow-y-scroll">
            <DynamicSyntaxHighlighter
              language={activeTab === "Query" ? "graphql" : "json"}
              value={
                activeTab === "Query"
                  ? formattedQuery
                  : JSON.stringify(variables || {}, null, 4)
              }
            />
          </div>
        </Dialog.Panel>
      </m.div>
    </Dialog>
  );
};

export const DisplayGraphQLQuery = (props: GraphQLQueryModalProps) => {
  const [isOpen, setOpen] = useState(false);

  return (
    <>
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
      <AnimatePresence>
        {isOpen && (
          <DisplayGraphQLQueryModal {...props} close={() => setOpen(false)} />
        )}
      </AnimatePresence>
    </>
  );
};
