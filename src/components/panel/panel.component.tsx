import { useCallback, useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "react-toastify";
import { sentenceCase } from "sentence-case";

import {
  Tabs,
  convertStringArrToTabs,
} from "src/components/tabs/tabs.component";
import {
  GraphQLRequestErrorToast,
  Toast,
} from "src/components/toast/toast.component";
import { useGetObject } from "src/hooks/objects/get/useGetObject";
import { useGetObjectPrefetchQueries } from "src/hooks/objects/get/useGetObjectPrefetchQueries";
import { useUpdateAvailabilityAssignedTo } from "src/hooks/objects/update/useUpdateAvailabilityAssignedTo";
import { useUpdateAvailabilityObjectDimensions } from "src/hooks/objects/update/useUpdateAvailabilityObjectDimensions";
import { useUpdateObjectAvailability } from "src/hooks/objects/update/useUpdateObjectAvailability";
import { useUpdateObjectContent } from "src/hooks/objects/update/useUpdateObjectContent";
import { useUpdateObjectMetadata } from "src/hooks/objects/update/useUpdateObjectMetadata";
import { useUpdateObjectRelationships } from "src/hooks/objects/update/useUpdateObjectRelationships";
import { PanelTab, PanelTabState } from "src/hooks/state";
import {
  ObjectTypeWithConfig,
  useSkylarkObjectTypesWithConfig,
} from "src/hooks/useSkylarkObjectTypes";
import {
  ParsedSkylarkObjectContentObject,
  ParsedSkylarkObject,
  AddedSkylarkObjectContentObject,
  SkylarkObjectMetadataField,
  SkylarkSystemField,
  SkylarkObjectIdentifier,
  BuiltInSkylarkObjectType,
  GQLSkylarkErrorResponse,
  ParsedSkylarkObjectConfig,
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
  HandleRelationshipDropError,
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
  tabState: PanelTabState;
  clearDroppedObjects?: () => void;
  setPanelObject: (o: SkylarkObjectIdentifier, tab?: PanelTab) => void;
  setTab: (t: PanelTab) => void;
  navigateToPreviousPanelObject?: () => void;
  navigateToForwardPanelObject?: () => void;
  updateActivePanelTabState: (s: Partial<PanelTabState>) => void;
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
  objectTypesWithConfig?: ObjectTypeWithConfig[],
) => {
  const objectTypeConfigObject:
    | Record<string, ParsedSkylarkObjectConfig>
    | undefined = objectTypesWithConfig
    ? Object.fromEntries(
        objectTypesWithConfig.map(({ objectType, config }) => [
          objectType,
          config,
        ]),
      )
    : undefined;

  const addedToSelfError = errors.find(
    (error) => error.type === HandleDropErrorType.OBJECTS_ARE_SAME,
  );

  if (addedToSelfError) {
    toast.error(
      <Toast
        title={`Object added to self`}
        message={`Cannot link ${getObjectTypeDisplayNameFromParsedObject(
          addedToSelfError.object,
          objectTypeConfigObject,
        )} "${getObjectDisplayName(
          addedToSelfError.object,
          objectTypeConfigObject,
        )}" to itself.`}
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
          getObjectTypeDisplayNameFromParsedObject(
            object,
            objectTypeConfigObject,
          ),
        ),
      ),
    ];

    const objectTypeText = panelObject
      ? `"${getObjectTypeDisplayNameFromParsedObject(
          panelObject,
          objectTypeConfigObject,
        )}"`
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
      ({ object }) =>
        `- ${getObjectDisplayName(object, objectTypeConfigObject)}`,
    );
    toast.error(
      <Toast
        title={`Invalid Object Type${invalidObjectTypes.length > 1 ? "s" : ""}`}
        message={[
          `Type${
            invalidObjectTypes.length > 1 ? "s" : ""
          } "${invalidObjectTypes.join(", ")}" ${tabText}.`,
          `Affected object(s):`,
          ...affectedObjectsMsg,
        ]}
      />,
      { autoClose: 10000 },
    );
  }

  const invalidRelationshipTypeErrors = errors.filter(
    (error) => error.type === HandleDropErrorType.INVALID_RELATIONSHIP_TYPE,
  );

  if (invalidRelationshipTypeErrors.length > 0) {
    const invalidObjectTypes = [
      ...new Set(
        invalidRelationshipTypeErrors.map(({ object }) =>
          getObjectTypeDisplayNameFromParsedObject(
            object,
            objectTypeConfigObject,
          ),
        ),
      ),
    ];

    const relationshipName = (
      invalidRelationshipTypeErrors.find(
        (error) =>
          error.type === HandleDropErrorType.INVALID_RELATIONSHIP_TYPE &&
          error.targetRelationship,
      ) as HandleRelationshipDropError
    )?.targetRelationship;

    const relationshipTypeText =
      sentenceCase(relationshipName) || "Active relationship";

    const affectedObjectsMsg = invalidRelationshipTypeErrors.map(
      ({ object }) =>
        `- ${getObjectDisplayName(object, objectTypeConfigObject)}`,
    );
    toast.error(
      <Toast
        title={`Invalid Object Type${
          invalidObjectTypes.length > 1 ? "s" : ""
        } for Relationship`}
        message={[
          `Type${
            invalidObjectTypes.length > 1 ? "s" : ""
          } "${invalidObjectTypes.join(
            ", ",
          )}" cannot be linked to the relationship "${relationshipTypeText}".`,
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
      ({ object }) =>
        `- ${getObjectDisplayName(object, objectTypeConfigObject)}`,
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

const showUpdateErrorToast = (error: GQLSkylarkErrorResponse) =>
  toast.error(
    <GraphQLRequestErrorToast title={`Error saving changes`} error={error} />,
    { autoClose: 10000 },
  );

export const Panel = ({
  isPage,
  object,
  tab: selectedTab,
  closePanel,
  isDraggedObject,
  droppedObjects,
  tabState,
  clearDroppedObjects,
  setTab: setSelectedTab,
  navigateToPreviousPanelObject,
  navigateToForwardPanelObject,
  setPanelObject,
  updateActivePanelTabState,
}: PanelProps) => {
  useGetObjectPrefetchQueries({
    ...object,
    selectedTab,
  });

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
    useState<{
      added: ParsedSkylarkObject[];
      removed: ParsedSkylarkObject[];
    } | null>(null);

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

  const { objectTypesWithConfig } = useSkylarkObjectTypesWithConfig();

  const formParsedMetadata = useMemo(
    () =>
      (data &&
        objectMeta &&
        parseMetadataForHTMLForm(
          data.metadata,
          objectMeta.operations.create.inputs,
        )) ||
      null,
    [data, objectMeta],
  );

  const metadataForm = useForm<Record<string, SkylarkObjectMetadataField>>({
    // Can't use onSubmit because we don't have a submit button within the form
    mode: "onTouched",
    values: formParsedMetadata || {},
  });
  const isMetadataFormDirty = !!Object.keys(metadataForm.formState.dirtyFields)
    .length; // https://github.com/react-hook-form/react-hook-form/issues/3213

  const { reset: resetMetadataForm } = metadataForm;
  const inEditMode =
    panelInEditMode ||
    isMetadataFormDirty ||
    modifiedRelationships !== null ||
    modifiedAvailabilityObjects !== null ||
    modifiedAvailabilityAssignedTo !== null;

  // When an object is in draft and no values have changed, we want to publish the version on save without creating another version
  const onlyPublishOnSave =
    data?.meta.published === false && !isMetadataFormDirty;

  const tabs: PanelTab[] = useMemo(
    () =>
      [
        PanelTab.Metadata,
        objectMeta?.hasContent && PanelTab.Content,
        (objectMeta?.name === BuiltInSkylarkObjectType.SkylarkAsset ||
          objectMeta?.name === BuiltInSkylarkObjectType.SkylarkLiveAsset) &&
          PanelTab.Playback,
        objectMeta?.hasRelationships && PanelTab.Relationships,
        // If relationship, put Playback tab after Relationships
        (objectMeta?.builtinObjectRelationships?.hasAssets ||
          objectMeta?.builtinObjectRelationships?.hasLiveAssets) &&
          PanelTab.Playback,
        objectMeta?.builtinObjectRelationships?.images && PanelTab.Imagery,
        objectMeta?.hasContentOf && PanelTab.ContentOf,
        objectMeta?.hasAvailability && PanelTab.Availability,
        objectMeta?.name === BuiltInSkylarkObjectType.Availability &&
          PanelTab.AvailabilityDimensions,
        objectMeta?.name === BuiltInSkylarkObjectType.Availability &&
          PanelTab.AvailabilityAssignedTo,
      ].filter((tab): tab is PanelTab => !!tab),
    [
      objectMeta?.hasAvailability,
      objectMeta?.hasContent,
      objectMeta?.hasContentOf,
      objectMeta?.hasRelationships,
      objectMeta?.builtinObjectRelationships,
      objectMeta?.name,
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

        displayHandleDroppedErrors(
          errors,
          selectedTab,
          data,
          objectTypesWithConfig,
        );

        setContentObjects({
          ...contentObjects,
          updated: updatedContentObjects,
        });
      }

      clearDroppedObjects?.();
    }
  }, [
    clearDroppedObjects,
    contentObjects,
    data,
    droppedObjects,
    objectTypesWithConfig,
    selectedTab,
  ]);

  const { updateObjectRelationships, isUpdatingObjectRelationships } =
    useUpdateObjectRelationships({
      objectType,
      onSuccess: () => {
        setModifiedRelationships(null);
        if (panelInEditMode) setEditMode(false);
      },
      onError: showUpdateErrorToast,
    });

  const { updateObjectMetadata, isUpdatingObjectMetadata } =
    useUpdateObjectMetadata({
      objectType,
      onSuccess: () => {
        resetMetadataForm(undefined, { keepValues: true, keepDirty: false });

        if (panelInEditMode) setEditMode(false);
      },
      onError: showUpdateErrorToast,
    });

  const { updateObjectContent, isUpdatingObjectContent } =
    useUpdateObjectContent({
      objectType,
      onSuccess: () => {
        if (panelInEditMode) setEditMode(false);
      },
      onError: showUpdateErrorToast,
    });

  const { updateObjectAvailability, isUpdatingObjectAvailability } =
    useUpdateObjectAvailability({
      objectType,
      onSuccess: () => {
        setModifiedAvailabilityObjects(null);
        if (panelInEditMode) setEditMode(false);
      },
      onError: showUpdateErrorToast,
    });

  const {
    updateAvailabilityObjectDimensions,
    isUpdatingAvailabilityObjectDimensions,
  } = useUpdateAvailabilityObjectDimensions({
    onSuccess: () => {
      if (panelInEditMode) setEditMode(false);
    },
    onError: showUpdateErrorToast,
  });

  const { updateAvailabilityAssignedTo, isUpdatingAvailabilityAssignedTo } =
    useUpdateAvailabilityAssignedTo({
      onSuccess: () => {
        setModifiedAvailabilityAssignedTo(null);
        if (panelInEditMode) setEditMode(false);
      },
      // onError: showUpdateErrorToast,
      onError: (e) => console.log(e),
    });

  const saveActiveTabChanges = (opts?: { draft?: boolean }) => {
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
      if (onlyPublishOnSave) {
        updateObjectMetadata({
          uid,
          language,
          metadata: null,
          draft: false,
          languageVersion: data.meta.versions?.language,
          globalVersion: data.meta.versions?.global,
        });
      } else {
        metadataForm.handleSubmit((values) => {
          if (
            hasProperty(values, SkylarkSystemField.ExternalID) &&
            values[SkylarkSystemField.ExternalID] ===
              data?.metadata[SkylarkSystemField.ExternalID]
          ) {
            // Remove External ID when it hasn't changed
            delete values[SkylarkSystemField.ExternalID];
          }
          updateObjectMetadata({
            uid,
            language,
            metadata: values,
            draft: opts?.draft,
          });
        })();
      }
    } else {
      setEditMode(false);
    }
  };

  const handleRelationshipsObjectsModified = useCallback(
    (
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
      displayHandleDroppedErrors(
        errors,
        selectedTab,
        data,
        objectTypesWithConfig,
      );
      clearDroppedObjects?.();
    },
    [clearDroppedObjects, data, objectTypesWithConfig, selectedTab],
  );

  const handleAvailabilityObjectsModified = useCallback(
    (
      updatedModifiedAvailabilities: {
        added: ParsedSkylarkObject[];
        removed: string[];
      },
      errors: HandleDropError[],
    ) => {
      setModifiedAvailabilityObjects(updatedModifiedAvailabilities);
      displayHandleDroppedErrors(
        errors,
        selectedTab,
        data,
        objectTypesWithConfig,
      );
      clearDroppedObjects?.();
    },
    [clearDroppedObjects, data, objectTypesWithConfig, selectedTab],
  );

  const handleAvailabilityAssignedToModified = useCallback(
    (
      updatedAssignedToObjects: {
        added: ParsedSkylarkObject[];
        removed: ParsedSkylarkObject[];
      },
      errors?: HandleDropError[],
    ) => {
      setModifiedAvailabilityAssignedTo(updatedAssignedToObjects);
      if (errors)
        displayHandleDroppedErrors(
          errors,
          selectedTab,
          data,
          objectTypesWithConfig,
        );
      clearDroppedObjects?.();
    },
    [clearDroppedObjects, data, objectTypesWithConfig, selectedTab],
  );

  return (
    <section
      className="mx-auto flex h-full w-full flex-col overflow-y-hidden break-words"
      data-cy={`panel-for-${objectType}-${uid}`}
      data-testid="panel"
      data-tab={selectedTab}
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
        objectMetadataHasChanged={isMetadataFormDirty}
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
          setPanelObject(
            { uid, objectType, language: newLanguage },
            selectedTab,
          )
        }
        navigateToPreviousPanelObject={navigateToPreviousPanelObject}
        navigateToForwardPanelObject={navigateToForwardPanelObject}
      />
      <div className="border-b-2 border-gray-200">
        <div
          className="scrollbar-hidden mx-auto w-full max-w-7xl flex-none overflow-x-auto"
          data-testid="panel-tabs"
        >
          <Tabs
            tabs={convertStringArrToTabs(tabs)}
            selectedTab={selectedTab}
            onChange={({ name }) => setSelectedTab(name as PanelTab)}
            disabled={tabs.length === 0 || inEditMode || isError}
            className="px-2 md:px-4"
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
              objectType={objectType}
              uid={uid}
              language={language}
              setPanelObject={setPanelObject}
              inEditMode={inEditMode}
            />
          )}
          {selectedTab === PanelTab.Playback && (
            <PanelPlayback
              isPage={isPage}
              objectType={objectType}
              uid={uid}
              language={language}
              objectMeta={objectMeta}
              metadata={formParsedMetadata}
              setPanelObject={setPanelObject}
              inEditMode={inEditMode}
            />
          )}
          {selectedTab === PanelTab.Availability && (
            <PanelAvailability
              isPage={isPage}
              objectType={objectType}
              uid={uid}
              language={language}
              setPanelObject={setPanelObject}
              inEditMode={inEditMode}
              droppedObjects={droppedObjects}
              showDropZone={isDraggedObject}
              modifiedAvailabilityObjects={modifiedAvailabilityObjects}
              tabState={tabState[PanelTab.Availability]}
              setAvailabilityObjects={handleAvailabilityObjectsModified}
              updateActivePanelTabState={updateActivePanelTabState}
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
              tabState={tabState[PanelTab.Relationships]}
              showDropZone={isDraggedObject}
              droppedObjects={droppedObjects}
              setPanelObject={setPanelObject}
              updateActivePanelTabState={updateActivePanelTabState}
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
              uid={uid}
              inEditMode={inEditMode}
              showDropZone={isDraggedObject}
              modifiedAvailabilityAssignedTo={modifiedAvailabilityAssignedTo}
              droppedObjects={droppedObjects}
              tabState={tabState[PanelTab.AvailabilityAssignedTo]}
              setPanelObject={setPanelObject}
              setModifiedAvailabilityAssignedTo={
                handleAvailabilityAssignedToModified
              }
              updateActivePanelTabState={updateActivePanelTabState}
            />
          )}
        </>
      )}
    </section>
  );
};
