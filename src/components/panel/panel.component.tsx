import { useState } from "react";

import { Spinner } from "src/components/icons";
import { Tabs } from "src/components/tabs/tabs.component";
import { DISPLAY_NAME_PRIORITY } from "src/constants/skylark";
import { useGetObject } from "src/hooks/useGetObject";
import { ParsedSkylarkObjectMetadata } from "src/interfaces/skylark";

import {
  PanelAvailability,
  PanelHeader,
  PanelImages,
  PanelMetadata,
} from "./panelSections";

interface PanelProps {
  objectType: string;
  closePanel: () => void;
  uid: string;
}

enum PanelTab {
  Metadata = "Metadata",
  Imagery = "Imagery",
  Availability = "Availability",
}

const getTitle = (object: ParsedSkylarkObjectMetadata): string => {
  const [title] = DISPLAY_NAME_PRIORITY.map((key) => object[key]).filter(
    (key) => key,
  );
  return title as string;
};

export const Panel = ({ closePanel, objectType, uid }: PanelProps) => {
  const { data, loading, query } = useGetObject(objectType, {
    uid: uid,
  });

  const tabs = [
    PanelTab.Metadata,
    data?.images && PanelTab.Imagery,
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
      <section className="fixed top-0 right-0 bottom-0 z-50 flex w-full flex-col bg-white drop-shadow-md md:w-2/3 lg:w-7/12 xl:w-2/5 ">
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
              title={getTitle(data.metadata)}
              objectType={objectType}
              pillColor={data.config.colour}
              graphQLQuery={query}
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
          </>
        )}
      </section>
    </>
  );
};
