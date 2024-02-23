import React, { useRef } from "react";

import { CompareSchemaVersions } from "src/components/contentModel/compareSchemasVersions/compareSchemaVersions.component";
import { Modal } from "src/components/modals/base/modal";

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
  const objectTypeSelectRef = useRef(null);

  return (
    <Modal
      initialFocus={objectTypeSelectRef}
      title={null}
      isOpen={isOpen}
      closeModal={() => setIsOpen(false)}
      data-testid="create-object-modal"
      size="medium"
      growHeight
    >
      <p>test</p>
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
