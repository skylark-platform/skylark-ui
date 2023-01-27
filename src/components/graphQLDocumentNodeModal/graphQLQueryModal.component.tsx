import { Dialog } from "@headlessui/react";
import { DocumentNode } from "graphql/language";
import { print } from "graphql/language/printer";
import { useState } from "react";
import { GrGraphQl } from "react-icons/gr";
import { PrismLight as SyntaxHighlighter } from "react-syntax-highlighter";
import graphqlHighlight from "react-syntax-highlighter/dist/cjs/languages/prism/graphql";
import graphqlHighlightStyles from "react-syntax-highlighter/dist/cjs/styles/prism/one-light";

import { Button } from "src/components/button";

SyntaxHighlighter.registerLanguage("graphql", graphqlHighlight);

interface GraphQLQueryModalProps {
  label: string;
  query: DocumentNode | null;
  type?: "query" | "mutation";
}

export const GraphQLQueryModal = ({
  label,
  query,
  type = "query",
}: GraphQLQueryModalProps) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <Button
        variant="ghost"
        Icon={<GrGraphQl className="text-xl" />}
        onClick={() => setIsOpen(true)}
        disabled={!query}
      />
      <Dialog
        open={isOpen}
        onClose={() => setIsOpen(false)}
        className="font-body relative z-50"
      >
        <div
          className="fixed inset-0 bg-black/40"
          aria-hidden="true"
          data-testid="dialog-background"
        />

        <div className="fixed inset-0 flex h-full items-center justify-center overflow-y-hidden py-20 text-sm">
          <Dialog.Panel className="relative mx-auto h-full w-full overflow-y-scroll rounded bg-white lg:w-3/4 xl:w-1/2">
            <div className="sticky top-0 bg-brand-primary p-6 px-12 text-white shadow">
              <Dialog.Title className="mb-2 font-heading text-2xl md:mb-4 md:text-3xl">
                GraphQL {type} for {label}
              </Dialog.Title>

              <Dialog.Description>
                Enter your GraphQL URI and API Key below to connect to your
                Skylark instance.
              </Dialog.Description>
            </div>

            {/* TODO display variables above query */}

            {query && (
              <SyntaxHighlighter
                language="graphql"
                style={graphqlHighlightStyles}
                // showInlineLineNumbers
                showLineNumbers
                customStyle={{ margin: 0, paddingRight: 0, paddingLeft: 0 }}
                // wrapLines
              >
                {print(query)}
              </SyntaxHighlighter>
            )}
          </Dialog.Panel>
        </div>
      </Dialog>
    </>
  );
};
