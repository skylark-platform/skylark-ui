import { Dialog } from "@headlessui/react";
import React from "react";
import { GrClose } from "react-icons/gr";
import { toast } from "react-toastify";

import { Button } from "src/components/button";
import { Toast } from "src/components/toast/toast.component";
import { useDeleteObject } from "src/hooks/objects/useDeleteObject";

interface DeleteObjectModalProps {
  isOpen: boolean;
  uid: string;
  objectType: string;
  language?: string;
  objectDisplayName: string;
  objectTypeDisplayName: string;
  availableLanguages: string[];
  setIsOpen: (b: boolean) => void;
  onDeleteSuccess: () => void;
}

export const DeleteObjectModal = ({
  isOpen,
  uid,
  objectType,
  language,
  objectDisplayName,
  objectTypeDisplayName,
  availableLanguages,
  setIsOpen,
  onDeleteSuccess,
}: DeleteObjectModalProps) => {
  const closeModal = () => {
    setIsOpen(false);
  };

  const isDeleteTranslation =
    (language && availableLanguages.length > 1) || false;

  const { mutate: deleteObject, isLoading: isDeleting } = useDeleteObject({
    objectType,
    isDeleteTranslation,
    onSuccess: () => {
      closeModal();
      toast.success(
        <Toast
          title={
            isDeleteTranslation
              ? `Translation "${language}" deleted`
              : `${objectTypeDisplayName} deleted`
          }
          message={
            isDeleteTranslation
              ? `The "${language}" translation for the ${objectTypeDisplayName} "${objectDisplayName}" has been deleted`
              : `${objectTypeDisplayName} "${objectDisplayName}" has been deleted`
          }
        />,
      );
      onDeleteSuccess();
    },
  });

  return (
    <Dialog
      open={isOpen}
      onClose={closeModal}
      className="font-body relative z-50"
      data-testid="delete-object-modal"
    >
      <div
        className="fixed inset-0 bg-black/40"
        aria-hidden="true"
        data-testid="dialog-background"
      />

      <div className="fixed inset-0 flex items-center justify-center p-2 text-sm">
        <Dialog.Panel className="relative mx-auto w-full max-w-xl overflow-y-auto rounded bg-white p-6 md:w-1/2 md:p-10 lg:w-2/5">
          <button
            aria-label="close"
            className="absolute top-4 right-4 sm:top-9 sm:right-8"
            onClick={closeModal}
            tabIndex={-1}
          >
            <GrClose className="text-xl" />
          </button>

          <Dialog.Title className="mb-2 font-heading text-2xl md:mb-4 md:text-3xl">
            {isDeleteTranslation
              ? `Delete "${language}" translation`
              : `Delete ${objectTypeDisplayName}`}
          </Dialog.Title>
          <Dialog.Description>
            {`Are you sure you want to delete the ${
              isDeleteTranslation ? `"${language}" translation for the ` : ""
            }${objectTypeDisplayName} "${objectDisplayName}"?`}
          </Dialog.Description>
          <p className="my-2">This cannot be undone.</p>
          <div className="mt-6 flex justify-end space-x-2">
            <Button
              variant="primary"
              type="button"
              danger
              loading={isDeleting}
              onClick={() => {
                deleteObject({ uid, language });
              }}
            >
              {`Delete ${isDeleteTranslation ? "translation" : "object"}`}
            </Button>
            <Button variant="outline" type="button" onClick={closeModal}>
              Cancel
            </Button>
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
};
