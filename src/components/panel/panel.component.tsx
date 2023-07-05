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
import { PanelTab } from "src/hooks/state/usePanelObjectState";
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
  hasProperty,
  getObjectTypeDisplayNameFromParsedObject,
  getObjectDisplayName,
} from "src/lib/utils";

import {
  handleDroppedRelationships,
  handleDroppedContents,
  handleDroppedAvailabilities,
  HandleDropError,
  HandleDropErrorType,
} from "./panel.lib";
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
  droppedObjects?: ParsedSkylarkObject[];
  tab: PanelTab;
  clearDroppedObjects?: () => void;
  setPanelObject: (o: SkylarkObjectIdentifier) => void;
  setTab: (t: PanelTab) => void;
  navigateToPreviousPanelObject?: () => void;
  navigateToForwardPanelObject?: () => void;
}

const tabsWithDropZones = [
  PanelTab.Content,
  PanelTab.Relationships,
  PanelTab.Availability,
];

const tabsWithEditMode = [
  ...tabsWithDropZones,
  PanelTab.Metadata,
  PanelTab.AvailabilityDimensions,
];

const displayHandleDroppedErrors = (
  errors: HandleDropError[],
  panelObject: ParsedSkylarkObject,
  tab: PanelTab,
) => {
  const addedToSelfError = errors.find(
    (error) => error.type === HandleDropErrorType.OBJECTS_ARE_SAME,
  );

  if (addedToSelfError) {
    toast.error(
      <Toast
        title={`Object added to self`}
        message={`Cannot link ${getObjectTypeDisplayNameFromParsedObject(
          addedToSelfError.object,
        )} "${getObjectDisplayName(addedToSelfError.object)}" to itself.`}
      />,
      { autoClose: 10000 },
    );
  }

  const invalidObjectTypeErrors = errors.filter(
    (error) => error.type === HandleDropErrorType.INVALID_OBJECT_TYPE,
  );

  if (invalidObjectTypeErrors.length > 0) {
    const invalidObjectTypes = [
      ...new Set(
        invalidObjectTypeErrors.map(({ object }) =>
          getObjectTypeDisplayNameFromParsedObject(object),
        ),
      ),
    ];

    const objectTypeText = `"${getObjectTypeDisplayNameFromParsedObject(
      panelObject,
    )}"`;

    let tabText = `are not configured to link to ${objectTypeText}`;
    if (tab === PanelTab.Content) {
      tabText = `are not configured to be added as content of ${objectTypeText}`;
    } else if (tab === PanelTab.Relationships) {
      tabText = `are not configured to be related to ${objectTypeText}`;
    } else if (tab === PanelTab.Availability) {
      tabText = 'are not valid "Availability" objects';
    }

    const affectedObjectsMsg = invalidObjectTypeErrors.map(
      ({ object }) => `- ${getObjectDisplayName(object)}`,
    );
    toast.error(
      <Toast
        title={`Invalid Object Type${invalidObjectTypes.length > 1 ? "s" : ""}`}
        message={[
          `Types "${invalidObjectTypes.join(", ")}" ${tabText}.`,
          `Affected object(s):`,
          ...affectedObjectsMsg,
        ]}
      />,
      { autoClose: 10000 },
    );
  }

  const existingLinkErrors = errors.filter(
    (error) => error.type === HandleDropErrorType.EXISTING_LINK,
  );

  if (existingLinkErrors.length > 0) {
    const affectedObjectsMsg = existingLinkErrors.map(
      ({ object }) => `- ${getObjectDisplayName(object)}`,
    );
    toast.error(
      <Toast
        title={`Existing Linked Object${
          existingLinkErrors.length > 1 ? "s" : ""
        }`}
        message={[`Affected object(s):`, ...affectedObjectsMsg]}
        messageClassName="w-full line-clamp-1"
      />,
      { autoClose: 10000 },
    );
  }
};

export const Panel = ({
  isPage,
  object,
  tab: selectedTab,
  closePanel,
  isDraggedObject,
  droppedObjects,
  clearDroppedObjects,
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

  const [relationshipObjects, setRelationshipObjects] = useState<{
    original: ParsedSkylarkObjectRelationships[] | null;
    updated: ParsedSkylarkObjectRelationships[] | null;
  }>({ original: null, updated: null });

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
    if (
      data &&
      droppedObjects &&
      droppedObjects.length > 0 &&
      tabsWithDropZones.includes(selectedTab)
    ) {
      setEditMode(true);

      if (
        selectedTab === PanelTab.Relationships &&
        objectMeta?.relationships &&
        relationshipObjects.updated
      ) {
        const { updatedRelationshipObjects, errors } =
          handleDroppedRelationships({
            droppedObjects,
            panelObject: data,
            existingObjects: relationshipObjects.updated,
            objectMetaRelationships: objectMeta.relationships,
          });

        displayHandleDroppedErrors(errors, data, selectedTab);

        setRelationshipObjects({
          ...relationshipObjects,
          updated: updatedRelationshipObjects,
        });
      }

      if (selectedTab === PanelTab.Content && contentObjects.updated) {
        const { updatedContentObjects, errors } = handleDroppedContents({
          droppedObjects,
          panelObject: data,
          existingObjects: contentObjects.updated,
        });

        displayHandleDroppedErrors(errors, data, selectedTab);

        setContentObjects({
          ...contentObjects,
          updated: updatedContentObjects,
        });
      }

      if (
        selectedTab === PanelTab.Availability &&
        availabilityObjects.updated
      ) {
        const { updatedAvailabilityObjects, errors } =
          handleDroppedAvailabilities({
            droppedObjects,
            panelObject: data,
            existingObjects: availabilityObjects.updated,
          });

        displayHandleDroppedErrors(errors, data, selectedTab);

        setAvailabilityObjects({
          ...availabilityObjects,
          updated: updatedAvailabilityObjects,
        });
      }

      clearDroppedObjects?.();
    }
  }, [
    availabilityObjects,
    clearDroppedObjects,
    contentObjects,
    data,
    droppedObjects,
    objectMeta?.relationships,
    relationshipObjects,
    selectedTab,
  ]);

  const { updateObjectRelationships, isUpdatingObjectRelationships } =
    useUpdateObjectRelationships({
      objectType,
      uid,
      updatedRelationshipObjects: relationshipObjects.updated,
      originalRelationshipObjects: relationshipObjects.original,
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
      relationshipObjects.updated
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
              original: relationshipObjects.original,
              updated: relationshipObjects.original,
            });
            setAvailabilityDimensionValues({
              original: availabilityDimensionValues.original,
              updated: availabilityDimensionValues.original,
            });
            clearDroppedObjects?.();
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
              updatedRelationshipObjects={relationshipObjects.updated}
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
