import { useCallback, useState } from "react";
import { FiTrash2, FiMoreVertical } from "react-icons/fi";

import { Button } from "src/components/button";
import {
  DropdownMenu,
  DropdownMenuButton,
} from "src/components/dropdown/dropdown.component";
import { BatchDeleteObjectsModal } from "src/components/modals";
import { ParsedSkylarkObject } from "src/interfaces/skylark";

interface BulkObjectOptionsProps {
  selectedObjects: ParsedSkylarkObject[];
  onSelectedObjectChange?: (o: ParsedSkylarkObject[]) => void;
}

export const BulkObjectOptions = ({
  selectedObjects,
  onSelectedObjectChange,
}: BulkObjectOptionsProps) => {
  console.log({ selectedObjects });

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);

  const removeObject = useCallback(
    (uid: string) => {
      const updatedObjects = selectedObjects.filter((obj) => uid !== obj.uid);
      onSelectedObjectChange?.(updatedObjects);
    },
    [onSelectedObjectChange, selectedObjects],
  );

  return (
    <div>
      <DropdownMenu
        options={[
          {
            id: "delete-selected-objects",
            text: "Delete Selected Objects",
            Icon: <FiTrash2 className="stroke-error text-xl" />,
            danger: true,
            onClick: () => setDeleteModalOpen(true),
          },
        ]}
        placement="bottom-end"
      >
        <DropdownMenuButton
          as={Button}
          variant="neutral"
          disabled={selectedObjects.length === 0}
          className="whitespace-nowrap"
          Icon={<FiMoreVertical className="-mr-1 text-2xl" />}
        >
          Bulk Options
        </DropdownMenuButton>
      </DropdownMenu>
      <BatchDeleteObjectsModal
        objectsToBeDeleted={selectedObjects}
        isOpen={deleteModalOpen}
        closeModal={() => setDeleteModalOpen(false)}
        removeObject={removeObject}
        onDeletionComplete={(deletedObjects) => {
          onSelectedObjectChange?.(
            selectedObjects.filter((obj) => !deletedObjects.includes(obj)),
          );
          setDeleteModalOpen(false);
        }}
      />
    </div>
  );
};
