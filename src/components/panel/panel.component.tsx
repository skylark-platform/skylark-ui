import { useState } from "react";

import { Spinner } from "src/components/icons";
import { Tabs } from "src/components/tabs/tabs.component";
import { useGetObject } from "src/hooks/useGetObject";

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

const getTitle = (object: Record<string, string>, priority: string[]) => {
  const [title] = priority.map((key) => object[key]).filter((key) => key);
  return title;
};

const orderedKeys = ["title", "name", "uid"];

export const Panel = ({ closePanel, objectType, uid }: PanelProps) => {
  const { data, loading } = useGetObject(objectType, {
    uid: uid,
  });

  const tabs = ["Metadata", data?.images && "Imagery", "Availability"].filter(
    (tab) => !!tab,
  ) as string[];

  const [selectedTab, setSelectedTab] = useState<string>(tabs[0]);

  console.log({ uid, data, loading });

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
              title={getTitle(data.metadata, orderedKeys)}
              objectType={objectType}
              closePanel={closePanel}
            />
            <Tabs
              tabs={tabs}
              selectedTab={selectedTab}
              onChange={setSelectedTab}
            />
            {selectedTab === "Metadata" && (
              <PanelMetadata metadata={data.metadata} />
            )}
            {selectedTab === "Imagery" && data.images && (
              <PanelImages images={data.images} />
            )}
            {selectedTab === "Availability" && (
              <PanelAvailability availability={data.availability} />
            )}{" "}
          </>
        )}
      </section>
    </>
  );
};
