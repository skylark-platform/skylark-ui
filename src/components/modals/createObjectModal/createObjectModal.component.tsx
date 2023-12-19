import React, {
  Ref,
  forwardRef,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { useForm, Controller } from "react-hook-form";
import { toast } from "react-toastify";

import { Button } from "src/components/button";
import { SkylarkObjectFieldInput } from "src/components/inputs";
import { LanguageSelect, ObjectTypeSelect } from "src/components/inputs/select";
import {
  Modal,
  ModalDescription,
  ModalTitle,
} from "src/components/modals/base/modal";
import {
  GraphQLRequestErrorToast,
  Toast,
} from "src/components/toast/toast.component";
import { useUpdateObjectMetadata } from "src/hooks/objects/update/useUpdateObjectMetadata";
import { useCreateObject } from "src/hooks/objects/useCreateObject";
import {
  useSkylarkObjectOperations,
  useSkylarkObjectTypesWithConfig,
} from "src/hooks/useSkylarkObjectTypes";
import {
  ParsedSkylarkObjectConfig,
  SkylarkObjectIdentifier,
  SkylarkObjectMetadataField,
  SkylarkObjectType,
} from "src/interfaces/skylark";
import { splitMetadataIntoSystemTranslatableGlobal } from "src/lib/skylark/objects";
import { platformMetaKeyClicked } from "src/lib/utils";

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

const CreateObjectModalBody = forwardRef(
  (
    {
      objectType: defaultObjectType,
      createTranslation,
      closeModal,
      onObjectCreated,
    }: Omit<CreateObjectModalProps, "isOpen" | "setIsOpen"> & {
      isCreateTranslationModal: boolean;
      closeModal: () => void;
    },
    objectTypeSelectRef: Ref<HTMLInputElement>,
  ) => {
    const {
      handleSubmit,
      watch,
      control,
      register,
      getValues,
      formState,
      setValue,
    } = useForm<Record<string, SkylarkObjectMetadataField>>();

    const submitButtonRef = useRef<HTMLButtonElement | null>(null);

    const isCreateTranslationModal = !!createTranslation;

    const [
      { objectType, config: selectedObjectTypeConfig },
      setObjectTypeWithConfig,
    ] = useState<{ objectType: string; config?: ParsedSkylarkObjectConfig }>({
      objectType: defaultObjectType || "",
    });

    const { objectTypesWithConfig } = useSkylarkObjectTypesWithConfig();
    const objectTypeConfig =
      selectedObjectTypeConfig ||
      objectTypesWithConfig?.find(({ objectType: ot }) => ot === objectType)
        ?.config;

    const objectTypeDisplayName = isCreateTranslationModal
      ? createTranslation.objectTypeDisplayName || createTranslation.objectType
      : objectTypeConfig?.objectTypeDisplayName || objectType;

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
      onError: (error) => {
        toast.error(
          <GraphQLRequestErrorToast
            title={`Error creating object`}
            error={error}
          />,
          { autoClose: 10000 },
        );
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
      onError: (error, object) => {
        toast.error(
          <GraphQLRequestErrorToast
            title={`Error creating ${
              object.language ? `"${object.language}" ` : ""
            }translation`}
            error={error}
          />,
          { autoClose: 10000 },
        );
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
        if (platformMetaKeyClicked(e) && e.key === "s") {
          e.preventDefault();
          submitButtonRef?.current?.scrollIntoView?.();
          if (!submitButtonRef?.current?.disabled) {
            submitButtonRef?.current?.click();
          }
        }
      };

      document.addEventListener("keydown", handleSaveKeyPress);
      return () => document.removeEventListener("keydown", handleSaveKeyPress);
    }, []);

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
      : [
          sectionConfig.system,
          sectionConfig.translatable,
          sectionConfig.global,
        ];

    const isExistingTranslation =
      isCreateTranslationModal && values._language
        ? createTranslation.existingLanguages.includes(
            values._language as string,
          )
        : false;

    return (
      <>
        <ModalTitle>
          {isCreateTranslationModal
            ? `Create ${objectTypeDisplayName} Translation`
            : `Create ${objectTypeDisplayName || "Object"}`}
        </ModalTitle>
        <ModalDescription>
          {isCreateTranslationModal
            ? "Select language and add translatable data."
            : "Select Object Type to get started."}
        </ModalDescription>
        <form
          className="mt-8 flex w-full flex-col justify-end gap-4"
          onSubmit={handleSubmit(onSubmit)}
        >
          {!isCreateTranslationModal && (
            <ObjectTypeSelect
              ref={objectTypeSelectRef}
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
                              value={getValues(field) || ""}
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
      </>
    );
  },
);
CreateObjectModalBody.displayName = "CreateObjectModalBody";

export const CreateObjectModal = ({
  isOpen,
  setIsOpen,
  ...props
}: CreateObjectModalProps) => {
  const objectTypeSelectRef = useRef(null);

  const isCreateTranslationModal = !!props.createTranslation;

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
      {isOpen && (
        <CreateObjectModalBody
          {...props}
          ref={objectTypeSelectRef}
          isCreateTranslationModal={isCreateTranslationModal}
          closeModal={() => setIsOpen(false)}
        />
      )}
    </Modal>
  );
};
