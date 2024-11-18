import { useState } from "react";

import { AvailabilityInheritanceIcon } from "src/components/availability";
import { Checkbox } from "src/components/inputs/checkbox";
import { ObjectTypeSelect } from "src/components/inputs/select";
import { Switch } from "src/components/inputs/switch/switch.component";
import { DisplayGraphQLQuery } from "src/components/modals";
import { ObjectIdentifierCard } from "src/components/objectIdentifier";
import {
  HandleDropError,
  handleDroppedObjectsToAssignToAvailability,
} from "src/components/panel/panel.lib";
import { PanelDropZone } from "src/components/panel/panelDropZone/panelDropZone.component";
import { PanelLoading } from "src/components/panel/panelLoading";
import { PanelSectionTitle } from "src/components/panel/panelTypography";
import { useGetAvailabilityAssignedTo } from "src/hooks/availability/useAvailabilityAssignedTo";
import { useIsDragging } from "src/hooks/dnd/useIsDragging";
import { usePanelDropzone } from "src/hooks/dnd/usePanelDropzone";
import { PanelTab, PanelTabState, SetPanelObject } from "src/hooks/state";
import {
  BuiltInSkylarkObjectType,
  AvailabilityAssignedToObject,
  SkylarkObject,
} from "src/interfaces/skylark";
import { DragType, DroppableType } from "src/lib/dndkit/dndkit";

import { PanelSectionLayout } from "./panelSectionLayout.component";

interface PanelAvailabilityAssignedToProps {
  uid: string;
  isPage?: boolean;
  inEditMode: boolean;
  modifiedAvailabilityAssignedTo: {
    added: SkylarkObject[];
    removed: SkylarkObject[];
  } | null;
  tabState: PanelTabState[PanelTab.AvailabilityAssignedTo];
  setPanelObject: SetPanelObject;
  setModifiedAvailabilityAssignedTo: (
    args: {
      added: SkylarkObject[];
      removed: SkylarkObject[];
    },
    errors?: HandleDropError[],
  ) => void;
  updateActivePanelTabState: (s: Partial<PanelTabState>) => void;
}

const mergeServerAndModifiedAssignedTo = (
  serverAssignedTo: AvailabilityAssignedToObject[] | undefined,
  modifiedAvailabilityAssignedTo: PanelAvailabilityAssignedToProps["modifiedAvailabilityAssignedTo"],
): SkylarkObject[] => {
  if (!serverAssignedTo && !modifiedAvailabilityAssignedTo) {
    return [];
  }

  const parsedServerAssignedTo: SkylarkObject[] =
    serverAssignedTo?.map(({ object }) => object) || [];

  if (!modifiedAvailabilityAssignedTo) {
    return parsedServerAssignedTo;
  }

  const inheritedUids = serverAssignedTo
    ?.filter(({ inherited }) => inherited)
    .map(({ object: { uid } }) => uid);

  const removedUids = modifiedAvailabilityAssignedTo.removed.map(
    ({ uid }) => uid,
  );
  const filteredServerObjects = parsedServerAssignedTo.filter(
    ({ uid }) => inheritedUids?.includes(uid) || !removedUids.includes(uid),
  );

  // Remove any disabled inherited objects that have been enabled
  const filteredAddedObjects = modifiedAvailabilityAssignedTo.added.filter(
    ({ uid }) => !inheritedUids?.includes(uid),
  );

  return [...filteredServerObjects, ...filteredAddedObjects];
};

