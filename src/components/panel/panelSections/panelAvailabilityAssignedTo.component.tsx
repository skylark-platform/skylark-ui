import { useEffect } from "react";

import { ObjectIdentifierCard } from "src/components/objectIdentifierCard";
import {
  HandleDropError,
  handleDroppedObjectsToAssignToAvailability,
} from "src/components/panel/panel.lib";
import { PanelDropZone } from "src/components/panel/panelDropZone/panelDropZone.component";
import { PanelLoading } from "src/components/panel/panelLoading";
import { PanelSectionTitle } from "src/components/panel/panelTypography";
import { useGetAvailabilityAssignedTo } from "src/hooks/availability/useAvailabilityAssignedTo";
import {
  AvailabilityStatus,
  ParsedAvailabilityAssignedToObject,
  ParsedSkylarkObject,
  SkylarkObjectIdentifier,
} from "src/interfaces/skylark";
import { parseSkylarkObject } from "src/lib/skylark/parsers";
import { formatObjectField } from "src/lib/utils";

import { PanelSectionLayout } from "./panelSectionLayout.component";

interface PanelAvailabilityAssignedToProps {
  uid: string;
  isPage?: boolean;
  inEditMode: boolean;
  showDropZone?: boolean;
  droppedObjects?: ParsedSkylarkObject[];
  modifiedAvailabilityAssignedTo: {
    added: ParsedSkylarkObject[];
    removed: string[];
  } | null;
  setPanelObject: (o: SkylarkObjectIdentifier) => void;
  setModifiedAvailabilityAssignedTo: (
    args: {
      added: ParsedSkylarkObject[];
      removed: string[];
    },
    errors?: HandleDropError[],
  ) => void;
}

const mergeServerAndModifiedAssignedTo = (
  serverAssignedTo: ParsedAvailabilityAssignedToObject[] | undefined,
  modifiedAvailabilityAssignedTo: PanelAvailabilityAssignedToProps["modifiedAvailabilityAssignedTo"],
): ParsedSkylarkObject[] => {
  if (!serverAssignedTo) {
    return [];
  }

  const parsedServerAssignedTo: ParsedSkylarkObject[] = serverAssignedTo.map(
    ({ object }) => object,
  );

  if (!modifiedAvailabilityAssignedTo) {
    return parsedServerAssignedTo;
  }

  const filteredServerObjects = parsedServerAssignedTo.filter(
    ({ uid }) => !modifiedAvailabilityAssignedTo.removed.includes(uid),
  );

  return [...filteredServerObjects, ...modifiedAvailabilityAssignedTo.added];
};

export const PanelAvailabilityAssignedTo = ({
  uid,
  isPage,
  inEditMode,
  droppedObjects,
  showDropZone,
  modifiedAvailabilityAssignedTo,
  setPanelObject,
  setModifiedAvailabilityAssignedTo,
}: PanelAvailabilityAssignedToProps) => {
  const { data, isLoading, isFetchingNextPage, hasNextPage, fetchNextPage } =
    useGetAvailabilityAssignedTo(uid);

  const objects = mergeServerAndModifiedAssignedTo(
    data,
    modifiedAvailabilityAssignedTo,
  );

  useEffect(() => {
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
              (uid) => !updatedAssignedToUids.includes(uid),
            ) || [],
        },
        errors,
      );
    }
  }, [
    droppedObjects,
    modifiedAvailabilityAssignedTo,
    setModifiedAvailabilityAssignedTo,
  ]);

  if (showDropZone) {
    return <PanelDropZone />;
  }

  const addedUids = modifiedAvailabilityAssignedTo?.added.map(({ uid }) => uid);

  const handleDeletedAssignedTo = (object: ParsedSkylarkObject) => {
    const isNewlyAdded = addedUids?.includes(object.uid);

    const added =
      modifiedAvailabilityAssignedTo?.added.filter(
        ({ uid }) => uid !== object.uid,
      ) || [];

    const removed = [
      ...new Set([
        ...(modifiedAvailabilityAssignedTo?.removed || []),
        object.uid,
      ]),
    ];

    setModifiedAvailabilityAssignedTo({
      added,
      removed,
    });
  };

  return (
    <PanelSectionLayout sections={[]} isPage={isPage}>
      <div data-testid="panel-availability-assigned-to" className="pb-32">
        <PanelSectionTitle text={"Assigned to"} />
        {objects?.map((object) => {
          return (
            <ObjectIdentifierCard
              key={`assigned-to-card-${object.uid}`}
              object={object}
              disableDeleteClick={!inEditMode}
              disableForwardClick={inEditMode}
              hideAvailabilityStatus
              onForwardClick={setPanelObject}
              onDeleteClick={() => handleDeletedAssignedTo(object)}
            >
              {addedUids?.includes(object.uid) && (
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
      {/* {modifiedAvailabilityAssignedTo?.added.map((obj) => (
        <ObjectIdentifierCard
          key={`assigned-to-card-${obj.uid}`}
          object={obj}
          disableDeleteClick={!inEditMode}
          disableForwardClick={inEditMode}
          onDeleteClick={() =>
            setModifiedAvailabilityAssignedTo({
              added: modifiedAvailabilityAssignedTo.added.filter(
                ({ uid }) => uid !== obj.uid,
              ),
            })
          }
        />
      ))} */}
      <PanelLoading
        isLoading={isLoading || isFetchingNextPage || hasNextPage}
        loadMore={fetchNextPage}
      />
    </PanelSectionLayout>
  );
};
