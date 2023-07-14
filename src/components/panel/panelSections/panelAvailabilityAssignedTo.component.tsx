import { useEffect } from "react";

import { ObjectIdentifierCard } from "src/components/objectIdentifierCard";
import {
  HandleDropError,
  handleDroppedObjectsToAssignToAvailability,
  handleDroppedRelationships,
} from "src/components/panel/panel.lib";
import { PanelDropZone } from "src/components/panel/panelDropZone/panelDropZone.component";
import { PanelSectionTitle } from "src/components/panel/panelTypography";
import {
  ParsedSkylarkObject,
  SkylarkObjectIdentifier,
} from "src/interfaces/skylark";
import { formatObjectField } from "src/lib/utils";

import { PanelSectionLayout } from "./panelSectionLayout.component";

interface PanelAvailabilityAssignedToProps {
  isPage?: boolean;
  inEditMode: boolean;
  showDropZone?: boolean;
  droppedObjects?: ParsedSkylarkObject[];
  modifiedAvailabilityAssignedTo: { added: ParsedSkylarkObject[] } | null;
  setModifiedAvailabilityAssignedTo: (
    args: {
      added: ParsedSkylarkObject[];
    },
    errors?: HandleDropError[],
  ) => void;
}

export const PanelAvailabilityAssignedTo = ({
  isPage,
  inEditMode,
  droppedObjects,
  showDropZone,
  modifiedAvailabilityAssignedTo,
  setModifiedAvailabilityAssignedTo,
}: PanelAvailabilityAssignedToProps) => {
  useEffect(() => {
    if (droppedObjects && droppedObjects.length > 0) {
      const existingUids = modifiedAvailabilityAssignedTo?.added.map(
        ({ uid }) => uid,
      );
      const uniqueDroppedObjects = existingUids
        ? droppedObjects.filter(({ uid }) => !existingUids.includes(uid))
        : droppedObjects;

      const { updatedAssignedToObjects, errors } =
        handleDroppedObjectsToAssignToAvailability({
          newObjects: uniqueDroppedObjects,
        });

      setModifiedAvailabilityAssignedTo(
        {
          added: modifiedAvailabilityAssignedTo
            ? [
                ...modifiedAvailabilityAssignedTo.added,
                ...updatedAssignedToObjects,
              ]
            : updatedAssignedToObjects,
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

  return (
    <PanelSectionLayout sections={[]} isPage={isPage}>
      <div data-testid="panel-availability-assigned-to">
        <PanelSectionTitle
          text={formatObjectField("Assign to multiple objects dropzone")}
        />
        <p className="my-2">
          This tab is in an <strong>EXPERIMENTAL</strong> stage.
        </p>
        <p className="my-2">
          <strong>Use with caution.</strong>
        </p>
        {(!modifiedAvailabilityAssignedTo?.added ||
          modifiedAvailabilityAssignedTo.added.length === 0) && (
          <p>
            Drop objects from the Content Library here to assign them to this
            Availability.
          </p>
        )}
      </div>
      {inEditMode &&
        modifiedAvailabilityAssignedTo?.added.map((obj) => (
          <ObjectIdentifierCard
            key={obj.uid}
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
          >
            <span
              className={
                "flex h-4 w-4 items-center justify-center rounded-full bg-success px-1 pb-0.5 text-center text-white transition-colors"
              }
            />
          </ObjectIdentifierCard>
        ))}
    </PanelSectionLayout>
  );
};
