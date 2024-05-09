import clsx from "clsx";
import { Fragment, useCallback, useRef, useState } from "react";
import { toast } from "react-toastify";
import { useDebouncedCallback } from "use-debounce";

import { Button } from "src/components/button";
import { TextInput } from "src/components/inputs/input";
import { Modal } from "src/components/modals/base/modal";
import { ObjectIdentifierCard } from "src/components/objectIdentifierCard";
import { Toast } from "src/components/toast/toast.component";
import { useBulkDeleteObjects } from "src/hooks/objects/delete/useBulkDeleteObjects";
import { ParsedSkylarkObject } from "src/interfaces/skylark";
import { hasProperty } from "src/lib/utils";

const VERIFICATION_TEXT = "permanently delete";

interface DeleteConfirmationModalProps {
  title: string;
  description: string;
  isOpen: boolean;
  isDeleting: boolean;
  closeModal: () => void;
  onDeleteConfirmed: () => void;
}

const DeleteButtonWithConfirmation = ({
  confirmationMessage,
  isDeleting,
  onConfirmed,
  onCancel,
}: {
  confirmationMessage: string;
  onConfirmed: () => void;
  onCancel: () => void;
  isDeleting: boolean;
}) => {
  const [showDeleteVerification, setShowDeleteVerficiation] = useState(false);
  const [input, setInput] = useState("");

  return (
    <div className="mt-6">
      {showDeleteVerification && (
        <div>
          <p className="mb-2">
            {`To confirm deletion, enter "${VERIFICATION_TEXT}" in the text input
            field.`}
          </p>
          <TextInput
            value={input}
            onChange={setInput}
            placeholder={VERIFICATION_TEXT}
          />
        </div>
      )}
      <div className="mt-4 flex justify-end space-x-2">
        {showDeleteVerification ? (
          <>
            <Button
              variant="primary"
              type="button"
              danger
              loading={isDeleting}
              disabled={input !== VERIFICATION_TEXT}
              onClick={() => {
                onConfirmed();
              }}
            >
              {confirmationMessage}
            </Button>
            <Button
              variant="outline"
              type="button"
              onClick={() => setShowDeleteVerficiation(false)}
            >
              Go back
            </Button>
          </>
        ) : (
          <>
            <Button
              variant="primary"
              type="button"
              danger
              loading={false}
              onClick={() => {
                setInput("");
                setShowDeleteVerficiation(true);
              }}
            >
              {`Delete`}
            </Button>
            <Button variant="outline" type="button" onClick={onCancel}>
              Cancel
            </Button>
          </>
        )}
      </div>
    </div>
  );
};

const DeleteConfirmationModalContent = ({
  onDeleteConfirmed,
  closeModal,
  isDeleting,
}: {
  onDeleteConfirmed: () => void;
  closeModal: () => void;
  isDeleting: boolean;
}) => {
  return (
    <>
      <div className={clsx("mt-4 overflow-auto")}>
        <DeleteButtonWithConfirmation
          confirmationMessage={`Permanently delete`}
          onCancel={closeModal}
          isDeleting={isDeleting}
          onConfirmed={onDeleteConfirmed}
        />
      </div>
    </>
  );
};

export const DeleteConfirmationModal = ({
  isOpen,
  isDeleting,
  title,
  description,
  closeModal,
  onDeleteConfirmed,
}: DeleteConfirmationModalProps) => {
  return (
    <Modal
      title={title}
      description={description}
      isOpen={isOpen}
      closeModal={closeModal}
      data-testid="delete-confirmation-modal"
      size="medium"
    >
      <DeleteConfirmationModalContent
        onDeleteConfirmed={onDeleteConfirmed}
        closeModal={closeModal}
        isDeleting={isDeleting}
      />
    </Modal>
  );
};
