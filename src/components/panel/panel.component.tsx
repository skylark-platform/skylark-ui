import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "react-toastify";

import { Tabs } from "src/components/tabs/tabs.component";
import { Toast } from "src/components/toast/toast.component";
import { useGetObject } from "src/hooks/objects/get/useGetObject";
import { prefetchGetObjectAvailability } from "src/hooks/objects/get/useGetObjectAvailability";
import { prefetchGetObjectContent } from "src/hooks/objects/get/useGetObjectContent";
import { useUpdateAvailabilityObjectDimensions } from "src/hooks/objects/update/useUpdateAvailabilityObjectDimensions";
import { useUpdateObjectAvailability } from "src/hooks/objects/update/useUpdateObjectAvailability";
import { useUpdateObjectContent } from "src/hooks/objects/update/useUpdateObjectContent";
import { useUpdateObjectMetadata } from "src/hooks/objects/update/useUpdateObjectMetadata";
import { useUpdateObjectRelationships } from "src/hooks/objects/update/useUpdateObjectRelationships";
import { PanelTab } from "src/hooks/usePanelObjectState";
import { useAllObjectsMeta } from "src/hooks/useSkylarkObjectTypes";
import {
  ParsedSkylarkObjectContentObject,
  ParsedSkylarkObject,
  AddedSkylarkObjectContentObject,
  SkylarkObjectMetadataField,
  SkylarkSystemField,
  ParsedSkylarkObjectRelationships,
  SkylarkObjectIdentifier,
  BuiltInSkylarkObjectType,
} from "src/interfaces/skylark";
import { parseMetadataForHTMLForm } from "src/lib/skylark/parsers";
import {
  isObjectsDeepEqual,
  getObjectDisplayName,
  getObjectTypeDisplayNameFromParsedObject,
  hasProperty,
} from "src/lib/utils";

import {
  PanelAvailability,
  PanelHeader,
  PanelImages,
  PanelMetadata,
} from "./panelSections";
import { PanelAvailabilityDimensions } from "./panelSections/panelAvailabilityDimensions.component";
import { PanelContent } from "./panelSections/panelContent.component";
import { PanelContentOf } from "./panelSections/panelContentOf.component";
import { PanelRelationships } from "./panelSections/panelRelationships.component";

interface PanelProps {
  isPage?: boolean;
  closePanel?: () => void;
  object: SkylarkObjectIdentifier;
  isDraggedObject?: boolean;
  droppedObject?: ParsedSkylarkObject;
  tab: PanelTab;
  clearDroppedObject?: () => void;
  setPanelObject: (o: SkylarkObjectIdentifier) => void;
  setTab: (t: PanelTab) => void;
  navigateToPreviousPanelObject?: () => void;
  navigateToForwardPanelObject?: () => void;
}

