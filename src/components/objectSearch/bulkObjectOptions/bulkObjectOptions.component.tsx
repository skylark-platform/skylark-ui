import { useMemo, useState } from "react";
import { FiTrash2, FiMoreVertical, FiShieldOff } from "react-icons/fi";
import { toast } from "react-toastify";

import { Button } from "src/components/button";
import {
  DropdownMenu,
  DropdownMenuButton,
  DropdownMenuOption,
} from "src/components/dropdown/dropdown.component";
import { BatchDeleteObjectsModal } from "src/components/modals";
import { Toast } from "src/components/toast/toast.component";
import { SEGMENT_KEYS } from "src/constants/segment";
import { CheckedObjectState } from "src/hooks/state";
import { usePurgeObjectsCache } from "src/hooks/usePurgeCache";
import { useUserAccount } from "src/hooks/useUserAccount";
import { segment } from "src/lib/analytics/segment";
import { skylarkObjectsAreSame } from "src/lib/utils";

interface BulkObjectOptionsProps {
  checkedObjectsState: CheckedObjectState[];
  onObjectCheckedChanged?: (s: CheckedObjectState[]) => void;
}

export const BulkObjectOptions = ({
  checkedObjectsState,
  onObjectCheckedChanged,
}: BulkObjectOptionsProps) => {
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);

  const selectedObjects = useMemo(
    () =>
      checkedObjectsState
        .filter(({ checkedState }) => checkedState === true)
        .map(({ object }) => object),
    [checkedObjectsState],
  );

  const { purgeCacheForObjects } = usePurgeObjectsCache({
    onSuccess: () => {
      toast.success(
        <Toast
          title={"Cache purged"}
          message={`Cache purged for ${selectedObjects.length} objects`}
        />,
      );
      segment.track(SEGMENT_KEYS.bulkOperations.purgeCache, {
        objects: selectedObjects,
      });
    },
    onError: () => {
      toast.error(
        <Toast
          title={`Error purging cache`}
          message={["Please try again later."]}
        />,
      );
    },
  });

  const { permissions } = useUserAccount();

  const dropdownOptions = useMemo(() => {
    const options: DropdownMenuOption[] = [
      {
        id: "delete-selected-objects",
        text: "Delete Selected Objects",
        Icon: <FiTrash2 className="stroke-error text-xl" />,
        danger: true,
        onClick: () => setDeleteModalOpen(true),
      },
    ];

    if (permissions?.includes("SELF_CONFIG")) {
      options.splice(0, 0, {
        id: "purge-cache-objects",
        text: `Purge Selected Cache`,
        Icon: <FiShieldOff className="text-lg" />,
        onClick: () => purgeCacheForObjects(selectedObjects),
      });
    }

    return options;
  }, [permissions, purgeCacheForObjects, selectedObjects]);

  return (
    <div className="max-sm:hidden">
      <DropdownMenu options={dropdownOptions} placement="bottom-end">
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
        onDeletionComplete={(deletedObjects) => {
          onObjectCheckedChanged?.(
            checkedObjectsState.filter(
              ({ object }) =>
                !(
                  deletedObjects.findIndex((deletedObject) =>
                    skylarkObjectsAreSame(object, deletedObject),
                  ) > -1
                ),
            ),
          );
          setDeleteModalOpen(false);
        }}
      />
    </div>
  );
};