export const PanelAvailabilityAssignedTo = ({
  uid,
  isPage,
  inEditMode,
  modifiedAvailabilityAssignedTo,
  tabState,
  setPanelObject,
  setModifiedAvailabilityAssignedTo,
  updateActivePanelTabState,
}: PanelAvailabilityAssignedToProps) => {
  const [{ objectType, hideInherited }, setFilters] = useState(
    tabState.filters || {
      objectType: "",
      hideInherited: false,
    },
  );

  const setFiltersWrapper = (
    updated: Partial<{ objectType: string; hideInherited: boolean }>,
  ) => {
    const filters = { objectType, hideInherited, ...updated };

    setFilters(filters);
    updateActivePanelTabState({
      [PanelTab.AvailabilityAssignedTo]: {
        filters,
      },
    });
  };

  const {
    data,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    query,
    variables,
    fetchNextPage,
  } = useGetAvailabilityAssignedTo(uid);

  const objects = mergeServerAndModifiedAssignedTo(
    data,
    modifiedAvailabilityAssignedTo,
  );

  const objectsLinkedViaInheritance = data?.filter(
    ({ inherited }) => inherited,
  );
  const uidsLinkedViaInheritance = objectsLinkedViaInheritance?.map(
    ({ object: { uid } }) => uid,
  );
  const activeUids = objectsLinkedViaInheritance
    ?.filter(({ active }) => active)
    .map(({ object: { uid } }) => uid);

  const toggledOffInheritedObjects = activeUids?.filter((uid) =>
    modifiedAvailabilityAssignedTo?.removed?.find((obj) => obj.uid === uid),
  );

  const [showDropZone] = useIsDragging(DragType.CONTENT_LIBRARY_OBJECT);

  usePanelDropzone(DroppableType.PANEL_GENERIC, {
    onObjectsDropped: (droppedObjects) => {
      if (droppedObjects && droppedObjects.length > 0) {
        const existingUids = objects.map(({ uid }) => uid);
        const uniqueDroppedObjects = existingUids
          ? droppedObjects.filter(({ uid }) => !existingUids.includes(uid))
          : droppedObjects;

        const { updatedAssignedToObjects, errors } =
          handleDroppedObjectsToAssignToAvailability({
            newObjects: uniqueDroppedObjects,
          });

        const serverAssignedToUids =
          data?.map(({ object: { uid } }) => uid) || [];
        const updatedAssignedToObjectsWithExistingServerObjectsFilteredOut =
          updatedAssignedToObjects.filter(
            ({ uid }) => !serverAssignedToUids.includes(uid),
          );

        const updatedAssignedToUids = updatedAssignedToObjects.map(
          ({ uid }) => uid,
        );

        setModifiedAvailabilityAssignedTo(
          {
            added: modifiedAvailabilityAssignedTo
              ? [
                  ...modifiedAvailabilityAssignedTo.added,
                  ...updatedAssignedToObjectsWithExistingServerObjectsFilteredOut,
                ]
              : updatedAssignedToObjectsWithExistingServerObjectsFilteredOut,
            removed:
              modifiedAvailabilityAssignedTo?.removed.filter(
                ({ uid }) => !updatedAssignedToUids.includes(uid),
              ) || [],
          },
          errors,
        );
      }
    },
  });

  if (showDropZone) {
    return <PanelDropZone />;
  }

  const addedUids = modifiedAvailabilityAssignedTo?.added.map(({ uid }) => uid);

  const handleDeletedAssignedTo = (object: SkylarkObject) => {
    const isAlreadyRemoved = Boolean(
      modifiedAvailabilityAssignedTo?.removed &&
        modifiedAvailabilityAssignedTo.removed.findIndex(
          ({ uid }) => object.uid === uid,
        ) > -1,
    );

    const added = modifiedAvailabilityAssignedTo?.added.filter(
      ({ uid }) => uid !== object.uid,
    );

    const removed = isAlreadyRemoved
      ? modifiedAvailabilityAssignedTo?.removed
      : [...(modifiedAvailabilityAssignedTo?.removed || []), object];

    setModifiedAvailabilityAssignedTo({
      added: added || [],
      removed: removed || [],
    });
  };

  const handleEnableInheritedAssignedTo = (object: SkylarkObject) => {
    const wasOriginallyActive = activeUids?.includes(object.uid);
    const added = modifiedAvailabilityAssignedTo?.added || [];

    setModifiedAvailabilityAssignedTo({
      added: wasOriginallyActive ? added : [...added, object],
      removed:
        modifiedAvailabilityAssignedTo?.removed.filter(
          ({ uid }) => uid !== object.uid,
        ) || [],
    });
  };

  return (
    <PanelSectionLayout sections={[]} isPage={isPage} withStickyHeaders>
      <div
        data-testid="panel-availability-assigned-to"
        className="pb-32 w-full"
      >
        <div className="w-full sticky bg-white pt-4 pb-2 top-0 z-10">
          <PanelSectionTitle text={"Assigned to"} />
          <ObjectTypeSelect
            onChange={({ objectType }) => setFiltersWrapper({ objectType })}
            variant="primary"
            selected={objectType}
            placeholder="Filter for Object Type"
            onValueClear={() => setFiltersWrapper({ objectType: "" })}
            hiddenObjectTypes={[
              BuiltInSkylarkObjectType.Availability,
              BuiltInSkylarkObjectType.AvailabilitySegment,
            ]}
          />
          <Checkbox
            label="Hide objects linked via Inheritance"
            className="mt-2 font-normal"
            checked={hideInherited}
            onCheckedChange={(checked) =>
              setFiltersWrapper({ hideInherited: Boolean(checked) })
            }
          />
          <DisplayGraphQLQuery
            label="Get Availability Assigned To"
            query={query}
            variables={variables}
            buttonClassName="absolute -right-4 md:-right-6 top-0"
          />
        </div>
        {objects
          ?.filter(
            (o) =>
              (!objectType || o.objectType === objectType) &&
              (!hideInherited ||
                (hideInherited && !uidsLinkedViaInheritance?.includes(o.uid))),
          )
          .map((object) => {
            const isNewlyAdded = addedUids?.includes(object.uid);

            const isInheited = uidsLinkedViaInheritance?.includes(object.uid);
            const isActive = toggledOffInheritedObjects?.includes(object.uid)
              ? false
              : isNewlyAdded || activeUids?.includes(object.uid) || false;

            return (
              <ObjectIdentifierCard
                key={`assigned-to-card-${object.uid}`}
                object={object}
                disableDeleteClick={!inEditMode}
                disableForwardClick={inEditMode}
                hideAvailabilityStatus
                onForwardClick={setPanelObject}
                onDeleteClick={
                  !isInheited
                    ? () => handleDeletedAssignedTo(object)
                    : undefined
                }
              >
                {isInheited && (
                  <>
                    <div className="relative w-6">
                      <Switch
                        size="small"
                        enabled={isActive}
                        onChange={(active) =>
                          active
                            ? handleEnableInheritedAssignedTo(object)
                            : handleDeletedAssignedTo(object)
                        }
                      />
                    </div>
                    <AvailabilityInheritanceIcon
                      status={null}
                      className="text-lg"
                      tooltip="Linked by Availability Inheritance"
                    />
                  </>
                )}

                {isNewlyAdded && !isInheited && (
                  <span
                    className={
                      "flex h-4 w-4 items-center justify-center rounded-full bg-success px-1 pb-0.5 text-center text-white transition-colors"
                    }
                  />
                )}
              </ObjectIdentifierCard>
            );
          })}
      </div>
      <PanelLoading
        isLoading={isLoading || isFetchingNextPage || hasNextPage}
        loadMore={fetchNextPage}
      />
    </PanelSectionLayout>
  );
};
