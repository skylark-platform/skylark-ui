import { Dialog } from "@headlessui/react";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { GrClose } from "react-icons/gr";
import { toast } from "react-toastify";

import { Button } from "src/components/button";
import { SkylarkObjectFieldInput } from "src/components/inputs";
import { LanguageSelect, ObjectTypeSelect } from "src/components/inputs/select";
import { Toast } from "src/components/toast/toast.component";
import { useUpdateObjectMetadata } from "src/hooks/objects/update/useUpdateObjectMetadata";
import { useCreateObject } from "src/hooks/objects/useCreateObject";
import { useSkylarkObjectOperations } from "src/hooks/useSkylarkObjectTypes";
import {
  ParsedSkylarkObjectConfig,
  SkylarkGraphQLObjectConfig,
  SkylarkObjectIdentifier,
  SkylarkObjectMetadataField,
  SkylarkObjectType,
} from "src/interfaces/skylark";
import { splitMetadataIntoSystemTranslatableGlobal } from "src/lib/skylark/objects";
import { userIsOnMac } from "src/lib/utils";

interface CreateObjectModalProps {
  isOpen: boolean;
  objectType?: SkylarkObjectType;
  createTranslation?: {
    existingLanguages: string[];
    objectTypeDisplayName?: string;
    objectDisplayName?: string;
  } & SkylarkObjectIdentifier;
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
  createTranslation,
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
    setValue,
  } = useForm<Record<string, SkylarkObjectMetadataField>>();

  const submitButtonRef = useRef<HTMLButtonElement | null>(null);

  const isCreateTranslationModal = !!createTranslation;

  const [{ objectType, config: objectTypeConfig }, setObjectTypeWithConfig] =
    useState<{ objectType: string; config?: ParsedSkylarkObjectConfig }>({
      objectType: defaultObjectType || "",
    });

  const objectTypeDisplayName = isCreateTranslationModal
    ? createTranslation.objectTypeDisplayName || createTranslation.objectType
    : objectTypeConfig?.objectTypeDisplayName || objectType;

  const closeModal = () => {
    reset({});
    setObjectTypeWithConfig({ objectType: "", config: undefined });
    setIsOpen(false);
  };

  const values = watch();

  const { objectOperations } = useSkylarkObjectOperations(
    isCreateTranslationModal ? createTranslation.objectType : objectType,
  );

  const { createObject, isLoading: isCreatingObject } = useCreateObject({
    objectType,
    onSuccess: (object) => {
      onObjectCreated?.(object);
      closeModal();
    },
  });

  const {
    updateObjectMetadata,
    isUpdatingObjectMetadata: isCreatingTranslation,
  } = useUpdateObjectMetadata({
    objectType: createTranslation?.objectType || "",
    onSuccess: (object) => {
      onObjectCreated?.(object);
      toast.success(
        <Toast
          title={`Translation "${object.language}" created`}
          message={`The "${
            object.language
          }" translation has been created for the "${
            createTranslation?.objectDisplayName || object.uid
          }" ${objectTypeDisplayName}.`}
        />,
      );
      closeModal();
    },
  });

  const onSubmit = useCallback(
    ({
      _language,
      ...metadata
    }: Record<string, SkylarkObjectMetadataField>) => {
      if (isCreateTranslationModal) {
        return updateObjectMetadata({
          uid: createTranslation.uid,
          language: _language as string,
          metadata,
        });
      }
      createObject(_language as string, metadata);
    },
    [
      createObject,
      createTranslation?.uid,
      isCreateTranslationModal,
      updateObjectMetadata,
    ],
  );

  useEffect(() => {
    const handleSaveKeyPress = (e: KeyboardEvent) => {
      const isMac = userIsOnMac();

      if ((isMac ? e.metaKey : e.ctrlKey) && e.key === "s") {
        e.preventDefault();
        submitButtonRef?.current?.scrollIntoView?.();
        if (!submitButtonRef?.current?.disabled) {
          submitButtonRef?.current?.click();
        }
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleSaveKeyPress);
      return () => document.removeEventListener("keydown", handleSaveKeyPress);
    }
  }, [isOpen]);

  const {
    systemMetadataFields,
    globalMetadataFields,
    translatableMetadataFields,
  } = objectOperations
    ? splitMetadataIntoSystemTranslatableGlobal(
        objectOperations.operations.create.inputs.map(({ name }) => name),
        objectOperations.operations.create.inputs,
        objectOperations.fieldConfig,
        objectTypeConfig?.fieldConfig,
      )
    : {
        systemMetadataFields: [],
        globalMetadataFields: [],
        translatableMetadataFields: [],
      };

  const objectTypeSelectRef = useRef(null);

  const sectionConfig = {
    system: {
      id: "system",
      title: "System Metadata",
      metadataFields: systemMetadataFields,
    },
    translatable: {
      id: "translatable",
      title: "Translatable Metadata",
      metadataFields: translatableMetadataFields,
    },
    global: {
      id: "global",
      title: "Global Metadata",
      metadataFields: globalMetadataFields,
    },
  };

  const formSections = isCreateTranslationModal
    ? [sectionConfig.translatable]
    : [sectionConfig.system, sectionConfig.translatable, sectionConfig.global];

  const isExistingTranslation =
    isCreateTranslationModal && values._language
      ? createTranslation.existingLanguages.includes(values._language as string)
      : false;

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
            className="absolute right-4 top-4 sm:right-8 sm:top-9"
            onClick={closeModal}
            tabIndex={-1}
          >
            <GrClose className="text-xl" />
          </button>

          <Dialog.Title className="mb-2 font-heading text-2xl md:mb-4 md:text-3xl">
            {isCreateTranslationModal
              ? `Create ${objectTypeDisplayName} Translation`
              : `Create ${objectTypeDisplayName || "Object"}`}
          </Dialog.Title>
          <Dialog.Description>
            {isCreateTranslationModal
              ? "Select language and add translatable data."
              : "Select Object Type to get started."}
          </Dialog.Description>
          <form
            className="mt-8 flex w-full flex-col justify-end gap-4"
            onSubmit={handleSubmit(onSubmit)}
          >
            {!isCreateTranslationModal && (
              <ObjectTypeSelect
                className="w-full"
                variant="primary"
                label="Object Type"
                labelVariant="form"
                placeholder="Select Object Type to get started"
                selected={objectType}
                onChange={setObjectTypeWithConfig}
              />
            )}
            {objectOperations && (
              <div>
                {(objectOperations.isTranslatable ||
                  isCreateTranslationModal) && (
                  <>
                    <Controller
                      name="_language"
                      control={control}
                      render={({ field }) => {
                        return (
                          <LanguageSelect
                            name="_language"
                            className="w-full"
                            variant="primary"
                            label="Object Language"
                            labelVariant="form"
                            useDefaultLanguage={!isCreateTranslationModal}
                            rounded={false}
                            selected={field.value as string | undefined}
                            onChange={(str: string) => {
                              field.onChange(str);
                            }}
                            onValueClear={() => setValue("_language", "")}
                          />
                        );
                      }}
                    />
                    {isExistingTranslation && (
                      <p className="-mb-4 mt-2 text-error">{`The language "${values._language}" is an existing translation.`}</p>
                    )}
                  </>
                )}
                <div className="mt-10">
                  {formSections
                    .filter(({ metadataFields }) => metadataFields.length > 0)
                    .map(({ id, title, metadataFields }) => (
                      <div key={id} className="mb-8">
                        <h3 className="mb-2 text-base font-bold underline">
                          {title}
                        </h3>
                        {metadataFields.map(
                          ({ field, config }) =>
                            config && (
                              <SkylarkObjectFieldInput
                                idPrefix="create-object-modal"
                                key={field}
                                field={field}
                                config={config}
                                control={control}
                                register={register}
                                value={getValues(field)}
                                fieldConfigFromObject={objectTypeConfig?.fieldConfig?.find(
                                  ({ name }) => name === field,
                                )}
                                formState={formState}
                              />
                            ),
                        )}
                      </div>
                    ))}
                </div>
                <div className="flex justify-end space-x-2">
                  <Button
                    ref={submitButtonRef}
                    variant="primary"
                    className="mt-4"
                    loading={isCreatingObject || isCreatingTranslation}
                    type="submit"
                    disabled={
                      !objectOperations ||
                      !formHasObjectPropertyValues(values) ||
                      isExistingTranslation ||
                      (isCreateTranslationModal && !values._language)
                    }
                    success
                  >
                    {isCreatingObject
                      ? `Creating ${
                          isCreateTranslationModal
                            ? "Translation"
                            : objectTypeDisplayName
                        }`
                      : `Create ${
                          isCreateTranslationModal
                            ? "Translation"
                            : objectTypeDisplayName || "Object"
                        }`}
                  </Button>
                  <Button
                    variant="outline"
                    className="mt-4"
                    type="button"
                    danger
                    disabled={isCreatingObject || isCreatingTranslation}
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
