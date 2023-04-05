import { Dialog } from "@headlessui/react";
import React, { useRef } from "react";
import { useForm, Controller } from "react-hook-form";
import { GrClose } from "react-icons/gr";

import { Button } from "src/components/button";
import { SkylarkObjectFieldInput } from "src/components/inputs";
import { LanguageSelect, Select } from "src/components/inputs/select";
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
import { splitMetadataIntoSystemTranslatableGlobal } from "src/lib/skylark/objects";

interface CreateObjectModalProps {
  isOpen: boolean;
  objectType?: SkylarkObjectType;
  setIsOpen: (b: boolean) => void;
  onObjectCreated: (o: SkylarkObjectIdentifier) => void;
}

const objectTypeKey = "__objectType";

const formHasObjectPropertyValues = (values: object) => {
  const fieldWithValues = Object.entries(values).filter(
    ([key, value]) => !key.startsWith("_") && value !== "",
  );

  return fieldWithValues.length > 0;
};

export const CreateObjectModal = ({
  isOpen,
  objectType: defaultObjectType,
  setIsOpen,
  onObjectCreated,
}: CreateObjectModalProps) => {
  const { objectTypes } = useSkylarkObjectTypes(true);
  const {
    handleSubmit,
    watch,
    control,
    register,
    getValues,
    formState,
    reset,
  } = useForm<Record<string, SkylarkObjectMetadataField>>({
    defaultValues: {
      [objectTypeKey]: defaultObjectType,
    },
  });

  const closeModal = () => {
    reset({});
    setIsOpen(false);
  };

  const objectType = watch(objectTypeKey) as string;
  const values = watch();

  const { objectOperations } = useSkylarkObjectOperations(objectType);

  const { createObject, isLoading: isCreatingObject } = useCreateObject({
    objectType,
    onSuccess: (object) => {
      onObjectCreated?.(object);
      closeModal();
    },
  });

  const onSubmit = ({
    _language,
    ...metadata
  }: Record<string, SkylarkObjectMetadataField>) =>
    createObject(_language as string, metadata);

  const { systemMetadataFields, languageGlobalMetadataFields } =
    objectOperations
      ? splitMetadataIntoSystemTranslatableGlobal(
          objectOperations.operations.create.inputs.map(({ name }) => name),
          objectOperations.operations.create.inputs,
        )
      : { systemMetadataFields: [], languageGlobalMetadataFields: [] };

  const objectTypeSelectRef = useRef(null);
  return (
    <Dialog
      open={isOpen}
      onClose={closeModal}
      className="font-body relative z-50"
      data-testid="create-object-modal"
      initialFocus={objectTypeSelectRef}
    >
      <div
        className="fixed inset-0 bg-black/40"
        aria-hidden="true"
        data-testid="dialog-background"
      />

      <div className="fixed inset-0 flex items-center justify-center p-2 text-sm">
        <Dialog.Panel className="relative mx-auto h-full max-h-[90%] w-full max-w-3xl overflow-y-auto rounded bg-white p-6 md:w-4/5 md:p-10">
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
              name={objectTypeKey}
              control={control}
              render={({ field }) => (
                <Select
                  className="w-full"
                  variant="primary"
                  disabled={!objectTypes}
                  label="Object Type"
                  labelVariant="form"
                  selected={(field.value as string) || ""}
                  placeholder="Select Object Type to get started"
                  options={
                    objectTypes?.map((opt) => ({
                      value: opt,
                      label: opt,
                    })) || []
                  }
                  ref={objectTypeSelectRef}
                  onChange={field.onChange}
                />
              )}
            />
            {objectOperations && (
              <div>
                {objectOperations.isTranslatable && (
                  <Controller
                    name="_language"
                    control={control}
                    render={({ field }) => (
                      <LanguageSelect
                        className="w-full"
                        variant="primary"
                        label="Object Language"
                        labelVariant="form"
                        rounded={false}
                        disabled={!objectTypes}
                        selected={(field.value as string) || ""}
                        onChange={field.onChange}
                      />
                    )}
                  />
                )}
                <div className="mt-10">
                  {[
                    {
                      id: "system",
                      title: "System Metadata",
                      metadataFields: systemMetadataFields,
                    },
                    {
                      id: "languageGlobal",
                      title: "Translatable & Global Metadata",
                      metadataFields: languageGlobalMetadataFields,
                    },
                  ].map(({ id, title, metadataFields }) => (
                    <div key={id} className="mb-8">
                      <h3 className="mb-2 text-base font-bold underline">
                        {title}
                      </h3>
                      {metadataFields.map(({ field, config }) => {
                        if (config) {
                          return (
                            <SkylarkObjectFieldInput
                              key={field}
                              field={field}
                              config={config}
                              control={control}
                              register={register}
                              value={getValues(field)}
                              formState={formState}
                            />
                          );
                        }
                      })}
                    </div>
                  ))}
                </div>
                <div className="flex justify-end space-x-2">
                  <Button
                    variant="primary"
                    className="mt-4"
                    loading={isCreatingObject}
                    type="submit"
                    disabled={
                      !objectOperations || !formHasObjectPropertyValues(values)
                    }
                    success
                  >
                    {isCreatingObject
                      ? `Creating ${objectType}`
                      : `Create ${objectType || "object"}`}
                  </Button>
                  <Button
                    variant="outline"
                    className="mt-4"
                    type="button"
                    danger
                    disabled={isCreatingObject}
                    onClick={closeModal}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </form>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
};
