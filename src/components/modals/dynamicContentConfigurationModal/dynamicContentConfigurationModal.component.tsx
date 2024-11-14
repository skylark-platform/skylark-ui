import React, { useState } from "react";

import { Button } from "src/components/button";
import { DynamicContentConfigurationEditor } from "src/components/dynamicContentConfigurationEditor/dynamicContentConfigurationEditor.component";
import { Modal } from "src/components/modals/base/modal";
import { useGetObjectDynamicContentConfiguration } from "src/hooks/objects/get/useGetObjectDynamicContentConfiguration";
import { useUpdateObjectDynamicContentConfiguration } from "src/hooks/objects/update/useUpdateObjectDynamicContentConfiguration";
import { DynamicSetConfig, SkylarkObjectType } from "src/interfaces/skylark";

interface DynamicContentConfigurationModalProps {
  isOpen: boolean;
  uid: string;
  objectType: SkylarkObjectType;
  closeModal: () => void;
}

const DynamicContentConfigurationModalBody = ({
  uid,
  objectType,
  closeModal,
}: Omit<DynamicContentConfigurationModalProps, "isOpen">) => {
  const [
    updatedDynamicContentConfiguration,
    setUpdatedDynamicContentConfiguration,
  ] = useState<DynamicSetConfig>();

  const { updateObjectDynamicContentConfiguration, isUpdating } =
    useUpdateObjectDynamicContentConfiguration({
      objectType,
      onSuccess: () => {
        // TODO add Toast
        // TODO clear cache
        closeModal();
      },
      onError: console.log,
    });

  const onSave = () => {
    if (updatedDynamicContentConfiguration) {
      updateObjectDynamicContentConfiguration({
        uid,
        dynamicSetConfig: updatedDynamicContentConfiguration,
      });
    }
  };

  const { data } = useGetObjectDynamicContentConfiguration(objectType, uid);

  return (
    <>
      {data && (
        <DynamicContentConfigurationEditor
          initialConfiguration={data}
          onConfigurationChange={setUpdatedDynamicContentConfiguration}
        />
      )}
      <div className="flex justify-end items-center space-x-2 px-6 md:px-10 mt-4">
        {/* <p className="text-manatee-700 mr-2">{saveMessage}</p> */}
        <Button
          variant="primary"
          onClick={onSave}
          type="button"
          // disabled={saveMessage === null}
          loading={isUpdating}
          success
        >
          Save
        </Button>
        <Button variant="outline" type="button" danger onClick={closeModal}>
          Cancel
        </Button>
      </div>
    </>
  );
};

export const DynamicContentConfigurationModal = ({
  isOpen,
  closeModal,
  ...props
}: DynamicContentConfigurationModalProps) => {
  return (
    <Modal
      title={"Configure Dynamic Content"}
      isOpen={isOpen}
      closeModal={closeModal}
      // withoutBodyPadding
      size="large"
      growHeight
    >
      {isOpen && (
        <DynamicContentConfigurationModalBody
          {...props}
          closeModal={closeModal}
        />
      )}
    </Modal>
  );
};
