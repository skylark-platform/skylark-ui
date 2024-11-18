import React, { useState } from "react";
import { toast } from "react-toastify";

import { Button } from "src/components/button";
import { DynamicContentConfigurationEditor } from "src/components/dynamicContentConfigurationEditor/dynamicContentConfigurationEditor.component";
import { Modal } from "src/components/modals/base/modal";
import { Skeleton } from "src/components/skeleton";
import { Toast } from "src/components/toast/toast.component";
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
        toast.success(
          <Toast
            title={`Dynamic content updated`}
            message={[
              "The content list will be built and sorted in the background.",
            ]}
          />,
        );
        closeModal();
      },
      onError: (e) => {
        toast.error(
          <Toast
            title={`Dynamic content update failed`}
            message={["Contact support."]}
          />,
        );
      },
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
      {data ? (
        <>
          <DynamicContentConfigurationEditor
            initialConfiguration={data}
            onConfigurationChange={setUpdatedDynamicContentConfiguration}
          />

          <div className="flex justify-end items-center space-x-2 px-6 md:px-10 mt-4">
            {/* <p className="text-manatee-700 mr-2">{saveMessage}</p> */}
            <Button
              variant="primary"
              onClick={onSave}
              type="button"
              loading={isUpdating}
              success
              disabled={!data}
            >
              Save
            </Button>
            <Button variant="outline" type="button" danger onClick={closeModal}>
              Cancel
            </Button>
          </div>
        </>
      ) : (
        <div className="w-full flex">
          <div className="w-full md:w-3/5 2xl:w-2/3 mr-8">
            <Skeleton className="h-11 w-56 mb-8" />
            {Array.from({ length: 2 }, (_, i) => (
              <div
                key={`dynamic-configuration-modal-skeleton-${i}`}
                className="mb-4"
              >
                <Skeleton className="mb-2 h-11 w-full" />
                <Skeleton className="mb-2 h-40 w-full" />
              </div>
            ))}
          </div>
          <div className="flex-grow">
            <Skeleton className="h-11 w-56 mb-8" />
            <Skeleton className="h-96 w-full mb-8" />
          </div>
        </div>
      )}
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
