import { Dialog } from "@headlessui/react";
import React from "react";
import { toast } from "react-toastify";

import { Button } from "src/components/button";
import { FiX } from "src/components/icons";
import { Modal } from "src/components/modals/base/modal";
import {
  GraphQLRequestErrorToast,
  Toast,
} from "src/components/toast/toast.component";
import { useDeleteObject } from "src/hooks/objects/delete/useDeleteObject";

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
          : `Delete ${objectTypeDisplayName}`
      }
      size="small"
      data-testid="delete-object-modal"
      description={`Are you sure you want to delete the ${
        isDeleteTranslation ? `"${language}" translation for the ` : ""
      }${objectTypeDisplayName} "${objectDisplayName}"?`}
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
