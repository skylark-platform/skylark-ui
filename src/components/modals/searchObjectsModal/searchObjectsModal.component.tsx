import React, { useMemo } from "react";

import { Button } from "src/components/button";
import { Modal } from "src/components/modals/base/modal";
import {
  ObjectSearch,
  ObjectSearchInitialColumnsState,
} from "src/components/objectSearch";
import { OBJECT_SEARCH_PERMANENT_FROZEN_COLUMNS } from "src/components/objectSearch/results/columnConfiguration";
import { OBJECT_LIST_TABLE } from "src/constants/skylark";
import { useCheckedObjectsState } from "src/hooks/state";
import {
  ParsedSkylarkObject,
  SkylarkObjectTypes,
} from "src/interfaces/skylark";

interface SearchObjectsModalProps {
  title: string;
  objectTypes?: SkylarkObjectTypes;
  columns?: string[];
  isOpen: boolean;
  closeModal: () => void;
  onModalClose: (args: { checkedObjects: ParsedSkylarkObject[] }) => void;
}

export const SearchObjectsModal = ({
  title,
  isOpen,
  objectTypes,
  columns: propColumns,
  closeModal,
  onModalClose,
}: SearchObjectsModalProps) => {
  const { checkedObjects, checkedObjectTypesForDisplay, setCheckedObjects } =
    useCheckedObjectsState();

  const onModalCloseWrapper = () => {
    onModalClose({ checkedObjects });
    closeModal();
    setCheckedObjects([]);
  };

  const initialColumnState: Partial<ObjectSearchInitialColumnsState> =
    useMemo(() => {
      const columns = propColumns || [];

      return {
        columns: [...OBJECT_SEARCH_PERMANENT_FROZEN_COLUMNS, ...columns],
        frozen: columns.includes(OBJECT_LIST_TABLE.columnIds.displayField)
          ? [
              ...OBJECT_SEARCH_PERMANENT_FROZEN_COLUMNS,
              OBJECT_LIST_TABLE.columnIds.displayField,
            ]
          : OBJECT_SEARCH_PERMANENT_FROZEN_COLUMNS,
      };
    }, [propColumns]);

  return (
    <Modal
      title={title}
      isOpen={isOpen}
      closeModal={closeModal}
      data-testid="search-objects-modal"
      withoutBodyPadding
      size="large"
      growHeight
    >
      <div className="ml-2 flex-grow overflow-auto pr-0 pt-2 md:ml-4 md:pl-4">
        <ObjectSearch
          initialFilters={{ objectTypes }}
          initialColumnState={initialColumnState}
          checkedObjects={checkedObjects}
          onObjectCheckedChanged={setCheckedObjects}
          hideSearchFilters
          withObjectSelect
        />
      </div>
      <div className="flex justify-end space-x-2 px-6 md:px-10">
        <Button
          variant="primary"
          className="mt-4"
          onClick={onModalCloseWrapper}
          type="button"
          disabled={checkedObjects.length === 0}
          success
          data-testid="search-objects-modal-save"
        >
          {`Add ${checkedObjects.length} ${
            checkedObjectTypesForDisplay.length === 1
              ? `${checkedObjectTypesForDisplay[0]}`
              : "Objects"
          }`}
        </Button>
        <Button
          variant="outline"
          className="mt-4"
          type="button"
          danger
          onClick={closeModal}
        >
          Cancel
        </Button>
      </div>
    </Modal>
  );
};
