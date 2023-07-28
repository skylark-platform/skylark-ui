import { useRouter } from "next/router";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "react-toastify";

import { Tabs } from "src/components/tabs/tabs.component";
import { Toast } from "src/components/toast/toast.component";
import { useGetObject } from "src/hooks/objects/get/useGetObject";
import { useGetObjectPrefetchQueries } from "src/hooks/objects/get/useGetObjectPrefetchQueries";
import { useUpdateAvailabilityAssignedTo } from "src/hooks/objects/update/useUpdateAvailabilityAssignedTo";
import { useUpdateAvailabilityObjectDimensions } from "src/hooks/objects/update/useUpdateAvailabilityObjectDimensions";
import { useUpdateObjectAvailability } from "src/hooks/objects/update/useUpdateObjectAvailability";
import { useUpdateObjectContent } from "src/hooks/objects/update/useUpdateObjectContent";
import { useUpdateObjectMetadata } from "src/hooks/objects/update/useUpdateObjectMetadata";
import { useUpdateObjectRelationships } from "src/hooks/objects/update/useUpdateObjectRelationships";
import { PanelTab } from "src/hooks/state";
import {
  ParsedSkylarkObjectContentObject,
  ParsedSkylarkObject,
  AddedSkylarkObjectContentObject,
  SkylarkObjectMetadataField,
  SkylarkSystemField,
  SkylarkObjectIdentifier,
  BuiltInSkylarkObjectType,
} from "src/interfaces/skylark";
import { parseMetadataForHTMLForm } from "src/lib/skylark/parsers";
import {
  hasProperty,
  getObjectTypeDisplayNameFromParsedObject,
  getObjectDisplayName,
} from "src/lib/utils";

import {
  handleDroppedContents,
  HandleDropError,
  HandleDropErrorType,
} from "./panel.lib";
import {
  PanelAvailability,
  PanelHeader,
  PanelImages,
  PanelMetadata,
} from "./panelSections";
import { PanelAvailabilityAssignedTo } from "./panelSections/panelAvailabilityAssignedTo.component";
import { PanelAvailabilityDimensions } from "./panelSections/panelAvailabilityDimensions.component";
import { PanelContent } from "./panelSections/panelContent.component";
import { PanelContentOf } from "./panelSections/panelContentOf.component";
import { PanelPlayback } from "./panelSections/panelPlayback.component";
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

const tabsWithDropZones = [PanelTab.Content, PanelTab.Availability];

const tabsWithEditMode = [
  ...tabsWithDropZones,
  PanelTab.Metadata,
  PanelTab.Relationships,
  PanelTab.AvailabilityDimensions,
  PanelTab.AvailabilityAssignedTo,
];

