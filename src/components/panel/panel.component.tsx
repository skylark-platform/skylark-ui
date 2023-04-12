import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "react-toastify";

import { Spinner } from "src/components/icons";
import { Tabs } from "src/components/tabs/tabs.component";
import { Toast } from "src/components/toast/toast.component";
import { useGetObject } from "src/hooks/useGetObject";
import { useUpdateObjectContent } from "src/hooks/useUpdateObjectContent";
import { useUpdateObjectMetadata } from "src/hooks/useUpdateObjectMetadata";
import { useUpdateObjectRelationships } from "src/hooks/useUpdateObjectRelationships";
import {
  ParsedSkylarkObjectContentObject,
  ParsedSkylarkObject,
  AddedSkylarkObjectContentObject,
  SkylarkObjectMetadataField,
  SkylarkSystemField,
  SkylarkObjectMeta,
  ParsedSkylarkObjectRelationships,
  SkylarkObjectIdentifier,
} from "src/interfaces/skylark";
import { parseMetadataForHTMLForm } from "src/lib/skylark/parsers";
import { hasProperty } from "src/lib/utils";

import {
  PanelAvailability,
  PanelHeader,
  PanelImages,
  PanelMetadata,
} from "./panelSections";
import { PanelContent } from "./panelSections/panelContent.component";
import { PanelRelationships } from "./panelSections/panelRelationships.component";

interface PanelProps {
  isPage?: boolean;
  closePanel?: () => void;
  object: SkylarkObjectIdentifier;
  showDropArea?: boolean;
  droppedObject?: ParsedSkylarkObject;
  clearDroppedObject?: () => void;
  setPanelObject: (o: SkylarkObjectIdentifier) => void;
  navigateToPreviousPanelObject?: () => void;
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
    meta: skylarkObject.meta,
    object: skylarkObject.metadata,
    objectType: skylarkObject.objectType,
    position: 1,
  };
}

