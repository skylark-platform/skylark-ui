import { Dispatch, useEffect, useMemo, useState } from "react";

import { Spinner } from "src/components/icons";
import { Tabs } from "src/components/tabs/tabs.component";
import { DISPLAY_NAME_PRIORITY } from "src/constants/skylark";
import { useGetObject } from "src/hooks/useGetObject";
import { useUpdateObjectContent } from "src/hooks/useUpdateObjectContent";
import {
  ParsedSkylarkObjectMetadata,
  ParsedSkylarkObjectConfig,
  ParsedSkylarkObjectContentObject,
  BuiltInSkylarkObjectType,
  ParsedSkylarkObject,
  CustomSkylarkObjectContentObject,
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
  closePanel?: () => void;
  uid: string;
  showDropArea?: boolean;
  droppedObject?: ParsedSkylarkObject;
  clearDroppedObject?: () => void;
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

function parseSkylarkObjectContent(
  skylarkObject: ParsedSkylarkObject,
): ParsedSkylarkObjectContentObject {
  return {
    config: skylarkObject.config,
    object: skylarkObject.metadata,
    objectType: skylarkObject.objectType,
    position: 1,
  };
}

export const Panel = ({
  closePanel,
  objectType,
  uid,
  showDropArea,
  droppedObject,
  clearDroppedObject,
}: PanelProps) => {
  const { data, isLoading, query, variables, isError, isNotFound, error } =
    useGetObject(objectType, uid);

  const [inEditMode, setEditMode] = useState(false);
  const [contentObjects, setContentObjects] = useState<
    CustomSkylarkObjectContentObject[] | null
  >(null);

  const tabs = useMemo(
    () =>
      [
        PanelTab.Metadata,
        data?.images && PanelTab.Imagery,
        objectType === BuiltInSkylarkObjectType.Set && PanelTab.Content,
        // PanelTab.Availability,
      ].filter((tab) => !!tab) as string[],
    [data?.images, objectType],
  );

  const [selectedTab, setSelectedTab] = useState<string>(tabs[0]);

  useEffect(() => {
    // Reset selected tab when object changes
    setSelectedTab(PanelTab.Metadata);
    setContentObjects(null);
    setEditMode(false);
  }, [uid]);

  useEffect(() => {
    if (
      droppedObject &&
      !contentObjects
        ?.map(({ object }) => object.uid)
        .includes(droppedObject.uid) &&
      !data?.content?.objects
        ?.map(({ object }) => object.uid)
        .includes(droppedObject.uid)
    ) {
      const parseDroppedObject = parseSkylarkObjectContent(droppedObject);
      setContentObjects([
        ...(contentObjects || data?.content?.objects || []),
        {
          ...parseDroppedObject,
          position:
            (contentObjects?.length || data?.content?.objects.length || 0) + 1,
          isNewObject: true,
        },
      ]);
      setEditMode(true);
      clearDroppedObject && clearDroppedObject();
    }
  }, [contentObjects, data?.content?.objects, droppedObject]);

  const { updateObjectContent, isLoading: updatingObjectContents } =
    useUpdateObjectContent({
      objectType,
      uid,
      currentContentObjects: data?.content?.objects || [],
      updatedContentObjects: contentObjects || [],
      onSuccess: (updatedContent) => {
        setEditMode(false);
        setContentObjects(updatedContent.objects);
      },
    });

  const saveActiveTabChanges = () => {
    if (
      selectedTab === PanelTab.Content &&
      contentObjects &&
      contentObjects !== data?.content?.objects
    ) {
      updateObjectContent();
    } else {
      setEditMode(false);
    }
  };

  return (
    <section className="mx-auto flex h-full w-full flex-col">
      {isLoading && (
        <div
          data-testid="loading"
          className="flex h-full w-full items-center justify-center pt-10"
        >
          <Spinner className="h-16 w-16 animate-spin" />
        </div>
      )}
      {!isLoading && isError && (
        <div className="flex h-full w-full items-center justify-center pt-10">
          {isNotFound ? (
            <p>{`${objectType} ${uid} not found`}</p>
          ) : (
            <p>{error?.response.errors[0].message}</p>
          )}
        </div>
      )}
      {!isLoading && !isError && data && (
        <>
          <PanelHeader
            title={getTitle(data.metadata, data.config)}
            objectType={objectType}
            objectUid={uid}
            pillColor={data.config.colour}
            graphQLQuery={query}
            graphQLVariables={variables}
            currentTab={selectedTab}
            tabsWithEditMode={[PanelTab.Content]}
            closePanel={closePanel}
            inEditMode={inEditMode}
            save={saveActiveTabChanges}
            isSaving={updatingObjectContents}
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
              objects={contentObjects || data?.content?.objects}
              inEditMode={inEditMode}
              objectType={objectType}
              onReorder={setContentObjects}
              showDropArea={showDropArea}
            />
          )}
        </>
      )}
    </section>
  );
};
