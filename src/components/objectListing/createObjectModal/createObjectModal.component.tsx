import { Dialog } from "@headlessui/react";
import React, { Fragment } from "react";
import { useForm, Controller } from "react-hook-form";
import { GrClose } from "react-icons/gr";

import { Button } from "src/components/button";
import { SkylarkObjectFieldInput } from "src/components/inputs";
import { PanelSectionTitle } from "src/components/panel/panelTypography";
import { LanguageSelect, Select } from "src/components/select";
import { useCreateObject } from "src/hooks/useCreateObject";
import {
  useSkylarkObjectOperations,
  useSkylarkObjectTypes,
} from "src/hooks/useSkylarkObjectTypes";
import {
  SkylarkObjectIdentifier,
  SkylarkObjectMetadataField,
  SkylarkObjectType,
} from "src/interfaces/skylark";

interface CreateObjectModalProps {
  isOpen: boolean;
  setIsOpen: (b: boolean) => void;
  onObjectCreated: (o: SkylarkObjectIdentifier) => void;
}

export const CreateObjectModal = ({
  isOpen,
  setIsOpen,
  onObjectCreated,
}: CreateObjectModalProps) => {
  const { objectTypes } = useSkylarkObjectTypes();
  const { handleSubmit, watch, control, register, getValues, formState } =
    useForm<Record<string, SkylarkObjectMetadataField>>();

  const closeModal = () => {
    setIsOpen(false);
  };

  const objectType = watch("_objectType");

  const { objectOperations } = useSkylarkObjectOperations(objectType);

  const { createObject, isLoading: isCreatingObject } = useCreateObject({
    objectType,
    onSuccess: (object) => {
      onObjectCreated?.(object);
    },
  });

  const onSubmit = ({ language }: any) => createObject(language);

  return (
    <Dialog
      open={isOpen}
      onClose={closeModal}
      className="font-body relative z-50"
    >
      <div
        className="fixed inset-0 bg-black/40"
        aria-hidden="true"
        data-testid="dialog-background"
      />

      <div className="fixed inset-0 flex items-center justify-center p-2 text-sm">
        <Dialog.Panel className="relative mx-auto h-full max-h-[90%] w-full overflow-y-auto rounded bg-white p-6 md:w-4/5 md:p-10">
          <button
            aria-label="close"
            className="absolute top-4 right-4 sm:top-9 sm:right-8"
            onClick={closeModal}
            tabIndex={-1}
          >
            <GrClose className="text-xl" />
          </button>

          <Dialog.Title className="mb-2 font-heading text-2xl md:mb-4 md:text-3xl">
            Create Object
          </Dialog.Title>
          <Dialog.Description>
            Select Object Type to get started.
          </Dialog.Description>
          <form
            className="mt-8 flex w-full flex-col justify-end gap-4"
            onSubmit={handleSubmit(onSubmit)}
          >
            <Controller
              name="_objectType"
              control={control}
              render={({ field }) => (
                <Select
                  className="w-full"
                  variant="primary"
                  disabled={!objectTypes}
                  label="Object Type"
                  selected={(field.value as string) || ""}
                  placeholder="Select Object Type to get started"
                  options={
                    objectTypes?.map((opt) => ({
                      value: opt,
                      label: opt,
                    })) || []
                  }
                  onChange={field.onChange}
                />
              )}
            />
            {objectOperations && (
              <div>
                <Controller
                  name="_language"
                  control={control}
                  render={({ field }) => (
                    <LanguageSelect
                      className="w-full"
                      variant="primary"
                      rounded={false}
                      disabled={!objectTypes}
                      selected={(field.value as string) || ""}
                      onChange={field.onChange}
                    />
                  )}
                />
                {objectOperations?.operations.create.inputs.map((config) => (
                  <SkylarkObjectFieldInput
                    key={config.name}
                    field={config.name}
                    config={config}
                    control={control}
                    register={register}
                    value={getValues(config.name)}
                    formState={formState}
                  />
                ))}
                <Button
                  variant="primary"
                  className="mt-2"
                  loading={isCreatingObject}
                  type="submit"
                  disabled={!objectOperations}
                  block
                >
                  Create object
                </Button>
              </div>
            )}
          </form>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
};
