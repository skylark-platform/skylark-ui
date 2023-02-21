import { useRouter } from "next/router";
import { useEffect, useMemo, useState } from "react";

import { Spinner } from "src/components/icons";
import { Tabs } from "src/components/tabs/tabs.component";
import { DISPLAY_NAME_PRIORITY } from "src/constants/skylark";
import { useDeleteObject } from "src/hooks/useDeleteObject";
import { useGetObject } from "src/hooks/useGetObject";
import { useUpdateObjectContentPositioning } from "src/hooks/useUpdateSetContentPositioning";
import {
  ParsedSkylarkObjectMetadata,
  ParsedSkylarkObjectConfig,
  ParsedSkylarkObjectContent,
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
  activeId?: any;
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

export const Panel = ({
  closePanel,
  objectType,
  uid,
  activeId,
}: PanelProps) => {
  const {
    query: { edit },
  } = useRouter();

  const { data, loading, query, variables } = useGetObject(objectType, {
    uid: uid,
  });

  const [inEditMode, setEditMode] = useState(false);
  const [updatedContentObjects, setContentObjects] = useState<
    ParsedSkylarkObjectContent["objects"] | null
  >(null);

  const tabs = useMemo(
    () =>
      [
        PanelTab.Metadata,
        data?.images && PanelTab.Imagery,
        data?.content && PanelTab.Content,
        // PanelTab.Availability,
      ].filter((tab) => !!tab) as string[],
    [data],
  );

  const [selectedTab, setSelectedTab] = useState<string>(tabs[0]);

  useEffect(() => {
    // Reset selected tab when object changes
    setSelectedTab(PanelTab.Metadata);
  }, [uid]);

  const [deleteObjectMutation] = useDeleteObject(objectType);
  const [updateContentPositioningMutation] = useUpdateObjectContentPositioning(
    objectType,
    updatedContentObjects || [],
  );

  const deleteObjectWrapper = () => {
    deleteObjectMutation({ variables: { uid } });
  };

  const saveActiveTabChanges = () => {
    if (
      selectedTab === PanelTab.Content &&
      updatedContentObjects !== data?.content?.objects
    ) {
      updateContentPositioningMutation({
        variables: { uid: data?.metadata.uid },
      });
    }
    setEditMode(false);
  };

  return (
    <section className="flex w-full flex-col">
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
            currentTab={selectedTab}
            tabsWithEditMode={edit ? [PanelTab.Content] : []}
            closePanel={closePanel}
            deleteObject={deleteObjectWrapper}
            inEditMode={inEditMode}
            save={saveActiveTabChanges}
            toggleEditMode={() => {
              setEditMode(!inEditMode);
              if (inEditMode) {
                setContentObjects(null);
              }
            }}
          />
          <Tabs
            tabs={tabs}
            selectedTab={selectedTab}
            onChange={setSelectedTab}
            disabled={inEditMode}
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
            <PanelContent
              objects={updatedContentObjects || data?.content?.objects}
              inEditMode={inEditMode}
              onReorder={setContentObjects}
              activeId={activeId}
            />
          )}
        </>
      )}
    </section>
  );
};
