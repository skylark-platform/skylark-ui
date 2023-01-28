import { OperationVariables } from "@apollo/client";
import { Dialog } from "@headlessui/react";
import { motion } from "framer-motion";
import { DocumentNode, print } from "graphql/language";
import { useMemo, useState } from "react";
import { GrCopy, GrClose } from "react-icons/gr";
import { PrismLight as SyntaxHighlighter } from "react-syntax-highlighter";
import graphqlHighlight from "react-syntax-highlighter/dist/cjs/languages/prism/graphql";
import jsonHighlight from "react-syntax-highlighter/dist/cjs/languages/prism/json";
import highlightStyles from "react-syntax-highlighter/dist/cjs/styles/prism/one-light";

import { Tabs } from "src/components/tabs/tabs.component";

SyntaxHighlighter.registerLanguage("graphql", graphqlHighlight);
SyntaxHighlighter.registerLanguage("json", jsonHighlight);

export interface GraphQLQueryModalProps {
  label: string;
  query: DocumentNode | null;
  variables?: OperationVariables;
  closeModal: () => void;
}

export const GraphQLQueryModal = ({
  label,
  query,
  variables,
  closeModal,
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

  return (
    <Dialog
      static
      open={true}
      onClose={closeModal}
      className="font-body relative z-50"
      as={motion.div}
    >
      <motion.div
        className="fixed inset-0 bg-black/40"
        aria-hidden="true"
        data-testid="dialog-background"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.1 }}
      />

      <motion.div
        initial={{ opacity: 0, y: 100 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 100 }}
        transition={{ duration: 0.5, type: "spring" }}
        className="fixed inset-0 flex h-full items-center justify-center overflow-y-hidden py-4 text-sm sm:py-10 md:py-20"
      >
        <Dialog.Panel className="relative mx-auto h-full w-full overflow-y-scroll rounded bg-white sm:w-11/12 md:w-5/6 lg:w-3/4 xl:w-1/2">
          <div className="sticky top-0 bg-white pt-8 text-black shadow">
            <button
              className="absolute top-4 right-4 sm:top-9 sm:right-8"
              onClick={closeModal}
            >
              <GrClose className="text-xl" />
            </button>

            <Dialog.Title className="mb-1 px-4 font-heading text-xl sm:text-2xl md:mb-2 md:px-8 md:text-3xl">
              GraphQL query for {label}
            </Dialog.Title>

            <Dialog.Description className="mb-6 px-4 md:px-8 ">
              The Skylark UI creates dynamic GraphQL Queries at runtime to match
              your Skyark Schema exactly. Below is the Query used for the{" "}
              {label}.
            </Dialog.Description>

            <Tabs
              tabs={["Query", "Variables"]}
              selectedTab={activeTab}
              onChange={setTab}
            />

            <div className="absolute right-0 z-50 w-auto">
              <div className="mr-4 mt-3 sm:mr-8 sm:mt-6">
                <button
                  className="rounded border bg-manatee-100 p-2 shadow transition-colors hover:bg-brand-primary hover:stroke-white sm:p-3"
                  onClick={copyActiveTab}
                >
                  <GrCopy className="text-lg md:text-xl" />
                </button>
              </div>
            </div>
          </div>

          {activeTab === "Query" && (
            <SyntaxHighlighter
              language="graphql"
              style={highlightStyles}
              showLineNumbers
              customStyle={{
                margin: 0,
                paddingRight: 0,
                paddingLeft: 0,
              }}
            >
              {formattedQuery}
            </SyntaxHighlighter>
          )}

          {activeTab === "Variables" && (
            <SyntaxHighlighter
              language="json"
              style={highlightStyles}
              showLineNumbers
              customStyle={{ margin: 0 }}
            >
              {JSON.stringify(variables || {}, null, 4)}
            </SyntaxHighlighter>
          )}
        </Dialog.Panel>
      </motion.div>
    </Dialog>
  );
};