const tabsWithEditMode = [
  PanelTab.Metadata,
  PanelTab.Content,
  PanelTab.Relationships,
  PanelTab.Availability,
  PanelTab.AvailabilityDimensions,
];

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
  tab: selectedTab,
  closePanel,
  isDraggedObject,
  droppedObject,
  clearDroppedObject,
  setTab: setSelectedTab,
  navigateToPreviousPanelObject,
  navigateToForwardPanelObject,
  setPanelObject,
}: PanelProps) => {
  const [inEditMode, setEditMode] = useState(false);
  const [isTabDataPrefetched, setIsTabDataPrefetched] = useState(false);

  const [contentObjects, setContentObjects] = useState<{
    original: ParsedSkylarkObjectContentObject[] | null;
    updated: AddedSkylarkObjectContentObject[] | null;
  }>({
    original: null,
    updated: null,
  });

  const [
    { updatedRelationshipObjects, originalRelationshipObjects },
    setRelationshipObjects,
  ] = useState<{
    originalRelationshipObjects: ParsedSkylarkObjectRelationships[] | null;
    updatedRelationshipObjects: ParsedSkylarkObjectRelationships[] | null;
  }>({ originalRelationshipObjects: null, updatedRelationshipObjects: null });

  const [availabilityObjects, setAvailabilityObjects] = useState<{
    original: ParsedSkylarkObject[] | null;
    updated: ParsedSkylarkObject[] | null;
  }>({
    original: null,
    updated: null,
  });

  const [availabilityDimensionValues, setAvailabilityDimensionValues] =
    useState<{
      original: Record<string, string[]> | null;
      updated: Record<string, string[]> | null;
    }>({ original: null, updated: null });

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

  const { objects: allObjectsMeta } = useAllObjectsMeta();

  const formParsedMetadata =
    (data &&
      objectMeta &&
      parseMetadataForHTMLForm(data.metadata, objectMeta.fields)) ||
    null;

  const metadataForm = useForm<Record<string, SkylarkObjectMetadataField>>({
    // Can't use onSubmit because we don't have a submit button within the form
    mode: "onTouched",
  });
  const { reset: resetMetadataForm } = metadataForm;

  const tabs: PanelTab[] = useMemo(
    () =>
      [
        PanelTab.Metadata,
        objectMeta?.hasContent && PanelTab.Content,
        objectMeta?.hasRelationships && PanelTab.Relationships,
        objectMeta?.images && PanelTab.Imagery,
        objectMeta?.hasContentOf && PanelTab.ContentOf,
        objectMeta?.hasAvailability && PanelTab.Availability,
        objectMeta?.name === BuiltInSkylarkObjectType.Availability &&
          PanelTab.AvailabilityDimensions,
      ].filter((tab) => !!tab) as PanelTab[],
    [
      objectMeta?.hasAvailability,
      objectMeta?.hasContent,
      objectMeta?.hasContentOf,
      objectMeta?.hasRelationships,
      objectMeta?.images,
      objectMeta?.name,
    ],
  );

  const resetPanelState = useCallback(
    (resetIsTabDataPrefetched?: boolean) => {
      setEditMode(false);
      resetMetadataForm({});

      if (resetIsTabDataPrefetched) {
        setIsTabDataPrefetched(false);
      }
    },
    [resetMetadataForm],
  );

  useEffect(() => {
    // Resets any edited data when the panel object changes
    resetPanelState(true);
  }, [uid, objectType, language, resetPanelState]);

  const queryClient = useQueryClient();

  useEffect(() => {
    if (objectMeta && allObjectsMeta && !isTabDataPrefetched) {
      const prefetchArgs = {
        queryClient,
        objectMeta,
        objectType,
        uid,
        variables: {
          uid,
          language,
          nextToken: "",
        },
      };

      if (objectMeta.hasAvailability && selectedTab !== PanelTab.Availability) {
        void prefetchGetObjectAvailability(prefetchArgs);
      }
      if (objectMeta.hasContent && selectedTab !== PanelTab.Content) {
        void prefetchGetObjectContent({
          ...prefetchArgs,
          contentObjectsMeta: allObjectsMeta,
        });
      }
      setIsTabDataPrefetched(true);
    }
  }, [
    allObjectsMeta,
    isTabDataPrefetched,
    language,
    objectMeta,
    objectType,
    queryClient,
    selectedTab,
    uid,
  ]);

  useEffect(() => {
    // Switches into edit mode when the metadata form is changed
    if (
      !inEditMode &&
      metadataForm.formState.isDirty &&
      !metadataForm.formState.isSubmitted
    ) {
      setEditMode(true);
    }
  }, [inEditMode, metadataForm.formState]);

  useEffect(() => {
    // Updates the form values when metadata is updated in Skylark
    const formValues = metadataForm.getValues();
    const dataAndFormAreEqual =
      formParsedMetadata && isObjectsDeepEqual(formParsedMetadata, formValues);

    const metadataInEditMode =
      inEditMode || (metadataForm.formState.isDirty && !inEditMode);

    if (!metadataInEditMode && formParsedMetadata && !dataAndFormAreEqual) {
      resetMetadataForm(formParsedMetadata);
    }
  }, [inEditMode, metadataForm, resetMetadataForm, formParsedMetadata]);

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
            toast.warning(
              <Toast
                title={"Relationship exists"}
                message={`${getObjectTypeDisplayNameFromParsedObject(
                  droppedObject,
                )} "${getObjectDisplayName(droppedObject)}" is already linked`}
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
          toast.error(
            <Toast
              title={"Invalid relationship"}
              message={`${getObjectTypeDisplayNameFromParsedObject(
                droppedObject,
              )} is not configured to link to ${
                data
                  ? getObjectTypeDisplayNameFromParsedObject(data)
                  : objectType
              }`}
            />,
          );
        }
        setEditMode(true);
      } else if (selectedTab === PanelTab.Content) {
        if (object.uid === droppedObject.uid) {
          toast.warning(
            <Toast
              title={"Invalid Object"}
              message={"Unable to add a Set to its own Set Content"}
            />,
          );
        } else if (
          contentObjects.updated?.find(
            ({ object: { uid } }) => uid === droppedObject.uid,
          )
        ) {
          toast.warning(
            <Toast
              title={"Existing"}
              message={`${getObjectTypeDisplayNameFromParsedObject(
                droppedObject,
              )} "${getObjectDisplayName(
                droppedObject,
              )}" already exists as content`}
            />,
          );
        } else if (
          droppedObject.objectType === BuiltInSkylarkObjectType.Availability
        ) {
          toast.error(
            <Toast
              title={"Invalid Object Type"}
              message={"Availability cannot be added as Set Content"}
            />,
          );
        } else {
          const parseDroppedObject = parseSkylarkObjectContent(droppedObject);
          setContentObjects({
            ...contentObjects,
            updated: [
              ...(contentObjects.updated || []),
              {
                ...parseDroppedObject,
                position: (contentObjects.updated?.length || 0) + 1,
                isNewObject: true,
              },
            ],
          });
        }
        setEditMode(true);
      } else if (selectedTab === PanelTab.Availability) {
        if (droppedObject) {
          if (
            droppedObject.objectType !== BuiltInSkylarkObjectType.Availability
          ) {
            toast.error(
              <Toast
                title={"Invalid Object"}
                message={`${getObjectTypeDisplayNameFromParsedObject(
                  droppedObject,
                )} "${getObjectDisplayName(
                  droppedObject,
                )}" is not an Availability object`}
              />,
            );
          } else if (
            [...(availabilityObjects.updated || [])]?.find(
              ({ uid }) => uid === droppedObject.uid,
            )
          ) {
            toast.warning(
              <Toast
                title={"Existing"}
                message={`${getObjectTypeDisplayNameFromParsedObject(
                  droppedObject,
                )} "${getObjectDisplayName(
                  droppedObject,
                )}" is already assigned`}
              />,
            );
          } else {
            setAvailabilityObjects({
              ...availabilityObjects,
              updated: [...(availabilityObjects.updated || []), droppedObject],
            });
            setEditMode(true);
          }
        }
      }
      clearDroppedObject?.();
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
    data,
    object.uid,
    availabilityObjects,
  ]);

  const { updateObjectRelationships, isUpdatingObjectRelationships } =
    useUpdateObjectRelationships({
      objectType,
      uid,
      updatedRelationshipObjects,
      originalRelationshipObjects,
      onSuccess: () => {
        setEditMode(false);
      },
    });

  const { updateObjectMetadata, isUpdatingObjectMetadata } =
    useUpdateObjectMetadata({
      objectType,
      onSuccess: () => {
        setEditMode(false);
        resetMetadataForm({ keepValues: true });
      },
    });

  const { updateObjectContent, isUpdatingObjectContent } =
    useUpdateObjectContent({
      objectType,
      uid,
      originalContentObjects: contentObjects.original,
      updatedContentObjects: contentObjects.updated,
      onSuccess: () => {
        setEditMode(false);
      },
    });

  const { updateObjectAvailability, isUpdatingObjectAvailability } =
    useUpdateObjectAvailability({
      objectType,
      uid,
      originalAvailabilityObjects: availabilityObjects.original,
      updatedAvailabilityObjects: availabilityObjects.updated,
      onSuccess: () => {
        setEditMode(false);
      },
    });

  const {
    updateAvailabilityObjectDimensions,
    isUpdatingAvailabilityObjectDimensions,
  } = useUpdateAvailabilityObjectDimensions({
    uid,
    originalAvailabilityDimensions: availabilityDimensionValues.original,
    updatedAvailabilityDimensions: availabilityDimensionValues.updated,
    onSuccess: () => {
      setEditMode(false);
    },
  });

  const saveActiveTabChanges = () => {
    if (selectedTab === PanelTab.Content && contentObjects.updated) {
      updateObjectContent();
    } else if (
      selectedTab === PanelTab.Relationships &&
      updatedRelationshipObjects
    ) {
      updateObjectRelationships();
    } else if (
      selectedTab === PanelTab.Availability &&
      availabilityObjects.updated
    ) {
      updateObjectAvailability();
    } else if (
      selectedTab === PanelTab.AvailabilityDimensions &&
      availabilityDimensionValues.updated
    ) {
      updateAvailabilityObjectDimensions();
    } else if (selectedTab === PanelTab.Metadata) {
      metadataForm.handleSubmit((values) => {
        if (
          hasProperty(values, SkylarkSystemField.ExternalID) &&
          values[SkylarkSystemField.ExternalID] ===
            data?.metadata[SkylarkSystemField.ExternalID]
        ) {
          // Remove External ID when it hasn't changed
          delete values[SkylarkSystemField.ExternalID];
        }
        updateObjectMetadata({ uid, language, metadata: values });
      })();
    } else {
      setEditMode(false);
    }
  };

  return (
    <section
      className="mx-auto flex h-full w-full flex-col overflow-y-hidden break-words"
      data-cy={`panel-for-${objectType}-${uid}`}
      data-testid="panel"
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
        tabsWithEditMode={tabsWithEditMode}
        closePanel={closePanel}
        inEditMode={inEditMode}
        save={saveActiveTabChanges}
        isSaving={
          isUpdatingObjectRelationships ||
          isUpdatingObjectMetadata ||
          isUpdatingObjectContent ||
          isUpdatingObjectAvailability ||
          isUpdatingAvailabilityObjectDimensions
        }
        isTranslatable={objectMeta?.isTranslatable}
        availabilityStatus={data?.meta.availabilityStatus}
        toggleEditMode={() => {
          if (inEditMode) {
            resetMetadataForm(formParsedMetadata || {});
            setContentObjects({
              original: contentObjects.original,
              updated: contentObjects.original,
            });
            setRelationshipObjects({
              updatedRelationshipObjects: originalRelationshipObjects,
              originalRelationshipObjects: originalRelationshipObjects,
            });
            setAvailabilityDimensionValues({
              original: availabilityDimensionValues.original,
              updated: availabilityDimensionValues.original,
            });
            clearDroppedObject?.();
          }
          setEditMode(!inEditMode);
        }}
        setLanguage={(newLanguage) =>
          setPanelObject({ uid, objectType, language: newLanguage })
        }
        navigateToPreviousPanelObject={navigateToPreviousPanelObject}
        navigateToForwardPanelObject={navigateToForwardPanelObject}
      />
      <div className="border-b-2 border-gray-200">
        <div className="mx-auto w-full max-w-7xl flex-none overflow-x-auto">
          <Tabs
            tabs={tabs}
            selectedTab={selectedTab}
            onChange={(t) => setSelectedTab(t as PanelTab)}
            disabled={tabs.length === 0 || inEditMode || isError}
          />
        </div>
      </div>
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
      {!isError && (
        <>
          {selectedTab === PanelTab.Metadata && (
            <PanelMetadata
              isPage={isPage}
              isLoading={isLoading}
              uid={uid}
              language={language}
              metadata={formParsedMetadata}
              form={metadataForm}
              objectType={objectType}
              objectMeta={objectMeta}
            />
          )}
          {selectedTab === PanelTab.Imagery && data?.images && (
            <PanelImages
              isPage={isPage}
              images={data.images}
              setPanelObject={setPanelObject}
              inEditMode={inEditMode}
            />
          )}
          {selectedTab === PanelTab.Availability && (
            <PanelAvailability
              isPage={isPage}
              objectType={objectType}
              objectUid={uid}
              language={language}
              setPanelObject={setPanelObject}
              inEditMode={inEditMode}
              showDropZone={isDraggedObject}
              availabilityObjects={availabilityObjects.updated}
              setAvailabilityObjects={setAvailabilityObjects}
            />
          )}
          {selectedTab === PanelTab.Content && (
            <PanelContent
              isPage={isPage}
              objectType={objectType}
              uid={uid}
              language={language}
              objects={contentObjects.updated}
              inEditMode={inEditMode}
              setContentObjects={setContentObjects}
              showDropZone={isDraggedObject}
              setPanelObject={setPanelObject}
            />
          )}
          {selectedTab === PanelTab.Relationships && (
            <PanelRelationships
              isPage={isPage}
              objectType={objectType}
              uid={uid}
              updatedRelationshipObjects={updatedRelationshipObjects}
              setRelationshipObjects={setRelationshipObjects}
              inEditMode={inEditMode}
              language={language}
              showDropZone={isDraggedObject}
              setPanelObject={setPanelObject}
            />
          )}
          {selectedTab === PanelTab.ContentOf && (
            <PanelContentOf
              isPage={isPage}
              objectType={objectType}
              uid={uid}
              inEditMode={inEditMode}
              language={language}
              setPanelObject={setPanelObject}
            />
          )}
          {selectedTab === PanelTab.AvailabilityDimensions && (
            <PanelAvailabilityDimensions
              isPage={isPage}
              objectType={objectType}
              uid={uid}
              inEditMode={inEditMode}
              availabilityDimensionValues={availabilityDimensionValues?.updated}
              setAvailabilityDimensionValues={(values, toggleEditMode) => {
                setAvailabilityDimensionValues(values);
                if (toggleEditMode) {
                  setEditMode(true);
                }
              }}
            />
          )}
        </>
      )}
    </section>
  );
};
