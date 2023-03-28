import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";

import { Spinner } from "src/components/icons";
import { Tabs } from "src/components/tabs/tabs.component";
import { useGetObject } from "src/hooks/useGetObject";
import { useUpdateObjectContent } from "src/hooks/useUpdateObjectContent";
import { useUpdateObjectMetadata } from "src/hooks/useUpdateObjectMetadata";
import {
  ParsedSkylarkObjectContentObject,
  ParsedSkylarkObject,
  AddedSkylarkObjectContentObject,
  SkylarkObjectMetadataField,
} from "src/interfaces/skylark";

import {
  PanelAvailability,
  PanelHeader,
  PanelImages,
  PanelMetadata,
} from "./panelSections";
import { PanelContent } from "./panelSections/panelContent.component";
import { PanelRelationships } from "./panelSections/panelRelationships.component";

interface PanelProps {
  closePanel?: () => void;
  objectType: string;
  uid: string;
  language: string;
  showDropArea?: boolean;
  droppedObject?: ParsedSkylarkObject;
  clearDroppedObject?: () => void;
}

enum PanelTab {
  Metadata = "Metadata",
  Imagery = "Imagery",
  Availability = "Availability",
  Content = "Content",
  Relationships = "Relationships",
}

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
  language,
  showDropArea,
  droppedObject,
  clearDroppedObject,
}: PanelProps) => {
  const [activeLanguage, setActiveLanguage] = useState<string>(language);

  const {
    data,
    objectMeta,
    isLoading,
    query,
    variables,
    isError,
    isNotFound,
    error,
  } = useGetObject(objectType, uid, { language: activeLanguage });

  const [inEditMode, setEditMode] = useState(false);
  const [contentObjects, setContentObjects] = useState<
    AddedSkylarkObjectContentObject[] | null
  >(null);
  const metadataForm = useForm<Record<string, SkylarkObjectMetadataField>>({
    defaultValues: data?.metadata,
  });

  const tabs = useMemo(
    () =>
      [
        PanelTab.Metadata,
        objectMeta?.hasContent && PanelTab.Content,
        PanelTab.Relationships,
        objectMeta?.images && PanelTab.Imagery,
        PanelTab.Availability,
      ].filter((tab) => !!tab) as string[],
    [objectMeta?.hasContent, objectMeta?.images],
  );

  const [selectedTab, setSelectedTab] = useState<string>(tabs[0]);

  useEffect(() => {
    // Reset selected tab when object changes
    setEditMode(false);
    setActiveLanguage(language);
    setSelectedTab(PanelTab.Metadata);
    setContentObjects(null);
  }, [uid, language]);

  useEffect(() => {
    if (!inEditMode && metadataForm.formState.isDirty) {
      setEditMode(true);
    }
  }, [inEditMode, metadataForm.formState.isDirty]);

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
  }, [
    clearDroppedObject,
    contentObjects,
    data?.content?.objects,
    droppedObject,
  ]);

  const { updateObjectMetadata, isLoading: updatingObjectMetadata } =
    useUpdateObjectMetadata({
      objectType,
      uid,
      onSuccess: (updatedMetadata) => {
        setEditMode(false);
        metadataForm.reset(updatedMetadata);
      },
    });

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
    } else if (selectedTab === PanelTab.Metadata) {
      updateObjectMetadata(metadataForm.getValues());
    } else {
      setEditMode(false);
    }
  };

  return (
    <section className="mx-auto flex h-full w-full flex-col">
      <PanelHeader
        objectUid={uid}
        objectType={objectType}
        object={data || null}
        activeLanguage={activeLanguage}
        graphQLQuery={query}
        graphQLVariables={variables}
        currentTab={selectedTab}
        tabsWithEditMode={[PanelTab.Content]}
        closePanel={closePanel}
        inEditMode={inEditMode}
        save={saveActiveTabChanges}
        isSaving={updatingObjectMetadata || updatingObjectContents}
        toggleEditMode={() => {
          if (inEditMode) {
            metadataForm.reset();
            setContentObjects(null);
          }
          setEditMode(!inEditMode);
        }}
        setActiveLanguage={setActiveLanguage}
      />
      {isLoading && (
        <div
          data-testid="loading"
          className="flex h-4/5 w-full items-center justify-center pb-10"
        >
          <Spinner className="h-16 w-16 animate-spin" />
        </div>
      )}
      {!isLoading && isError && (
        <div className="flex h-4/5 w-full items-center justify-center pb-10">
          {isNotFound ? (
            <p>{`${objectType} ${uid} not found`}</p>
          ) : (
            <p>{error?.response.errors[0].message}</p>
          )}
        </div>
      )}
      {!isLoading && !isError && data && objectMeta && (
        <>
          <Tabs
            tabs={tabs}
            selectedTab={selectedTab}
            onChange={setSelectedTab}
            disabled={inEditMode}
          />
          {selectedTab === PanelTab.Metadata && (
            <PanelMetadata
              metadata={data.metadata}
              form={metadataForm}
              objectType={objectType}
              objectMeta={objectMeta}
            />
          )}
          {selectedTab === PanelTab.Imagery && data.images && (
            <PanelImages images={data.images} />
          )}
          {selectedTab === PanelTab.Availability && (
            <PanelAvailability objectType={objectType} objectUid={uid} />
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
          {selectedTab === PanelTab.Relationships && (
            <PanelRelationships
              objectType={objectType}
              uid={uid}
              language={activeLanguage}
            />
          )}
        </>
      )}
    </section>
  );
};
