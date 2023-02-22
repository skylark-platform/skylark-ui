import { Dialog } from "@headlessui/react";
import { AnimatePresence, m } from "framer-motion";
import { DocumentNode, print } from "graphql/language";
import dynamic from "next/dynamic";
import { useMemo, useState } from "react";
import { GrClose, GrCopy, GrGraphQl } from "react-icons/gr";

import { Button } from "src/components/button";
import { Spinner } from "src/components/icons";
import { Tabs } from "src/components/tabs/tabs.component";

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
        className="fixed inset-0 flex h-full items-center justify-center overflow-y-hidden py-4 text-sm sm:py-10 md:py-20"
      >
        <Dialog.Panel className="relative mx-auto h-full w-full overflow-y-scroll rounded bg-white sm:w-11/12 md:w-5/6 lg:w-3/4 xl:w-1/2">
          <div className="sticky top-0 bg-white pt-8 text-black shadow">
            <button
              className="absolute top-4 right-4 sm:top-9 sm:right-8"
              onClick={close}
            >
              <GrClose className="text-xl" />
            </button>

            <Dialog.Title className="mb-1 px-4 font-heading text-xl sm:text-2xl md:mb-2 md:px-8 md:text-3xl">
              Query for {label}
            </Dialog.Title>

            <Dialog.Description className="mb-6 px-4 md:px-8 ">
              The Skylark UI uses dynamic GraphQL Queries generated at runtime
              to match your Skylark Schema exactly. This enables developers to
              copy the query into their application with minimal changes.
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

          <DynamicSyntaxHighlighter
            language={activeTab === "Query" ? "graphql" : "json"}
            value={
              activeTab === "Query"
                ? formattedQuery
                : JSON.stringify(variables || {}, null, 4)
            }
          />
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
      />
      <AnimatePresence>
        {isOpen && (
          <DisplayGraphQLQueryModal {...props} close={() => setOpen(false)} />
        )}
      </AnimatePresence>
    </>
  );
};
