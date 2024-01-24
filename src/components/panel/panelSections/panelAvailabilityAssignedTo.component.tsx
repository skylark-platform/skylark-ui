import { useEffect, useState } from "react";

import { AvailabilityInheritanceIcon } from "src/components/availability";
import { ObjectTypeSelect } from "src/components/inputs/select";
import { DisplayGraphQLQuery } from "src/components/modals";
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
    removed: ParsedSkylarkObject[];
  } | null;
  setPanelObject: (o: SkylarkObjectIdentifier) => void;
  setModifiedAvailabilityAssignedTo: (
    args: {
      added: ParsedSkylarkObject[];
      removed: ParsedSkylarkObject[];
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

  const removedUids = modifiedAvailabilityAssignedTo.removed.map(
    ({ uid }) => uid,
  );
  const filteredServerObjects = parsedServerAssignedTo.filter(
    ({ uid }) => !removedUids.includes(uid),
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
  const [{ objectType }, setObjectType] = useState({ objectType: "" });

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

  console.log({ data });

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
              ({ uid }) => !updatedAssignedToUids.includes(uid),
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

  return (
    <PanelSectionLayout sections={[]} isPage={isPage} withStickyHeaders>
      <div
        data-testid="panel-availability-assigned-to"
        className="pb-32 w-full"
      >
        <div className="w-full sticky bg-white pt-4 pb-2 top-0">
          <PanelSectionTitle text={"Assigned to"} />
          <ObjectTypeSelect
            onChange={setObjectType}
            variant="primary"
            selected={objectType}
            placeholder="Filter for Object Type"
            onValueClear={() => setObjectType({ objectType: "" })}
          />
          <DisplayGraphQLQuery
            label="Get Availability Assigned To"
            query={query}
            variables={variables}
            buttonClassName="absolute -right-4 md:-right-6 top-0"
          />
        </div>
        {objects
          ?.filter((o) => !objectType || o.objectType === objectType)
          .map((object) => {
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
                {uidsLinkedViaInheritance?.includes(object.uid) && (
                  <>
                    {!activeUids?.includes(object.uid) && (
                      <p className="text-sm text-manatee-500">Disabled</p>
                    )}
                    <AvailabilityInheritanceIcon
                      status={null}
                      className="text-lg"
                      tooltip="This Availability has been linked to this object via inheritance."
                    />
                  </>
                )}
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
      <PanelLoading
        isLoading={isLoading || isFetchingNextPage || hasNextPage}
        loadMore={fetchNextPage}
      />
    </PanelSectionLayout>
  );
};
