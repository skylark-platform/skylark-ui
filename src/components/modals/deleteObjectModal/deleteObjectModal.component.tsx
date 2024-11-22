import React from "react";
import { toast } from "react-toastify";

import { Button } from "src/components/button";
import { Modal } from "src/components/modals/base/modal";
import {
  GraphQLRequestErrorToast,
  Toast,
} from "src/components/toast/toast.component";
import { useDeleteObject } from "src/hooks/objects/delete/useDeleteObject";
import { SkylarkObject } from "src/interfaces/skylark";

interface DeleteObjectModalProps {
  isOpen: boolean;
  object: SkylarkObject;
  setIsOpen: (b: boolean) => void;
  onDeleteSuccess: () => void;
}

export const DeleteObjectModal = ({
  isOpen,
  object,
  setIsOpen,
  onDeleteSuccess,
}: DeleteObjectModalProps) => {
  const closeModal = () => {
    setIsOpen(false);
  };

  const { uid, objectType, language, availableLanguages } = object;

  const isDeleteTranslation =
    (language && availableLanguages.length > 1) || false;

  const { deleteObject, isDeleting } = useDeleteObject({
    objectType,
    isDeleteTranslation,
    onSuccess: () => {
      closeModal();
      toast.success(
        <Toast
          title={
            isDeleteTranslation
              ? `Translation "${language}" deleted`
              : `${object.display.objectType} deleted`
          }
          message={
            isDeleteTranslation
              ? `The "${language}" translation for the ${object.display.objectType} "${object.display.name}" has been deleted`
              : `${object.display.objectType} "${object.display.name}" has been deleted`
          }
        />,
      );
      onDeleteSuccess();
    },
    onError: (error) => {
      toast.error(
        <GraphQLRequestErrorToast
          title={`Error deleting object`}
          error={error}
        />,
        { autoClose: 10000 },
      );
    },
  });

  return (
    <Modal
      title={
        isDeleteTranslation
          ? `Delete "${language}" translation`
          : `Delete ${object.display.objectType}`
      }
      size="small"
      data-testid="delete-object-modal"
      description={`Are you sure you want to delete the ${
        isDeleteTranslation ? `"${language}" translation for the ` : ""
      }${object.display.objectType} "${object.display.name}"?`}
      isOpen={isOpen}
      closeModal={closeModal}
    >
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
    </Modal>
  );
};
