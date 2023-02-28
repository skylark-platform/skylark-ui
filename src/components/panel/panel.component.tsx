import { Dispatch, SetStateAction, useEffect, useMemo, useState } from "react";

import { Spinner } from "src/components/icons";
import { Tabs } from "src/components/tabs/tabs.component";
import { DISPLAY_NAME_PRIORITY } from "src/constants/skylark";
import { useDeleteObject } from "src/hooks/useDeleteObject";
import { useGetObject } from "src/hooks/useGetObject";
import { useUpdateObjectContent } from "src/hooks/useUpdateObjectContent";
import {
  ParsedSkylarkObjectMetadata,
  ParsedSkylarkObjectConfig,
  ParsedSkylarkObjectContentObject,
  BuiltInSkylarkObjectType,
} from "src/interfaces/skylark";
import { parseObjectContent } from "src/lib/skylark/parsers";

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
  draggedObject?: ParsedSkylarkObjectContentObject;
  newObject?: ParsedSkylarkObjectContentObject;
  setObject?: Dispatch<
    SetStateAction<ParsedSkylarkObjectContentObject | undefined>
  >;
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
  draggedObject,
  newObject,
  setObject,
}: PanelProps) => {
  const { data, loading, query, variables, error } = useGetObject(objectType, {
    uid: uid,
  });

  const [inEditMode, setEditMode] = useState(false);
  const [contentObjects, setContentObjects] = useState<
    ParsedSkylarkObjectContentObject[] | null
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
    if (newObject) {
      setContentObjects([
        ...(contentObjects || data?.content?.objects || []),
        {
          ...newObject,
          position:
            (contentObjects?.length || data?.content?.objects.length || 0) + 1,
        },
      ]);
      setEditMode(true);
      setObject && setObject(undefined);
    }
  }, [contentObjects, data?.content?.objects, newObject, setObject]);

  const [deleteObjectMutation] = useDeleteObject(objectType);
  const { updateObjectContent, loading: updatingObjectContents } =
    useUpdateObjectContent(
      objectType,
      uid,
      data?.content?.objects || [],
      contentObjects || [],
    );

  const deleteObjectWrapper = () => {
    deleteObjectMutation({ variables: { uid } });
  };

  const saveActiveTabChanges = () => {
    if (
      selectedTab === PanelTab.Content &&
      contentObjects &&
      contentObjects !== data?.content?.objects
    ) {
      updateObjectContent().then(({ data, errors }) => {
        if (
          (!errors || errors.length === 0) &&
          data?.updateObjectContent.content.objects
        ) {
          const parsedObjectContent = parseObjectContent(
            data.updateObjectContent.content,
          );
          setContentObjects(parsedObjectContent.objects);
          setEditMode(false);
        }
      });
    } else {
      setEditMode(false);
    }
  };

  return (
    <section className="mx-auto flex h-full w-full flex-col">
      {loading && (
        <div
          data-testid="loading"
          className="flex h-full w-full items-center justify-center pt-10"
        >
          <Spinner className="h-16 w-16 animate-spin" />
        </div>
      )}
      {!loading && error && (
        <div className="flex h-full w-full items-center justify-center pt-10">
          <p>{error.message}</p>
        </div>
      )}
      {!loading && data && (
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
            deleteObject={deleteObjectWrapper}
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
              onReorder={setContentObjects}
              draggedObject={draggedObject}
            />
          )}
        </>
      )}
    </section>
  );
};
