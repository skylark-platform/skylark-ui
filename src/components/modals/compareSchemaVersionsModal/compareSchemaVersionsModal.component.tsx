import React, { useRef } from "react";

import { CompareSchemaVersions } from "src/components/contentModel/compareSchemasVersions/compareSchemaVersions.component";
import { Modal } from "src/components/modals/base/modal";

interface CompareSchemaVersionsModalProps {
  isOpen: boolean;
  baseVersionNumber: number;
  updateVersionNumber: number;
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
      <CompareSchemaVersions
        baseVersionNumber={
          baseVersionNumber === updateVersionNumber ? 1 : baseVersionNumber
        }
        updateVersionNumber={updateVersionNumber}
      />
    </Modal>
  );
};