const displayHandleDroppedErrors = (
  errors: HandleDropError[],
  tab: PanelTab,
  panelObject?: ParsedSkylarkObject,
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

    const objectTypeText = panelObject
      ? `"${getObjectTypeDisplayNameFromParsedObject(panelObject)}"`
      : "the active object";

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
  useGetObjectPrefetchQueries({
    ...object,
    selectedTab,
  });

  const { query: urlQuery } = useRouter();

  const [panelInEditMode, setEditMode] = useState(false);

  const [contentObjects, setContentObjects] = useState<{
    original: ParsedSkylarkObjectContentObject[] | null;
    updated: AddedSkylarkObjectContentObject[] | null;
  }>({
    original: null,
    updated: null,
  });

  const [modifiedRelationships, setModifiedRelationships] = useState<Record<
    string,
    { added: ParsedSkylarkObject[]; removed: string[] }
  > | null>(null);

  const [modifiedAvailabilityObjects, setModifiedAvailabilityObjects] =
    useState<{
      added: ParsedSkylarkObject[];
      removed: string[];
    } | null>(null);

  const [availabilityDimensionValues, setAvailabilityDimensionValues] =
    useState<{
      original: Record<string, string[]> | null;
      updated: Record<string, string[]> | null;
    }>({ original: null, updated: null });

  const [modifiedAvailabilityAssignedTo, setModifiedAvailabilityAssignedTo] =
    useState<{ added: ParsedSkylarkObject[] } | null>(null);

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

  const formParsedMetadata = useMemo(
    () =>
      (data &&
        objectMeta &&
        parseMetadataForHTMLForm(data.metadata, objectMeta.fields)) ||
      null,
    [data, objectMeta],
  );

  const metadataForm = useForm<Record<string, SkylarkObjectMetadataField>>({
    // Can't use onSubmit because we don't have a submit button within the form
    mode: "onTouched",
    values: formParsedMetadata || {},
  });
  const { reset: resetMetadataForm } = metadataForm;
  const inEditMode =
    panelInEditMode ||
    metadataForm.formState.isDirty ||
    modifiedRelationships !== null ||
    modifiedAvailabilityObjects !== null ||
    modifiedAvailabilityAssignedTo !== null;

  const tabs: PanelTab[] = useMemo(
    () =>
      [
        PanelTab.Metadata,
        objectMeta?.hasContent && PanelTab.Content,
        hasProperty(urlQuery, "next") &&
          objectMeta?.name === BuiltInSkylarkObjectType.SkylarkAsset &&
          PanelTab.Playback,
        objectMeta?.hasRelationships && PanelTab.Relationships,
        objectMeta?.images && PanelTab.Imagery,
        objectMeta?.hasContentOf && PanelTab.ContentOf,
        objectMeta?.hasAvailability && PanelTab.Availability,
        objectMeta?.name === BuiltInSkylarkObjectType.Availability &&
          PanelTab.AvailabilityDimensions,
        objectMeta?.name === BuiltInSkylarkObjectType.Availability &&
          PanelTab.AvailabilityAssignedTo,
      ].filter((tab) => !!tab) as PanelTab[],
    [
      objectMeta?.hasAvailability,
      objectMeta?.hasContent,
      objectMeta?.hasContentOf,
      objectMeta?.hasRelationships,
      objectMeta?.images,
      objectMeta?.name,
      urlQuery,
    ],
  );

  useEffect(() => {
    if (
      data &&
      droppedObjects &&
      droppedObjects.length > 0 &&
      tabsWithDropZones.includes(selectedTab)
    ) {
      setEditMode(true);

      if (selectedTab === PanelTab.Content && contentObjects.updated) {
        const { updatedContentObjects, errors } = handleDroppedContents({
          droppedObjects,
          panelObject: data,
          existingObjects: contentObjects.updated,
        });

        displayHandleDroppedErrors(errors, selectedTab, data);

        setContentObjects({
          ...contentObjects,
          updated: updatedContentObjects,
        });
      }

      clearDroppedObjects?.();
    }
  }, [clearDroppedObjects, contentObjects, data, droppedObjects, selectedTab]);

  const { updateObjectRelationships, isUpdatingObjectRelationships } =
    useUpdateObjectRelationships({
      objectType,
      onSuccess: () => {
        setModifiedRelationships(null);
        if (panelInEditMode) setEditMode(false);
      },
    });

  const { updateObjectMetadata, isUpdatingObjectMetadata } =
    useUpdateObjectMetadata({
      objectType,
      onSuccess: () => {
        resetMetadataForm(undefined, { keepValues: true });

        if (panelInEditMode) setEditMode(false);
      },
    });

  const { updateObjectContent, isUpdatingObjectContent } =
    useUpdateObjectContent({
      objectType,
      onSuccess: () => {
        if (panelInEditMode) setEditMode(false);
      },
    });

  const { updateObjectAvailability, isUpdatingObjectAvailability } =
    useUpdateObjectAvailability({
      objectType,
      onSuccess: () => {
        setModifiedAvailabilityObjects(null);
        if (panelInEditMode) setEditMode(false);
      },
    });

  const {
    updateAvailabilityObjectDimensions,
    isUpdatingAvailabilityObjectDimensions,
  } = useUpdateAvailabilityObjectDimensions({
    onSuccess: () => {
      if (panelInEditMode) setEditMode(false);
    },
  });

  const { updateAvailabilityAssignedTo, isUpdatingAvailabilityAssignedTo } =
    useUpdateAvailabilityAssignedTo({
      onSuccess: () => {
        setModifiedAvailabilityAssignedTo(null);
        if (panelInEditMode) setEditMode(false);
      },
    });

  const saveActiveTabChanges = () => {
    if (selectedTab === PanelTab.Content && contentObjects.updated) {
      updateObjectContent({
        uid,
        originalContentObjects: contentObjects.original,
        updatedContentObjects: contentObjects.updated,
      });
    } else if (
      selectedTab === PanelTab.Relationships &&
      modifiedRelationships
    ) {
      updateObjectRelationships({ uid, modifiedRelationships });
    } else if (
      selectedTab === PanelTab.Availability &&
      modifiedAvailabilityObjects
    ) {
      updateObjectAvailability({ uid, modifiedAvailabilityObjects });
    } else if (
      selectedTab === PanelTab.AvailabilityDimensions &&
      availabilityDimensionValues.updated
    ) {
      updateAvailabilityObjectDimensions({
        uid,
        originalAvailabilityDimensions: availabilityDimensionValues.original,
        updatedAvailabilityDimensions: availabilityDimensionValues.updated,
      });
    } else if (
      selectedTab === PanelTab.AvailabilityAssignedTo &&
      modifiedAvailabilityAssignedTo
    ) {
      updateAvailabilityAssignedTo({
        uid,
        modifiedAvailabilityAssignedTo,
      });
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

  const handleRelationshipsObjectsModified = (
    updatedModifiedRelationships: Record<
      string,
      {
        added: ParsedSkylarkObject[];
        removed: string[];
      }
    >,
    errors: HandleDropError[],
  ) => {
    setModifiedRelationships(updatedModifiedRelationships);
    displayHandleDroppedErrors(errors, selectedTab, data);
    clearDroppedObjects?.();
  };

  const handleAvailabilityObjectsModified = (
    updatedModifiedAvailabilities: {
      added: ParsedSkylarkObject[];
      removed: string[];
    },
    errors: HandleDropError[],
  ) => {
    setModifiedAvailabilityObjects(updatedModifiedAvailabilities);
    displayHandleDroppedErrors(errors, selectedTab, data);
    clearDroppedObjects?.();
  };

  const handleAvailabilityAssignedToModified = (
    updatedAssignedToObjects: {
      added: ParsedSkylarkObject[];
    },
    errors?: HandleDropError[],
  ) => {
    setModifiedAvailabilityAssignedTo(updatedAssignedToObjects);
    if (errors) displayHandleDroppedErrors(errors, selectedTab, data);
    clearDroppedObjects?.();
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
          isUpdatingAvailabilityObjectDimensions ||
          isUpdatingAvailabilityAssignedTo
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
            setModifiedRelationships(null);
            setModifiedAvailabilityObjects(null);
            setAvailabilityDimensionValues({
              original: availabilityDimensionValues.original,
              updated: availabilityDimensionValues.original,
            });
            setModifiedAvailabilityAssignedTo(null);
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
        <div className="scrollbar-hidden mx-auto w-full max-w-7xl flex-none overflow-x-auto">
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
              objectFieldConfig={data?.config.fieldConfig}
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
          {selectedTab === PanelTab.Playback && (
            <PanelPlayback
              isPage={isPage}
              metadata={formParsedMetadata}
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
              droppedObjects={droppedObjects}
              showDropZone={isDraggedObject}
              modifiedAvailabilityObjects={modifiedAvailabilityObjects}
              setAvailabilityObjects={handleAvailabilityObjectsModified}
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
              modifiedRelationships={modifiedRelationships || {}}
              setModifiedRelationships={handleRelationshipsObjectsModified}
              inEditMode={inEditMode}
              language={language}
              showDropZone={isDraggedObject}
              droppedObjects={droppedObjects}
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
          {selectedTab === PanelTab.AvailabilityAssignedTo && (
            <PanelAvailabilityAssignedTo
              isPage={isPage}
              inEditMode={inEditMode}
              showDropZone={isDraggedObject}
              modifiedAvailabilityAssignedTo={modifiedAvailabilityAssignedTo}
              droppedObjects={droppedObjects}
              setModifiedAvailabilityAssignedTo={
                handleAvailabilityAssignedToModified
              }
            />
          )}
        </>
      )}
    </section>
  );
};
