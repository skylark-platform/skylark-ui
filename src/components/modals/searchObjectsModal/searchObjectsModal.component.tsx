import { Dialog } from "@headlessui/react";
import React from "react";
import { GrClose } from "react-icons/gr";

import { Button } from "src/components/button";
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
  columns,
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

  const initialColumnState: Partial<ObjectSearchInitialColumnsState> = {
    columns: [
      ...OBJECT_SEARCH_PERMANENT_FROZEN_COLUMNS,
      OBJECT_LIST_TABLE.columnIds.displayField,
      ...(columns || []),
    ],
    frozen: [
      ...OBJECT_SEARCH_PERMANENT_FROZEN_COLUMNS,
      OBJECT_LIST_TABLE.columnIds.displayField,
    ],
  };

  return (
    <Dialog
      open={isOpen}
      onClose={closeModal}
      className="font-body relative z-50"
      data-testid="search-objects-modal"
    >
      <div
        className="fixed inset-0 bg-black/40"
        aria-hidden="true"
        data-testid="dialog-background"
      />

      <div className="fixed inset-0 flex items-center justify-center p-2 text-sm">
        <Dialog.Panel className="max-w-8xl relative mx-auto flex h-full max-h-[90%] w-full flex-col overflow-y-auto rounded bg-white pb-4 pt-6 md:pb-8 md:pt-10 lg:w-11/12 xl:w-4/5">
          <button
            aria-label="close"
            className="absolute right-4 top-4 sm:right-8 sm:top-9"
            onClick={closeModal}
            tabIndex={-1}
          >
            <GrClose className="text-xl" />
          </button>

          <div className="px-6 md:px-10">
            <Dialog.Title className="mb-2 font-heading text-2xl md:mb-4 md:text-3xl">
              {title}
            </Dialog.Title>
          </div>
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
        </Dialog.Panel>
      </div>
    </Dialog>
  );
};
