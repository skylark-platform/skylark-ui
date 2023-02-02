import { OperationVariables } from "@apollo/client";
import { DocumentNode } from "graphql";

import { Button } from "src/components/button";
import { DisplayGraphQLQuery } from "src/components/displayGraphQLQuery";
import { Expand } from "src/components/icons";
import { Pill } from "src/components/pill";
import { SkylarkObjectType } from "src/interfaces/skylark";

interface PanelHeaderProps {
  title: string;
  objectType: SkylarkObjectType;
  pillColor?: string;
  graphQLQuery: DocumentNode | null;
  graphQLVariables?: OperationVariables;
  closePanel: () => void;
}

export const PanelHeader = ({
  title,
  objectType,
  pillColor,
  graphQLQuery,
  graphQLVariables,
  closePanel,
}: PanelHeaderProps) => (
  <div data-testid="panel-header" className="p-4 pb-2 md:p-8 md:py-4">
    {/* <div className="flex flex-row pb-2">
      <div className="flex flex-grow items-center gap-4">
        <Button disabled variant="primary">
          Edit metadata
        </Button>
        <Button
          Icon={<Expand className="stroke-gray-300" />}
          disabled
          variant="ghost"
        />
        <DisplayGraphQLQuery
          label="Get Object"
          query={graphQLQuery || null}
          variables={graphQLVariables}
        />
      </div>

      <Button variant="ghost" onClick={closePanel}>
        Close
      </Button>
    </div> */}
    <div className="flex flex-row items-center gap-2 pt-2">
      <DisplayGraphQLQuery
        label="Get Object"
        query={graphQLQuery || null}
        variables={graphQLVariables}
      />
      <Pill
        bgColor={pillColor}
        className="bg-brand-primary"
        label={objectType}
      />
      <h1 className="flex-grow text-xl font-bold uppercase">{title}</h1>
      <Button variant="ghost" onClick={closePanel}>
        Close
      </Button>
    </div>
  </div>
);
