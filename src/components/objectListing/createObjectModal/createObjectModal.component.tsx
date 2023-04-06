import { Dialog } from "@headlessui/react";
import React, { useRef, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { GrClose } from "react-icons/gr";

import { Button } from "src/components/button";
import { SkylarkObjectFieldInput } from "src/components/inputs";
import { LanguageSelect, ObjectTypeSelect } from "src/components/inputs/select";
import { useCreateObject } from "src/hooks/useCreateObject";
import { useSkylarkObjectOperations } from "src/hooks/useSkylarkObjectTypes";
import {
  SkylarkGraphQLObjectConfig,
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
  const {
    handleSubmit,
    watch,
    control,
    register,
    getValues,
    formState,
    reset,
  } = useForm<Record<string, SkylarkObjectMetadataField>>();
  const [{ objectType, config: objectTypeConfig }, setObjectTypeWithConfig] =
    useState<{ objectType: string; config?: SkylarkGraphQLObjectConfig }>({
      objectType: defaultObjectType || "",
    });

  const objectTypeDisplayName = objectTypeConfig?.display_name || objectType;

  const closeModal = () => {
    reset({});
    setIsOpen(false);
  };

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

  const {
    systemMetadataFields,
    globalMetadataFields,
    translatableMetadataFields,
  } = objectOperations
    ? splitMetadataIntoSystemTranslatableGlobal(
        objectOperations.operations.create.inputs.map(({ name }) => name),
        objectOperations.operations.create.inputs,
        objectOperations.fieldConfig,
      )
    : {
        systemMetadataFields: [],
        globalMetadataFields: [],
        translatableMetadataFields: [],
      };

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
            {`Create ${objectTypeDisplayName || "object"}`}
          </Dialog.Title>
          <Dialog.Description>
            Select Object Type to get started.
          </Dialog.Description>
          <form
            className="mt-8 flex w-full flex-col justify-end gap-4"
            onSubmit={handleSubmit(onSubmit)}
          >
            <ObjectTypeSelect
              className="w-full"
              variant="primary"
              label="Object Type"
              labelVariant="form"
              placeholder="Select Object Type to get started"
              selected={objectType}
              onChange={setObjectTypeWithConfig}
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
                      id: "translatable",
                      title: "Translatable Metadata",
                      metadataFields: translatableMetadataFields,
                    },
                    {
                      id: "global",
                      title: "Global Metadata",
                      metadataFields: globalMetadataFields,
                    },
                  ]
                    .filter(({ metadataFields }) => metadataFields.length > 0)
                    .map(({ id, title, metadataFields }) => (
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
                      ? `Creating ${objectTypeDisplayName}`
                      : `Create ${objectTypeDisplayName || "object"}`}
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
