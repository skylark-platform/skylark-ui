import { useCallback, useState } from "react";
import { FiTrash2, FiMoreVertical } from "react-icons/fi";

import { Button } from "src/components/button";
import {
  DropdownMenu,
  DropdownMenuButton,
} from "src/components/dropdown/dropdown.component";
import { BatchDeleteObjectsModal } from "src/components/modals";
import { CheckedObjectState } from "src/hooks/state";

interface BulkObjectOptionsProps {
  checkedObjectsState: CheckedObjectState[];
  onObjectCheckedChanged?: (s: CheckedObjectState[]) => void;
}

export const BulkObjectOptions = ({
  checkedObjectsState,
  onObjectCheckedChanged,
}: BulkObjectOptionsProps) => {
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);

  const removeObject = useCallback(
    (uid: string) => {
      const updatedObjects = checkedObjectsState.map(
        ({ object, checkedState }) =>
          object.uid === uid
            ? { object, checkedState: false }
            : { object, checkedState },
      );
      onObjectCheckedChanged?.(updatedObjects);
    },
    [onObjectCheckedChanged, checkedObjectsState],
  );

  return (
    <div className="max-sm:hidden">
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
          disabled={checkedObjectsState.length === 0}
          className="whitespace-nowrap"
          Icon={<FiMoreVertical className="-mr-1 text-2xl" />}
        >
          Bulk Options
        </DropdownMenuButton>
      </DropdownMenu>
      <BatchDeleteObjectsModal
        objectsToBeDeleted={checkedObjectsState
          .filter(({ checkedState }) => checkedState === true)
          .map(({ object }) => object)}
        isOpen={deleteModalOpen}
        closeModal={() => setDeleteModalOpen(false)}
        removeObject={removeObject}
        onDeletionComplete={(deletedObjects) => {
          onObjectCheckedChanged?.(
            checkedObjectsState.filter(
              ({ object }) => !deletedObjects.includes(object),
            ),
          );
          setDeleteModalOpen(false);
        }}
      />
    </div>
  );
};
