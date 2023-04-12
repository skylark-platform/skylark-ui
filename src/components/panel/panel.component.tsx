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
  language: initialLanguage,
  showDropArea,
  droppedObject,
  clearDroppedObject,
}: PanelProps) => {
  const [language, setLanguage] = useState<string>(initialLanguage);

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

  const {
    data,
    objectMeta,
    isLoading,
    query,
    variables,
    isError,
    isNotFound,
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
    // Reset selected tab when object changes
    setEditMode(false);
    setLanguage(initialLanguage);
    setSelectedTab(PanelTab.Metadata);
    setContentObjects(null);
    setRelationshipObjects({
      originalRelationshipObjects: null,
      updatedRelationshipObjects: null,
    });
    resetMetadataForm();
  }, [uid, initialLanguage, resetMetadataForm]);

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
            return;
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
        clearDroppedObject && clearDroppedObject();
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
    <section className="mx-auto flex h-full w-full flex-col break-words">
      <PanelHeader
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
          }
          setEditMode(!inEditMode);
        }}
        setLanguage={setLanguage}
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
              uid={uid}
              language={language}
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
            <PanelAvailability
              objectType={objectType}
              objectUid={uid}
              language={language}
            />
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
              updatedRelationshipObjects={updatedRelationshipObjects}
              originalRelationshipObjects={originalRelationshipObjects}
              setRelationshipObjects={setRelationshipObjects}
              inEditMode={inEditMode}
              showDropArea={showDropArea}
              language={language}
            />
          )}
        </>
      )}
    </section>
  );
};