export const Panel = ({
  isPage,
  object,
  closePanel,
  showDropArea,
  droppedObject,
  clearDroppedObject,
  setPanelObject,
  navigateToPreviousPanelObject,
}: PanelProps) => {
  const [inEditMode, setEditMode] = useState(false);
  const [contentObjects, setContentObjects] = useState<
    AddedSkylarkObjectContentObject[] | null
  >(null);

  const [
    { updatedRelationshipObjects, originalRelationshipObjects },
    setRelationshipObjects,
  ] = useState<{
    originalRelationshipObjects: ParsedSkylarkObjectRelationships[] | null;
    updatedRelationshipObjects: ParsedSkylarkObjectRelationships[] | null;
  }>({ originalRelationshipObjects: null, updatedRelationshipObjects: null });

  const { uid, objectType, language } = object;
  const {
    data,
    objectMeta,
    isLoading,
    query,
    variables,
    isError,
    isNotFound,
    isObjectTypeNotFound,
    error,
  } = useGetObject(objectType, uid, { language });

  const metadataForm = useForm<Record<string, SkylarkObjectMetadataField>>({
    // Can't use onSubmit because we don't have a submit button within the form
    mode: "onTouched",
  });
  const { reset: resetMetadataForm } = metadataForm;

  const tabs = useMemo(
    () =>
      [
        PanelTab.Metadata,
        objectMeta?.hasContent && PanelTab.Content,
        objectMeta?.hasRelationships && PanelTab.Relationships,
        objectMeta?.images && PanelTab.Imagery,
        objectMeta?.hasAvailability && PanelTab.Availability,
      ].filter((tab) => !!tab) as string[],
    [
      objectMeta?.hasAvailability,
      objectMeta?.hasContent,
      objectMeta?.hasRelationships,
      objectMeta?.images,
    ],
  );

  const [selectedTab, setSelectedTab] = useState<string>(tabs[0]);

  useEffect(() => {
    setEditMode(false);
    setSelectedTab(PanelTab.Metadata);
    setContentObjects(null);
    setRelationshipObjects({
      originalRelationshipObjects: null,
      updatedRelationshipObjects: null,
    });
    resetMetadataForm();
  }, [uid, objectType, language, resetMetadataForm]);

  useEffect(() => {
    if (!inEditMode && metadataForm.formState.isDirty) {
      setEditMode(true);
    }
  }, [inEditMode, metadataForm.formState.isDirty]);

  useEffect(() => {
    if (droppedObject) {
      if (selectedTab === PanelTab.Relationships) {
        const relationships = objectMeta?.relationships || [];
        const droppedObjectRelationshipName = relationships.find(
          (relationship) =>
            relationship.objectType === droppedObject.objectType,
        )?.relationshipName;

        if (droppedObjectRelationshipName) {
          const droppedObjectRelationshipObjects =
            updatedRelationshipObjects?.find(
              (relationship) =>
                relationship.relationshipName === droppedObjectRelationshipName,
            );

          const isAlreadyAdded =
            !!droppedObjectRelationshipObjects?.objects.find(
              ({ uid }) => droppedObject.uid === uid,
            );

          if (isAlreadyAdded) {
            toast(
              <Toast
                title={"Relationship already exists"}
                message={`The ${droppedObject.objectType} is already linked`}
                type="warning"
              />,
            );
          } else {
            updatedRelationshipObjects &&
              setRelationshipObjects({
                updatedRelationshipObjects: updatedRelationshipObjects?.map(
                  (relationship) => {
                    const { objects, relationshipName } = relationship;
                    if (relationshipName === droppedObjectRelationshipName) {
                      return {
                        ...relationship,
                        objects: [droppedObject, ...objects],
                      };
                    } else return relationship;
                  },
                ),
                originalRelationshipObjects,
              });
          }
        } else {
          toast(
            <Toast
              title={"Invalid relationship"}
              message={`${droppedObject.objectType} cannot link to ${objectType}`}
              type="error"
            />,
          );
        }
        setEditMode(true);
        clearDroppedObject?.();
      } else if (
        selectedTab === PanelTab.Content &&
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
              (contentObjects?.length || data?.content?.objects.length || 0) +
              1,
            isNewObject: true,
          },
        ]);

        setEditMode(true);
        clearDroppedObject && clearDroppedObject();
      }
    }
  }, [
    clearDroppedObject,
    contentObjects,
    data?.content?.objects,
    droppedObject,
    selectedTab,
    objectMeta?.relationships,
    updatedRelationshipObjects,
    originalRelationshipObjects,
    objectType,
  ]);

  const { updateObjectRelationships, isLoading: updatingRelationshipObjects } =
    useUpdateObjectRelationships({
      objectType,
      uid,
      updatedRelationshipObjects,
      originalRelationshipObjects,
      onSuccess: () => {
        setEditMode(false);
        setRelationshipObjects({
          originalRelationshipObjects: null,
          updatedRelationshipObjects: null,
        });
      },
    });

  const { updateObjectMetadata, isLoading: updatingObjectMetadata } =
    useUpdateObjectMetadata({
      objectType,
      uid,
      language,
      onSuccess: (updatedMetadata) => {
        setEditMode(false);
        resetMetadataForm(
          parseMetadataForHTMLForm(
            updatedMetadata,
            (objectMeta as SkylarkObjectMeta).fields,
          ),
        );
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
    } else if (
      selectedTab === PanelTab.Relationships &&
      updatedRelationshipObjects
    ) {
      updateObjectRelationships();
    } else if (selectedTab === PanelTab.Metadata) {
      // Validate then make request
      metadataForm.trigger().then((allFieldsValid) => {
        if (allFieldsValid) {
          const values = metadataForm.getValues();
          if (
            hasProperty(values, SkylarkSystemField.ExternalID) &&
            values[SkylarkSystemField.ExternalID] ===
              data?.metadata[SkylarkSystemField.ExternalID]
          ) {
            // Remove External ID when it hasn't changed
            delete values[SkylarkSystemField.ExternalID];
          }
          updateObjectMetadata(values);
        }
      });
    } else {
      setEditMode(false);
    }
  };

  return (
    <section
      className="mx-auto flex h-full w-full flex-col break-words"
      data-cy={`panel-for-${objectType}-${uid}`}
    >
      <PanelHeader
        isPage={isPage}
        objectUid={uid}
        objectType={objectType}
        object={data || null}
        language={language}
        graphQLQuery={query}
        graphQLVariables={variables}
        currentTab={selectedTab}
        tabsWithEditMode={[
          PanelTab.Metadata,
          PanelTab.Content,
          PanelTab.Relationships,
        ]}
        closePanel={closePanel}
        inEditMode={inEditMode}
        save={saveActiveTabChanges}
        isSaving={
          updatingObjectContents ||
          updatingRelationshipObjects ||
          updatingObjectMetadata
        }
        isTranslatable={objectMeta?.isTranslatable}
        toggleEditMode={() => {
          if (inEditMode) {
            metadataForm.reset();
            setContentObjects(null);
            setRelationshipObjects({
              updatedRelationshipObjects: null,
              originalRelationshipObjects: null,
            });
            clearDroppedObject?.();
          }
          setEditMode(!inEditMode);
        }}
        setLanguage={(newLanguage) =>
          setPanelObject({ uid, objectType, language: newLanguage })
        }
        navigateToPreviousPanelObject={navigateToPreviousPanelObject}
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
          {isObjectTypeNotFound && (
            <p>{`Object Type "${objectType}" not found`}</p>
          )}
          {isNotFound && <p>{`${objectType} "${uid}" not found`}</p>}
          {!isNotFound && !isObjectTypeNotFound && (
            <p>{error?.response?.errors[0].message}</p>
          )}
        </div>
      )}
      {!isLoading && !isError && data && objectMeta && (
        <>
          <div className="border-b-2 border-gray-200">
            <div className="mx-auto w-full max-w-7xl flex-none overflow-x-auto">
              <Tabs
                tabs={tabs}
                selectedTab={selectedTab}
                onChange={setSelectedTab}
                disabled={inEditMode || isLoading || isError}
              />
            </div>
          </div>
          {selectedTab === PanelTab.Metadata && (
            <PanelMetadata
              isPage={isPage}
              uid={uid}
              language={language}
              metadata={data.metadata}
              form={metadataForm}
              objectType={objectType}
              objectMeta={objectMeta}
            />
          )}
          {selectedTab === PanelTab.Imagery && data.images && (
            <PanelImages
              isPage={isPage}
              images={data.images}
              setPanelObject={setPanelObject}
              language={language}
            />
          )}
          {selectedTab === PanelTab.Availability && (
            <PanelAvailability
              isPage={isPage}
              objectType={objectType}
              objectUid={uid}
              language={language}
              setPanelObject={setPanelObject}
            />
          )}
          {selectedTab === PanelTab.Content && data.content && (
            <PanelContent
              isPage={isPage}
              objects={contentObjects || data?.content?.objects}
              inEditMode={inEditMode}
              objectType={objectType}
              onReorder={setContentObjects}
              showDropArea={showDropArea}
              setPanelObject={setPanelObject}
            />
          )}
          {selectedTab === PanelTab.Relationships && (
            <PanelRelationships
              isPage={isPage}
              objectType={objectType}
              uid={uid}
              updatedRelationshipObjects={updatedRelationshipObjects}
              originalRelationshipObjects={originalRelationshipObjects}
              setRelationshipObjects={setRelationshipObjects}
              inEditMode={inEditMode}
              showDropArea={showDropArea}
              language={language}
              setPanelObject={setPanelObject}
            />
          )}
        </>
      )}
    </section>
  );
};
