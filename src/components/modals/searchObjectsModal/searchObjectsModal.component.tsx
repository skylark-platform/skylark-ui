import { Dialog } from "@headlessui/react";
import React from "react";
import { GrClose } from "react-icons/gr";

import { Button } from "src/components/button";
import { ObjectSearch } from "src/components/objectSearch";
import { SkylarkObjectTypes } from "src/interfaces/skylark";

interface SearchObjectsModalProps {
  objectTypes: SkylarkObjectTypes;
  isOpen: boolean;
  setIsOpen: (b: boolean) => void;
}

export const SearchObjectsModal = ({
  isOpen,
  objectTypes,
  setIsOpen,
}: SearchObjectsModalProps) => {
  const closeModal = () => {
    setIsOpen(false);
  };

  return (
    <Dialog
      open={isOpen}
      onClose={closeModal}
      className="font-body relative z-50"
      data-testid="create-object-modal"
    >
      <div
        className="fixed inset-0 bg-black/40"
        aria-hidden="true"
        data-testid="dialog-background"
      />

      <div className="fixed inset-0 flex items-center justify-center p-2 text-sm">
        <Dialog.Panel className="relative mx-auto flex h-full max-h-[90%] w-full max-w-6xl flex-col overflow-y-auto rounded bg-white py-6 md:w-4/5 md:py-10">
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
              title
            </Dialog.Title>
            <Dialog.Description>desc</Dialog.Description>
          </div>
          <div className="ml-4 flex-grow overflow-auto px-px pt-2">
            <ObjectSearch
              defaultObjectTypes={objectTypes}
              // hiddenFields={[
              //   "uid",
              //   "translation",
              //   ...OBJECT_SEARCH_HARDCODED_COLUMNS,
              // ]}
              resetRowsChecked={console.log}
              onRowCheckChange={console.log}
              withObjectSelect
            />
          </div>
          <div className="flex justify-end space-x-2 px-6 md:px-10">
            <Button
              variant="primary"
              className="mt-4"
              // loading={isCreatingObject || isCreatingTranslation}
              type="submit"
              // disabled={
              //   !objectOperations ||
              //   !formHasObjectPropertyValues(values) ||
              //   isExistingTranslation ||
              //   (isCreateTranslationModal && !values._language)
              // }
              success
            >
              Add 4 Episodes
            </Button>
            <Button
              variant="outline"
              className="mt-4"
              type="button"
              danger
              // disabled={isCreatingObject || isCreatingTranslation}
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
