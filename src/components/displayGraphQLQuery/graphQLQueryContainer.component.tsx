import { AnimatePresence } from "framer-motion";
import dynamic from "next/dynamic";
import { useState } from "react";
import { GrGraphQl } from "react-icons/gr";

import { Button } from "src/components/button";

import { GraphQLQueryModalProps } from "./graphQLQueryModal.component";

const GraphQLQueryModal = dynamic(() =>
  import("./graphQLQueryModal.component").then(
    ({ GraphQLQueryModal }) => GraphQLQueryModal,
  ),
);

export const DisplayGraphQLQuery = ({
  label,
  query,
  variables,
}: Omit<GraphQLQueryModalProps, "closeModal">) => {
  const [isOpen, setOpen] = useState(false);

  return (
    <>
      <Button
        variant="ghost"
        Icon={<GrGraphQl className="text-xl" />}
        onClick={() => setOpen(true)}
        disabled={!query}
      />
      <AnimatePresence>
        {isOpen && (
          <GraphQLQueryModal
            label={label}
            query={query}
            variables={variables}
            closeModal={() => setOpen(false)}
          />
        )}
      </AnimatePresence>
    </>
  );
};
