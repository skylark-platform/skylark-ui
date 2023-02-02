import { useState } from "react";

import { Button } from "src/components/button";
import { Spinner } from "src/components/icons";
import { Tabs } from "src/components/tabs/tabs.component";
import { DISPLAY_NAME_PRIORITY } from "src/constants/skylark";
import { useGetObject } from "src/hooks/useGetObject";
import {
  ParsedSkylarkObjectMetadata,
  ParsedSkylarkObjectConfig,
} from "src/interfaces/skylark";

import {
  PanelAvailability,
  PanelHeader,
  PanelImages,
  PanelMetadata,
} from "./panelSections";
import { PanelContent } from "./panelSections/panelContent.component";

interface PanelProps {
  objectType: string;
  closePanel: () => void;
  uid: string;
}

enum PanelTab {
  Metadata = "Metadata",
  Imagery = "Imagery",
  Availability = "Availability",
  Content = "Content",
}

const getTitle = (
  object: ParsedSkylarkObjectMetadata,
  config: ParsedSkylarkObjectConfig,
): string => {
  const [title] = [config.primaryField || "", ...DISPLAY_NAME_PRIORITY]
    .filter((key) => key)
    .map((key) => object[key as string]);
  return title as string;
};

export const Panel = ({ closePanel, objectType, uid }: PanelProps) => {
  const { data, loading, query, variables } = useGetObject(objectType, {
    uid: uid,
  });

  const tabs = [
    PanelTab.Metadata,
    data?.images && PanelTab.Imagery,
    data?.content && PanelTab.Content,
    // PanelTab.Availability,
  ].filter((tab) => !!tab) as string[];

  const [selectedTab, setSelectedTab] = useState<string>(tabs[0]);

  return (
    <>
      <div
        data-testid="panel-background"
        onClick={() => closePanel()}
        className="fixed left-0 top-0 bottom-0 z-50 w-3/5 bg-black bg-opacity-20 "
      />
      <section className="fixed top-0 right-0 bottom-0 z-50 flex w-full flex-col bg-white pb-20 drop-shadow-md md:w-2/3 lg:w-7/12 xl:w-2/5">
        {loading && (
          <div
            data-testid="loading"
            className="flex h-full w-full items-center justify-center"
          >
            <Spinner className="h-16 w-16 animate-spin" />
          </div>
        )}
        {!loading && data && (
          <>
            <PanelHeader
              title={getTitle(data.metadata, data.config)}
              objectType={objectType}
              pillColor={data.config.colour}
              graphQLQuery={query}
              graphQLVariables={variables}
              closePanel={closePanel}
            />
            <Tabs
              tabs={tabs}
              selectedTab={selectedTab}
              onChange={setSelectedTab}
            />
            {selectedTab === PanelTab.Metadata && (
              <PanelMetadata metadata={data.metadata} objectType={objectType} />
            )}
            {selectedTab === PanelTab.Imagery && data.images && (
              <PanelImages images={data.images} />
            )}
            {selectedTab === PanelTab.Availability && (
              <PanelAvailability availability={data.availability} />
            )}
            {selectedTab === PanelTab.Content && data.content && (
              <PanelContent content={data.content} />
            )}
            <div className="fixed bottom-0 flex h-20 w-full items-center justify-end gap-4 border-t-2 bg-white px-8 shadow">
              <Button variant="outline" danger>
                Delete
              </Button>
              <Button variant="primary">Update</Button>
              {/* <Button variant="ghost" danger>
                Cancel
              </Button>
              <Button variant="primary" success>
                Save
              </Button> */}
            </div>
          </>
        )}
      </section>
    </>
  );
};
