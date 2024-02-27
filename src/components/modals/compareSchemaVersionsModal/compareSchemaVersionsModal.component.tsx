import React from "react";

import { CompareSchemaVersions } from "src/components/compareSchemasVersions/compareSchemaVersions.component";
import {
  Modal,
  ModalDescription,
  ModalTitle,
} from "src/components/modals/base/modal";

interface CompareSchemaVersionsModalProps {
  isOpen: boolean;
  baseVersionNumber: number | null;
  updateVersionNumber: number | null;
  setIsOpen: (b: boolean) => void;
}

export const CompareSchemaVersionsModal = ({
  isOpen,
  baseVersionNumber,
  updateVersionNumber,
  setIsOpen,
  ...props
}: CompareSchemaVersionsModalProps) => {
  return (
    <Modal
      title={null}
      isOpen={isOpen}
      closeModal={() => setIsOpen(false)}
      data-testid="schema-versions-modal"
      size="medium"
      growHeight
      withoutBodyPadding
      {...props}
    >
      <ModalTitle withoutBodyPadding>Schema Comparison</ModalTitle>
      <ModalDescription withoutBodyPadding>
        <p>
          Review differences between schema versions.
          {/* When you're happy, activate the new Schema. */}
        </p>
        {baseVersionNumber && updateVersionNumber && (
          <p className="font-medium my-1 mb-4">{`Comparing version ${updateVersionNumber} to base version ${baseVersionNumber}.`}</p>
        )}
      </ModalDescription>
      {baseVersionNumber && updateVersionNumber ? (
        <CompareSchemaVersions
          baseVersionNumber={
            baseVersionNumber === updateVersionNumber ? 1 : baseVersionNumber
          }
          updateVersionNumber={updateVersionNumber}
        />
      ) : (
        <p>Add a base and update version number</p>
      )}
    </Modal>
  );
};
